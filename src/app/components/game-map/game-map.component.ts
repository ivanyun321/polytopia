import { Component, OnInit, HostListener } from '@angular/core';
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
  zoomLevel = 1;
  panX: number = 0;
  panY: number = 0;
  isDragging: boolean = false;
  wasDragging: boolean = false;
  lastX: number = 0;
  lastY: number = 0;
  initialMouseX: number = 0;
  initialMouseY: number = 0;
  dragThreshold: number = 5; // in pixels

  clickedTile: Tile | null = null;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.map$.subscribe(map => {
      this.tileList = map.flat().sort((a, b) => (a.x + a.y) - (b.x + b.y));
    });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY;
      this.zoomLevel += delta > 0 ? -0.1 : 0.1;
      this.zoomLevel = Math.max(0.5, Math.min(2, this.zoomLevel)); // Clamp
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.wasDragging = false;
    this.initialMouseX = this.lastX = event.clientX;
    this.initialMouseY = this.lastY = event.clientY;

    // Prevent default to stop image drag
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const dx = event.clientX - this.initialMouseX;
    const dy = event.clientY - this.initialMouseY;
    const movedEnough = Math.sqrt(dx * dx + dy * dy) > this.dragThreshold;

    if (movedEnough) {
      this.wasDragging = true;
      this.panX += event.clientX - this.lastX;
      this.panY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
    if (this.wasDragging) {
      event.preventDefault();
      event.stopPropagation();
      return; // don't process click
    }

    const target = event.target as HTMLElement;
    if (target && target.classList.contains('tile-image')) {
      // Tile clicked without dragging
      const tileIndex = target.getAttribute('data-tile-index');
      if (tileIndex) {
        this.clickedTile = this.tileList[+tileIndex];
        console.log('Tile clicked:', this.clickedTile);
      }
    }
  }
}
