import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HexTile {
  q: number;
  r: number;
  terrain: 'grass';
  owner: 'neutral' | 'red' | 'blue';
  isCapital: boolean;
  screenX: number;
  screenY: number;
  imgUrl: string;
}

interface BorderSegment {
  owner: 'red' | 'blue';
  x1: number; y1: number;
  x2: number; y2: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  // ─── Grid settings ─────────────────────────────
  mapWidth = 15;
  mapHeight = 15;
  tileWidth = 100;   // px
  tileHeight = 20;   // px

  // ─── Data stores ────────────────────────────────
  hexTiles: HexTile[] = [];
  borderSegments: BorderSegment[] = [];

  // ─── Pan & zoom state ──────────────────────────
  panX = 0; panY = 0; zoomLevel = 1;
  private isPanning = false;
  private lastX = 0; private lastY = 0;

  // ─── Mouse & hover state ───────────────────────
  mouseX = 0; mouseY = 0;
  hoveredTile: HexTile | null = null;

  ngOnInit(): void {
    this.generateMap();
  }

  private generateMap() {
    // 1) choose one random capital, mirror it
    const capQ = Math.floor(Math.random() * this.mapWidth);
    const capR = Math.floor(Math.random() * this.mapHeight);
    const mirQ = this.mapWidth - 1 - capQ;
    const mirR = this.mapHeight - 1 - capR;

    // 2) initialize all tiles as neutral grass
    for (let r = 0; r < this.mapHeight; r++) {
      for (let q = 0; q < this.mapWidth; q++) {
        this.hexTiles.push({
          q, r,
          terrain: 'grass',
          owner: 'neutral',
          isCapital: false,
          screenX: (q - r) * (this.tileWidth / 2),
          screenY: (q + r) * (this.tileHeight / 2),
          imgUrl: `assets/tiles/grass.png`
        });
      }
    }

    // 3) mark radius-2 clusters around each of the two capitals
    const seeds = [
      { owner: 'red'  as const, q: capQ, r: capR },
      { owner: 'blue' as const, q: mirQ, r: mirR }
    ];
    for (const { owner, q: cQ, r: cR } of seeds) {
      for (const tile of this.hexTiles) {
        if (this.hexDistance(tile.q, tile.r, cQ, cR) <= 2) {
          tile.owner = owner;
          if (tile.q === cQ && tile.r === cR) {
            tile.isCapital = true;
          }
        }
      }
    }

    // 4) build exact tile-edge border segments
    this.buildBorderSegments();
  }

  /** axial hex distance */
  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const dx = q1 - q2, dz = r1 - r2, dy = -dx - dz;
    return (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
  }

  /** build one <line> per missing‐neighbor edge for each owned tile */
  private buildBorderSegments() {
    this.borderSegments = [];
    const halfW = this.tileWidth / 2;
    const halfH = this.tileHeight / 2;

    // corner offsets from *tile center* for the diamond shape
    const corners: [number,number][] = [
      [ 0,   -halfH],  // top
      [ halfW, 0  ],  // right
      [ 0,    halfH],  // bottom
      [-halfW, 0  ],  // left
    ];

    // neighbor directions + which two corners form that edge
    const dirs = [
      { dq:  0, dr: -1, c1: 3, c2: 0 }, // north edge: left→top
      { dq: +1, dr:  0, c1: 0, c2: 1 }, // east  edge: top→right
      { dq:  0, dr: +1, c1: 1, c2: 2 }, // south edge: right→bottom
      { dq: -1, dr:  0, c1: 2, c2: 3 }, // west  edge: bottom→left
    ];

    for (const tile of this.hexTiles) {
      if (tile.owner === 'neutral') continue;
      const owner = tile.owner as 'red'|'blue';

      // center of this tile in screen coords
      const cx = tile.screenX + halfW;
      const cy = tile.screenY + halfH;

      for (const {dq,dr,c1,c2} of dirs) {
        const nb = this.hexTiles.find(t => t.q === tile.q + dq && t.r === tile.r + dr);
        if (!nb || nb.owner === 'neutral') {
          // draw this edge
          const [ox1, oy1] = corners[c1];
          const [ox2, oy2] = corners[c2];
          this.borderSegments.push({
            owner,
            x1: cx + ox1,
            y1: cy + oy1,
            x2: cx + ox2,
            y2: cy + oy2
          });
        }
      }
    }
  }

  // ─── Pan & Zoom Handlers ───────────────────────────
  get mapTransform(): string {
    return `translate(${this.panX}px,${this.panY}px) scale(${this.zoomLevel})`;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const dz = event.deltaY < 0 ? 0.1 : -0.1;
    this.zoomLevel = Math.max(0.2, Math.min(3, this.zoomLevel + dz));
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isPanning = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isPanning = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isPanning) {
      this.panX += event.clientX - this.lastX;
      this.panY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  // ─── Hover per‐tile ─────────────────────────────────
  onTileMouseEnter(tile: HexTile) {
    this.hoveredTile = tile;
  }
  onTileMouseLeave(tile: HexTile) {
    if (this.hoveredTile === tile) {
      this.hoveredTile = null;
    }
  }
}
