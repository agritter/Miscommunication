import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormatType, NgWhiteboardService } from 'ng-whiteboard';

@Component({
  selector: 'app-draw',
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.scss']
})
/**
 * A component used to draw a representation of a word.
 */
export class DrawComponent {

  /** The guess that should be drawn */
  @Input() public guess = "";

  /** The image that was drawn */
  @Output() public image = new EventEmitter<Blob>();

  /** Whether the done button has been pressed. Used to disable
   * done button between when it is pressed and the image is converted */
  public isSaving = false;

  constructor(private whiteboardService: NgWhiteboardService) { }

  /** Saves the image */
  public saveImage(): void {
    this.whiteboardService.save(FormatType.Svg);
  }

  /** Undoes the last line on the whiteboard */
  public undo(): void {
    this.whiteboardService.undo();
  }

  /** Redoes the last line on the whiteboard */
  public redo(): void {
    this.whiteboardService.redo();
  }

  /** Emits the image saved from the whiteboard */
  public onSave(image: string): void {
    this.isSaving = true;
    fetch(image)
      .then(res => res.blob())
      .then(blob => this.image.emit(blob));
  }
}
