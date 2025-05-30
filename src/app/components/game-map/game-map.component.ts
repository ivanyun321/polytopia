import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { Tile } from '../../models/tile';
import { TileComponent } from '../tile/tile.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-map',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './game-map.component.html',
  styleUrls: ['./game-map.component.css']
})
export class GameMapComponent implements OnInit {
  tileList: Tile[] = [];

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.map$.subscribe(map => {
      this.tileList = map.flat().sort((a, b) => (a.x + a.y) - (b.x + b.y));
    });
  }
}
