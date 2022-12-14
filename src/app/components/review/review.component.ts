import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
/**
 * A component to show a player's completed chain.
 */
export class ReviewComponent implements OnInit {

  /** The chain to display */
  @Input() public chain: ReviewLink[] = [];

  /** The index in the chain of the link currently displayed */
  public index = 0;

  /** The link currently displayed */
  public link?: ReviewLink;

  /** Choose the first link on init */
  ngOnInit(): void {
    this.link = this.chain[this.index];
  }

  /** Change the current link to the next link */
  public next(): void {
    this.index = Math.min(this.chain.length - 1, this.index + 1);
    this.link = this.chain[this.index];
  }

  /** Change the current link to the previous link */
  public previous(): void {
    this.index = Math.max(0, this.index - 1);
    this.link = this.chain[this.index];
  }
}

/** Represents a link along with the username of the drawer/guesser */
export interface ReviewLink {
  /** The image (as a "url") */
  image?: string;
  /** The guess */
  guess?: string;
  /** The username of the user who drew/guessed */
  username: string;
}
