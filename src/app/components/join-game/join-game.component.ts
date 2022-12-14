import { Component, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { WordsService } from 'src/app/services/words.service';

@Component({
  selector: 'app-join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.scss']
})
/**
 * Component shown before the user joins the game. Allows them to pick a username and the first word in their chain.
 */
export class JoinGameComponent {

  /** The username chosen by the user */
  public username: string;

  /** The word or phrase chosen by the user */
  public word = "";

  /** Whether the join button has been pressed. Used to disable
   * join button between when it is pressed and the firebase update completes */
  public isJoining = false;

  /** The join event that is emitted back to the game component */
  @Output() public join = new EventEmitter<{ word: string, username: string }>();

  constructor(private userService: UserService, private wordsService: WordsService) {
    this.username = this.userService.getUsername();
    this.chooseRandomWord();
  }

  /** Changes word to a random word */
  public chooseRandomWord(): void {
    this.word = this.wordsService.randomWord();
  }

  /** Emits the join event with the word and username */
  public emitJoin(): void {
    this.join.next({ word: this.word, username: this.username });
    this.isJoining = true;
  }
}
