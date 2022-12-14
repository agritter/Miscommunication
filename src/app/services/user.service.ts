import { Injectable } from '@angular/core';
import * as uuid from 'uuid';

@Injectable({
  providedIn: 'root'
})
/**
 * Provides a user's userId and username from local storage.
 */
export class UserService {

  /** Getter for the user's userId */
  public getUserId(): string {
    // Retrieve a userId from local storage, or if there isn't one generate a userId and save it in local storage
    const storedUserId = localStorage.getItem("userId");
    let userId: string;
    if (storedUserId) {
      userId = storedUserId;
    }
    else {
      userId = uuid.v4();
      localStorage.setItem("userId", userId);
    }
    return userId;
  }

  /** Getter for the user's username */
  public getUsername(): string {
    // Username from local storage or ""
    return localStorage.getItem("username") ?? "";
  }

  /** Saves the username to local storage */
  public setUsername(username: string) {
    localStorage.setItem("username", username);
  }
}
