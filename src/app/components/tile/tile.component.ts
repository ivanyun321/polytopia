import { Component, Input } from '@angular/core';
import { Tile } from '../../models/tile';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule], // ✅ Required for *ngIf, [ngStyle]
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.css']
})
export class TileComponent {
  @Input() tile!: Tile;

  get style() {
    return {
      transform: `translate(${(this.tile.x - this.tile.y) * 50}px, ${(this.tile.x + this.tile.y) * 25}px)`,
      zIndex: this.tile.x + this.tile.y
    };
  }

  getTileImage(): string {
    return `assets/tiles/${this.tile.terrainType.toLowerCase()}.png`;
  }

  getUnitImage(): string | null {
    return this.tile.unit ? `assets/units/${this.tile.unit.type.toLowerCase()}.png` : null;
  }
}
