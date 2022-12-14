import { Injectable } from '@angular/core';
import { words } from '../words/words';

@Injectable({
  providedIn: 'root'
})
/**
 * Provides random nouns
 */
export class WordsService {

  /** Returns a random noun */
  public randomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
  }
}
