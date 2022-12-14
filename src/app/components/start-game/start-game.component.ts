import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-start-game',
  templateUrl: './start-game.component.html',
  styleUrls: ['./start-game.component.scss']
})
/**
 * A component shown only to the game starter. Lists the players and gives a start button.
 */
export class StartGameComponent {
  /** The players that have joined the game */
  @Input() public playerNames: string[] = [];

  /** An event emitted when the start button is pressed */
  @Output() public start = new EventEmitter<void>();

  /** Whether the start button has been pressed. Used to disable
   * start button between when it is pressed and the firebase update completes */
  public isStarting = false;

  /** Emits the start event */
  public emitStart(): void {
    this.start.next();
    this.isStarting = true;
  }
}
