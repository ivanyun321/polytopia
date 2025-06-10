// src/app/app.ts
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
  owner: 'neutral' | 'red' | 'blue';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  mapWidth = 15;
  mapHeight = 15;
  tileWidth = 100;
  tileHeight = 20;

  hexTiles: HexTile[] = [];
  borderSegments: BorderSegment[] = [];

  panX = 0; panY = 0; zoomLevel = 1;
  private isPanning = false;
  private lastX = 0; private lastY = 0;

  mouseX = 0; mouseY = 0;
  hoveredTile: HexTile | null = null;

  ngOnInit() {
    this.generateMap();
  }

  private generateMap() {
    const capQ = Math.floor(Math.random() * this.mapWidth);
    const capR = Math.floor(Math.random() * this.mapHeight);
    const mirQ = this.mapWidth - 1 - capQ;
    const mirR = this.mapHeight - 1 - capR;

    // Initialize neutral tiles
    for (let r = 0; r < this.mapHeight; r++) {
      for (let q = 0; q < this.mapWidth; q++) {
        this.hexTiles.push({
          q, r,
          terrain: 'grass', owner: 'neutral', isCapital: false,
          screenX: (q - r) * (this.tileWidth / 2),
          screenY: (q + r) * (this.tileHeight * 0.75),
          imgUrl: 'assets/tiles/grass.png',
        });
      }
    }

    // Mark radius-2 clusters around each capital
    const seeds = [
      { owner: 'red' as const,  q: capQ, r: capR },
      { owner: 'blue' as const, q: mirQ, r: mirR }
    ];
    for (const { owner, q: cQ, r: cR } of seeds) {
      for (const tile of this.hexTiles) {
        if (this.hexDistance(tile.q, tile.r, cQ, cR) <= 2) {
          tile.owner = owner;
          if (tile.q === cQ && tile.r === cR) tile.isCapital = true;
        }
      }
    }

    this.buildBorderSegments();
  }

  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const dx = q1 - q2, dz = r1 - r2, dy = -dx - dz;
    return (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
  }

  /** Generate border edges for each cluster tile face */
  private buildBorderSegments() {
    this.borderSegments = [];
    // neighbor offsets and corner indices
    const dirs: Array<{dq:number,dr:number,c1:number,c2:number}> = [
      {dq:1, dr:0,  c1:0, c2:1},  // NE
      {dq:0, dr:-1, c1:1, c2:2},  // N
      {dq:-1,dr:-1, c1:2, c2:3},  // NW
      {dq:-1,dr:0,  c1:3, c2:4},  // SW
      {dq:0, dr:1,  c1:4, c2:5},  // S
      {dq:1, dr:1,  c1:5, c2:0},  // SE
    ];

    for (const tile of this.hexTiles.filter(t => t.isCapital)) {
      const owner = tile.owner;
      const cluster = this.hexTiles.filter(t => t.owner === owner);

      for (const t of cluster) {
        const corners = this.getCorners(t);
        for (const {dq, dr, c1, c2} of dirs) {
          const nb = this.hexTiles.find(x => x.q===t.q+dq && x.r===t.r+dr);
          if (!nb || nb.owner !== owner) {
            const [x1,y1] = corners[c1];
            const [x2,y2] = corners[c2];
            this.borderSegments.push({owner,x1,y1,x2,y2});
          }
        }
      }
    }
  }

  private getCorners(tile: HexTile): [number, number][] {
    const cx = tile.screenX + this.tileWidth/2;
    const cy = tile.screenY + this.tileHeight*0.75;
    const w2 = this.tileWidth/2;
    const h2 = this.tileHeight/4;  // quarter height for edge
    return [
      [cx + w2, cy      ], // NE
      [cx,      cy - h2 ], // N
      [cx - w2, cy      ], // NW
      [cx - w2, cy + h2 ], // SW
      [cx,      cy + 2*h2],// S
      [cx + w2, cy + h2 ], // SE
    ];
  }

  // Pan & zoom
  get mapTransform() { return `translate(${this.panX}px,${this.panY}px) scale(${this.zoomLevel})`; }
  onWheel(e:WheelEvent){e.preventDefault();const dz=e.deltaY<0?0.1:-0.1;this.zoomLevel=Math.max(0.2,Math.min(3,this.zoomLevel+dz));}
  onMouseDown(e:MouseEvent){e.preventDefault();this.isPanning=true;this.lastX=e.clientX;this.lastY=e.clientY;}
  @HostListener('document:mouseup') onMouseUp(){this.isPanning=false;}
  @HostListener('document:mousemove', ['$event']) onMouseMove(e:MouseEvent){
    if(this.isPanning){this.panX+=e.clientX-this.lastX;this.panY+=e.clientY-this.lastY;this.lastX=e.clientX;this.lastY=e.clientY;}
    this.mouseX=e.clientX;this.mouseY=e.clientY;
  }

  onTileMouseEnter(t:HexTile){this.hoveredTile=t;}
  onTileMouseLeave(t:HexTile){if(this.hoveredTile===t)this.hoveredTile=null;}
}
