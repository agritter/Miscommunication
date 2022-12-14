import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from 'src/app/services/game.service';
import { WordsService } from 'src/app/services/words.service';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
/**
 * The homepage of the game. Has button to create a new game.
 */
export class CreateGameComponent {

  constructor(private gameService: GameService, private wordsService: WordsService, private router: Router, private route: ActivatedRoute) { }

  /**
   * Creates a new game and routes to that game's url.
   */
  public createGame(): void {
    const gameId = `${this.wordsService.randomWord()}-${this.wordsService.randomWord()}-${this.wordsService.randomWord()}`;
    this.gameService.createGame(gameId);
    this.router.navigate([`../game/${gameId}`], { relativeTo: this.route });
  }
}
