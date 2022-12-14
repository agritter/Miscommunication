import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgWhiteboardModule } from 'ng-whiteboard';
import { CreateGameComponent } from './pages/create-game/create-game.component';
import { GameComponent } from './pages/game/game.component';
import { DrawComponent } from './components/draw/draw.component';
import { GuessComponent } from './components/guess/guess.component';
import { ReviewComponent } from './components/review/review.component';
import { MessageComponent } from './components/message/message.component';
import { JoinGameComponent } from './components/join-game/join-game.component';
import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StartGameComponent } from './components/start-game/start-game.component';

@NgModule({
  declarations: [
    AppComponent,
    CreateGameComponent,
    GameComponent,
    DrawComponent,
    GuessComponent,
    ReviewComponent,
    MessageComponent,
    JoinGameComponent,
    StartGameComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgWhiteboardModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireStorageModule,
    FormsModule,
    NoopAnimationsModule,
    MatButtonModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
