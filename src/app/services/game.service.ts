import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { BehaviorSubject, combineLatest, distinctUntilChanged, startWith, Subscription } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
/**
 * Provides the game from firestore
 */
export class GameService {
  /** The game currently subscribed to */
  public game = new BehaviorSubject<Game>(GameService.undefinedGame);

  /** The subscription to the game */
  private gameSub?: Subscription;

  /** Represents the current link to guess/draw based off of (responsibleLink) */
  private currentResponsibility?: Responsibility;

  /** The link the user needs to guess/draw based off of */
  public responsibleLink = new BehaviorSubject<Link | undefined>(undefined);

  /** The subscription to the responsibility link */
  private responsibilityLinkSub?: Subscription;

  /** The link the user currently needs to guess/draw */
  public userLink = new BehaviorSubject<Link | undefined>(undefined);

  /** The subscription to the user link */
  private userLinkSub?: Subscription;

  /** The chain of the user */
  public chain = new BehaviorSubject<Link[] | undefined>(undefined);

  /** The subscription to the chain */
  private chainSub?: Subscription;

  /** The id of the game currently subscribed to */
  private gameId = "";

  /** The userId of the user */
  private userId = "";

  /** The initial game before it is retrieved from firestore */
  private static undefinedGame: Game = {
    isStarted: false,
    players: [],
  };

  /** Gets the userId */
  constructor(private dataBase: AngularFirestore, private userService: UserService) {
    this.userId = this.userService.getUserId();
  }

  /** Creates a game with the given id and adds the current user to that game */
  public createGame(gameId: string): void {
    this.dataBase.collection("games").doc(gameId).set({ isStarted: false });
    this.dataBase.collection("games").doc(gameId).collection("players").doc(this.userId).set({ playerNumber: 0 }); // Starter is always playerNumber 0
  }

  /** Subscribes to updates for the game with the given id */
  public subscribeToGame(gameId: string): void {
    this.gameId = gameId;

    // Clear out any current subscriptions and subject history
    this.currentResponsibility = undefined;
    this.gameSub?.unsubscribe();
    this.responsibilityLinkSub?.unsubscribe();
    this.userLinkSub?.unsubscribe();
    this.chainSub?.unsubscribe();
    this.game = new BehaviorSubject<Game>(GameService.undefinedGame);
    this.responsibleLink = new BehaviorSubject<Link | undefined>(undefined);
    this.userLink = new BehaviorSubject<Link | undefined>(undefined);
    this.chain = new BehaviorSubject<Link[] | undefined>(undefined);

    // Combine game document and its players collection into a game
    this.gameSub = combineLatest([this.dataBase.collection("games").doc<Game>(gameId).valueChanges(), this.dataBase.collection("games").doc(this.gameId).collection<Player>("players").valueChanges({ idField: 'userId' }).pipe(startWith([]))])
      .pipe(distinctUntilChanged()).subscribe(([game, players]) => {
        this.game.next({ ...game, players, exists: game !== undefined });
      });
  }

  /** Adds the user to the game with the given username and first word */
  public addUserToGame(username: string, word: string): void {
    const player = this.getDbPlayer(this.userId);
    const playerNumber = this.getPlayer(this.game.value, this.userId)?.playerNumber ?? -1;
    player.set({ playerNumber, username });
    player.collection("chain").doc<Link>("0").set({ guess: word });
  }

  /** Sets the game to started */
  public startGame(): void {
    this.dataBase.collection("games").doc(this.gameId).update({ isStarted: true });
  }

  /** Gives all the players a unique consecutive number. Used only by the game's starter */
  public orderPlayers(): void {
    // Do it in a batch so that players all retrieve the numbering for all players so the numberOfPlayers is accurate
    const batch = this.dataBase.firestore.batch();
    this.game.value.players.forEach((player, index) =>
      batch.update(this.getDbPlayer(player.userId).ref, { playerNumber: index })
    );
    batch.commit();
  }

  /** Returns a reference to the player's doc in firebase */
  private getDbPlayer(userId: string): AngularFirestoreDocument {
    return this.dataBase.collection<Game>("games").doc(this.gameId).collection<Player>("players").doc(userId);
  }

  /**
   * Chooses the next responsibility for the user
   * Returns true if there is a next responsibility, false if they have no more responsibilities
   */
  public goToNextResponsibility(): boolean {
    const numberOfPlayers = this.getNumberPlayers(this.game.value);
    if (this.currentResponsibility) {
      this.currentResponsibility = {
        playerNumber: (this.currentResponsibility!.playerNumber + 1) % numberOfPlayers,
        linkNumber: this.currentResponsibility!.linkNumber + 1
      };
    }
    else {
      // First responsibility
      const playerNumber = this.getPlayer(this.game.value, this.userId)!.playerNumber;
      this.currentResponsibility = {
        playerNumber: (playerNumber + (numberOfPlayers % 2)) % numberOfPlayers, // Current user if even, next user if odd
        linkNumber: 0
      };
    }

    if (this.currentResponsibility!.linkNumber === this.maxNumberOfLinks() - 1) {
      return false;
    }
    else {
      this.subscribeToCurrentResponsibility();
      return true;
    }
  }

  /** Subscribes to the responsibleLink and userLink based on the current responsibility */
  private subscribeToCurrentResponsibility(): void {
    this.responsibilityLinkSub?.unsubscribe();
    this.responsibleLink = new BehaviorSubject<Link | undefined>(undefined);

    this.responsibilityLinkSub = this.getDbLink(this.currentResponsibility!.playerNumber, this.currentResponsibility!.linkNumber).valueChanges().subscribe(link => {
      this.responsibleLink.next(link);
    });

    this.userLinkSub?.unsubscribe();
    this.userLink = new BehaviorSubject<Link | undefined>(undefined);

    this.userLinkSub = this.getDbLink(this.currentResponsibility!.playerNumber, this.currentResponsibility!.linkNumber + 1).valueChanges().subscribe(link => {
      this.userLink.next(link);
    });
  }

  /** Saves the guess to the current userLink */
  public saveGuess(guess: string): void {
    this.getDbLink(this.currentResponsibility!.playerNumber, this.currentResponsibility!.linkNumber + 1).set({ guess });
  }

  /**
   * Returns a function to save the image to the current userLink
   * The closure allows the saveImage function to be called for the current userLink
   * even after having moved on to the next responsibility
   */
  public getSaveImage(): (imageFilename: string) => void {
    const responsibilityCopy = this.currentResponsibility!;
    return (imageFilename: string): void => {
      this.getDbLink(responsibilityCopy.playerNumber, responsibilityCopy.linkNumber + 1).set({ image: imageFilename });
    }
  }

  /** Subscribes to the user's chain */
  public subscribeToChain(): void {
    this.chainSub = this.getDbPlayer(this.userId).collection<Link>("chain").valueChanges({ idField: "linkNumber" }).subscribe(links => {
      if (links) {
        // Sort by linkNumber
        links = links.filter(l => l.guess !== undefined || l.image !== undefined).sort((l1, l2) => parseInt(l1.linkNumber) - parseInt(l2.linkNumber));
      }
      this.chain.next(links);
    });
  }

  /** Returns a reference to the player's link's doc in firebase */
  private getDbLink(playerNumber: number, linkNumber: number): AngularFirestoreDocument<Link> {
    const userId = this.game.value.players.find(p => p.playerNumber === playerNumber)!.userId;
    return this.getDbPlayer(userId).collection("chain").doc<Link>(linkNumber.toString());
  }

  /** Whether the user is a player in the game */
  public userJoinedGame(game: Game): boolean {
    return this.getPlayer(game, this.userId)?.username !== undefined ?? false;
  }

  /** Whether the user is a player in the game and has been "ordered" by the starter */
  public userWasIncluded(game: Game): boolean {
    return this.userJoinedGame(game) && this.getPlayer(game, this.userId)?.playerNumber !== -1;
  }

  /** Whether the player started the game */
  public isStarter(game: Game): boolean {
    const player = this.getPlayer(game, this.userId)
    return !!player && (player.playerNumber === 0);
  }

  /** Gets the player from the game */
  private getPlayer(game: Game, userId: string): Player | undefined {
    return game.players.find(player => player.userId === userId)!;
  }

  /** Gets the number of players in the game (included by the starter) */
  public getNumberPlayers(game: Game): number {
    return game.players.filter(p => p.playerNumber !== -1).length;
  }

  /** The number of links in a completed chain */
  public maxNumberOfLinks(): number {
    const numberOfPlayers = this.getNumberPlayers(this.game.value);
    if (numberOfPlayers % 2 === 0) {
      return numberOfPlayers + 1;
    }
    else {
      return numberOfPlayers;
    }
  }

  /** Gets the user that drew/guessed for a link of a user's chain */
  public getUsernameByLinkNumber(linkNumber: number): string {
    const userPlayerNumber = this.getPlayer(this.game.value, this.userId)?.playerNumber!;
    let playerNumber: number;
    if (linkNumber === 0) {
      return this.getPlayer(this.game.value, this.userId)!.username!;
    }
    else {
      const numberOfPlayers = this.getNumberPlayers(this.game.value);
      playerNumber = (userPlayerNumber - linkNumber + 1 - (numberOfPlayers % 2) + numberOfPlayers) % numberOfPlayers; // Mod that is always positive
      return this.game.value.players.find(p => p.playerNumber === playerNumber)!.username ?? "";
    }
  }
}

/** A game */
export interface Game {
  /** Whether the game has started */
  isStarted?: boolean;
  /** Players in the game */
  players: Player[];
  /**
   * Whether the game exists.
   * Undefined represents that the game has yet to be retrieved
   */
  exists?: boolean;
}

/** A player in the game */
interface Player {
  /**
   * The number of the player
   * O is the game's starter
   * -1 is any other player before the game starts
   * After the game starts the players are given ordered numbers (0, 1, 2...)
  */
  playerNumber: number;
  /** The unique userId of the player */
  userId: string;
  /** The username of the player */
  username: string;
}

/**
 * A link in the chain of a user.
 * This could be a guess or image
 */
export interface Link {
  /** The guess (or for the first link the word or phrase) */
  guess?: string;
  /** The filename of the drawing */
  image?: string;
}

/** Represents the link the player needs to draw or guess for */
interface Responsibility {
  /** The player whose chain the responsibility is in */
  playerNumber: number;
  /** The responsibility's index in the link */
  linkNumber: number;
}