import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateGameComponent } from './pages/create-game/create-game.component';
import { GameComponent } from './pages/game/game.component';

const routes: Routes = [
  {
    path: "game/:id",
    component: GameComponent,
  },
  {
    path: "**", // Route anything but game to homepage
    component: CreateGameComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
