import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
/**
 * A component to display a message to the user
 */
export class MessageComponent {

  /** The message to display */
  @Input() public message = "";
}
