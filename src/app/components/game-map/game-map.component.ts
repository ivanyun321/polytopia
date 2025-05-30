import { Component, OnInit, HostListener } from '@angular/core';
import { GameService } from '../../services/game.service';
import { Tile } from '../../models/tile';
import { TileComponent } from '../tile/tile.component';
import { CommonModule } from '@angular/common'; // ✅ This is necessary

@Component({
  selector: 'app-game-map',
  standalone: true,
  imports: [TileComponent, CommonModule], // ✅ This is the most important part
  templateUrl: './game-map.component.html',
  styleUrls: ['./game-map.component.css']
})
export class GameMapComponent implements OnInit {
  tileList: Tile[] = [];
  zoomLevel: number = 1;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.map$.subscribe(map => {
      console.log('Raw map data:', map);
      this.tileList = map.flat().sort((a, b) => (a.x + a.y) - (b.x + b.y));
      console.log('tileList:', this.tileList);
    });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY;
      this.zoomLevel += delta > 0 ? -0.1 : 0.1;
      this.zoomLevel = Math.max(0.5, Math.min(2, this.zoomLevel));
    }
  }
}
