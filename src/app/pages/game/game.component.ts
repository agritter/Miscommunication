import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, map, race, Subject, Subscription } from 'rxjs';
import { GameService, Game, Link } from 'src/app/services/game.service';
import { ReviewLink } from 'src/app/components/review/review.component';
import { ImageService } from 'src/app/services/image.service';
import { UserService } from 'src/app/services/user.service';


/* The current state of the user's game */
enum GameState {
  /** The game and players are being retrieved from firestore. */
  loadingGame,
  /**
   * The user is shown a screen to pick a username and word;
   * ends when the player joins the game.
   */
  joinGame,
  /**
   * A state only for the game's starter where the starter can start the game
   * ends when the game starts.
   */
  startGame,
  /** A state for non-starters before the game starts */
  waitForGameStart,
  /**
   * The next link (drawing or guess) the player needs to draw or guess for is
   * being retrieved or has not yet been submitted by another player;
   * ends when either the link the user needs is retrieved or the link after that link is retrieved
   * proving the user already did that link (done in another tab or before a reload).
   */
  waitingForOtherPlayer,
  /** The user is given a guess and has to submit a drawing for that guess;
   * ends when the drawing is submitted or the link that drawing would have been for
   * is retrieved (done in another tab or before a reload)
   */
  draw,
  /** The user is given a drawing and has to submit a guess for that drawing;
   * ends when the guess is submitted or the link that guess would have been for
   * is retrieved (done in another tab or before a reload) */
  guess,
  /** The user's full chain has yet to be retrieved */
  waitingForReview,
  /** The user is shown all of the drawings and guesses in their chain */
  review,
  /** The game is started and the user is not included */
  gameAlreadyStarted,
  /** There is no game with the id in the url in firebase */
  gameDoesNotExist,
}

/**
 * A component that determines the state of the game and shows different components based on it.
 */
@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  /** The current state of the game backing field */
  private _gameState = GameState.loadingGame;

  /** Get the current state of the game */
  public get gameState(): GameState {
    return this._gameState;
  }

  /** Sets the current state of the game and updates the subscription based on it */
  private set gameState(state: GameState) {
    this._gameState = state;
    this.setGameSubscription();
  }

  /** Make enum definition available in html */
  public GameState = GameState;

  /**
   * The component uses subscriptions to determine when it should move to the next state.
   * This keeps track of the current subscription.
   */
  private currentSub?: Subscription;

  /** The names of the players who have joined the game (to show in the start game component) */
  public playerNames: string[] = [];

  /**
   *  The word chosen in the join game component
   * or the guess shown in the draw component
   */
  public guess = "";

  /** The url for the image shown in the guess component */
  public imageUrl = "";

  /** The user's chain shown in the review component */
  public chain?: ReviewLink[];

  /** Used to signal that a guess was entered */
  private guessEntered?: Subject<string>;

  /** Used to signal that an image was entered */
  private imageEntered?: Subject<Blob>;

  constructor(private gameService: GameService, private userService: UserService, private imageService: ImageService, private route: ActivatedRoute) { }

  /** On component creation subscribe to the game and choose the first state */
  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('id'); // Id from url
    if (gameId) {
      this.gameService.subscribeToGame(gameId);
      this.gameState = GameState.loadingGame;
    }
    else {
      // No id entered in url
      this.gameState = GameState.gameDoesNotExist;
    }
  }

  /** Run when the loading game state is complete */
  private onLoadingGameComplete(game: Game): void {
    if (game.exists) {
      // The game will automatically go through states until it reaches the current state
      this.gameState = GameState.joinGame;
    }
    else {
      this.gameState = GameState.gameDoesNotExist;
    }
  }

  /** Run when the choose word game state is complete */
  private onJoinGameComplete(game: Game): void {
    if (game.isStarted!) {
      if (this.gameService.userJoinedGame(game)) {
        // Will continue through responsibilities until it reaches the current one
        this.goToNextResponsibilityState();
      }
      else {
        this.gameState = GameState.gameAlreadyStarted;
      }
    }
    else {
      if (this.gameService.isStarter(game)) {
        this.gameService.game.subscribe(game => this.playerNames = game.players.map(p => p.username));
        this.gameState = GameState.startGame;
      }
      else {
        this.gameState = GameState.waitForGameStart;
      }
    }
  }

  /** Run when the start game or wait for game start state is complete */
  private onGameStarted(game: Game): void {
    this.goToNextResponsibilityState();
  }

  /** Run when the waiting for other player game state is complete */
  private onWaitingForOtherPlayerComplete(link: Link | undefined): void {
    if (link) {
      if (link!.guess !== undefined) {
        // Guess to draw for
        this.guess = link!.guess;
        this.gameState = GameState.draw;
      }
      else {
        // Image to guess for
        this.imageService.getImage(link!.image!).then(imageUrl => {
          this.imageUrl = imageUrl;
          this.gameState = GameState.guess;
        });
      }
    }
    else {
      // link is only ever undefined here if the link after the one the user should draw/guess
      // for was found; just move to the next the link the user is responsible for.
      this.goToNextResponsibilityState();
    }
  }

  /** Run when the draw game state is complete */
  private onDrawComplete(image?: Blob): void {
    if (image) {
      const saveImage = this.gameService.getSaveImage(); // Get image saver for current responsibility before changing to next
      this.imageService.uploadImage(image).then(
        (filename) => {
          saveImage(filename);
        }
      );
    }
    this.goToNextResponsibilityState();
  }

  /** Run when the guess game state is complete */
  private onGuessComplete(guess?: string): void {
    if (guess !== undefined) { // "" is falsy
      this.gameService.saveGuess(guess);
    }
    this.goToNextResponsibilityState();
  }

  /** Run when the waiting for review game state is complete */
  private onWaitingForReviewComplete(chain: Link[] | undefined): void {
    // Change every image in a link from the filename to an imageUrl to be displayed and add a username
    Promise.all(chain!.map((link, index) => {
      const username = this.gameService.getUsernameByLinkNumber(index);
      if (link.image) {
        return new Promise<ReviewLink>((resolve, reject) => {
          this.imageService.getImage(link.image!).then(imageUrl => resolve({ ...link, image: imageUrl, username }))
        });
      }
      else {
        return new Promise<ReviewLink>((resolve, reject) => {
          resolve({ ...link, username });
        });
      }
    })).then(newChain => {
      this.chain = newChain;
      this.gameState = GameState.review;
    })
  }

  /**
   * Tells the game service to subscribe to the user's next responsibility and changes the state based
   * on whether the user has any more responsibilities
   */
  private goToNextResponsibilityState(): void {
    if (this.gameService.goToNextResponsibility()) {
      this.gameState = GameState.waitingForOtherPlayer;
    }
    else {
      // The user has no more responsibilities
      this.gameState = GameState.waitingForReview;
      // Start getting the user's chain for review
      this.gameService.subscribeToChain();
    }
  }

  /** Sets a subscription to complete the current game state */
  private setGameSubscription(): void {
    this.currentSub?.unsubscribe();
    // Rules: the sub should only every call it's subscription once (prevents the on...complete function from running multiple times)
    //        if there is a sub it should be the only way to leave the state (prevents the on...complete function and something else both changing states)
    switch (this.gameState) {
      case (GameState.loadingGame):
        this.currentSub = this.gameService.game
          .pipe(first<Game>(game => game.exists === false || (game.exists === true && game.players.length >= 1))) // At least one player indicated players have been retrieved
          .subscribe(this.onLoadingGameComplete.bind(this));
        break;
      case (GameState.joinGame):
        this.currentSub = this.gameService.game
          .pipe(first<Game>(game => game.isStarted! || this.gameService.userJoinedGame(game)))
          .subscribe(this.onJoinGameComplete.bind(this));
        break;
      case (GameState.startGame):
      case (GameState.waitForGameStart):
        this.currentSub = this.gameService.game
          .pipe(first<Game>(game => game.isStarted! && this.gameService.userWasIncluded(game)))
          .subscribe(this.onGameStarted.bind(this));
        break;
      case (GameState.waitingForOtherPlayer):
        this.currentSub = race(
          [this.gameService.responsibleLink.pipe(first<Link | undefined>(link => link !== undefined)),
          this.gameService.userLink.pipe(first<Link | undefined>(link => link !== undefined), map(link => undefined))]
        ).subscribe(this.onWaitingForOtherPlayerComplete.bind(this));
        break;
      case (GameState.draw):
        this.imageEntered = new Subject<Blob>(); // Recreate so don't retrieve old images
        this.currentSub = race([
          this.gameService.userLink.pipe(first<Link | undefined>(link => link !== undefined), map(link => undefined)),
          this.imageEntered!.pipe(first<Blob>(image => image !== undefined))])
          .subscribe(this.onDrawComplete.bind(this));
        break;
      case (GameState.guess):
        this.guessEntered = new Subject<string>(); // Recreate so don't retrieve old guesses
        this.currentSub = race([
          this.gameService.userLink.pipe(first<Link | undefined>(link => link !== undefined), map(link => undefined)),
          this.guessEntered!.pipe(first<string>(guess => guess !== undefined))])
          .subscribe(this.onGuessComplete.bind(this));
        break;
      case (GameState.waitingForReview):
        this.currentSub = this.gameService.chain
          .pipe(first<Link[] | undefined>(chain => chain?.length === this.gameService.maxNumberOfLinks()))
          .subscribe(this.onWaitingForReviewComplete.bind(this));
        break;
      default:
        break;
    }
  }

  /**
   * Assigns player numbers to the players and starts the game.
   * Triggered by the start button in the start game component
   */
  public startGame(): void {
    // Only the game starter sets each player numbers so they are consistent for all players
    this.gameService.orderPlayers();
    this.gameService.startGame();
  }

  /** Joins the game with the given username and word */
  public joinGame({ username, word }: { username: string, word: string }): void {
    this.gameService.addUserToGame(username, word);
    this.userService.setUsername(username);
  }

  /** Signals that the image was received from the draw component */
  public saveImage(image: Blob): void {
    this.imageEntered?.next(image);
  }

  /** Signals that the guess was received from the guess component */
  public saveGuess(guess: string): void {
    this.guessEntered?.next(guess);
  }

}
