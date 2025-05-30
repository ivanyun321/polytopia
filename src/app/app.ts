import { Component } from '@angular/core';
import { GameMapComponent } from './components/game-map/game-map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameMapComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {}
