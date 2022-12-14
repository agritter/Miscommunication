import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-guess',
  templateUrl: './guess.component.html',
  styleUrls: ['./guess.component.scss']
})
/**
 * A component to guess what a drawing represents.
 */
export class GuessComponent {

  /** The image (as a "url") to guess for */
  @Input() public image = "";

  /** Emits the user's guess */
  @Output() public guess = new EventEmitter<string>();

  /** The model two-way bound to the guess input */
  public guessInput = "";

  /** Emits the guess */
  public saveGuess(): void {
    this.guess.emit(this.guessInput);
  }
}
