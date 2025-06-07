import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HexTile {
  q: number;
  r: number;
  terrain: 'grass';       // only grass for now
  owner: string;         // 'neutral', 'red', 'blue'
  isCapital: boolean;    // true only for the two capitals
  screenX: number;
  screenY: number;
  imgUrl: string;
}

interface BorderEdge {
  owner: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

interface BorderPath {
  owner: string;
  d: string;  // SVG path data
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule]
})
export class App implements OnInit {
  // Map dimensions
  mapWidth = 15;
  mapHeight = 15;

  // Tile size (must match your 100×30 PNG)
  tileWidth = 100;
  tileHeight = 30;

  // The array of tiles
  hexTiles: HexTile[] = [];

  // Border paths (one continuous dashed path per owner)
  borderPaths: BorderPath[] = [];

  // Pan & Zoom state
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  isPanning = false;
  lastMouseX = 0;
  lastMouseY = 0;

  ngOnInit(): void {
    this.generateIsoMap();
  }

  /** Distance in axial coords */
  private hexDistance(q1: number, r1: number, q2: number, r2: number) {
    const dx = q1 - q2, dz = r1 - r2, dy = -dx - dz;
    return (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
  }

  generateIsoMap() {
    // 1) pick one random capital
    const capQ = Math.floor(Math.random() * this.mapWidth);
    const capR = Math.floor(Math.random() * this.mapHeight);
    // 2) mirror it
    const mirQ = this.mapWidth - 1 - capQ;
    const mirR = this.mapHeight - 1 - capR;

    // 3) build all tiles
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

    // 4) mark radius‐1 clusters
    const capitals = [
      { owner: 'red',  q: capQ, r: capR },
      { owner: 'blue', q: mirQ, r: mirR }
    ];
    for (const { owner, q: cQ, r: cR } of capitals) {
      for (const tile of this.hexTiles) {
        if (this.hexDistance(tile.q, tile.r, cQ, cR) <= 1) {
          tile.owner = owner;
          if (tile.q === cQ && tile.r === cR) {
            tile.isCapital = true;
          }
        }
      }
    }

    // 5) build continuous border paths
    this.makeBorderPaths();
  }

  /** Stitch outer edges into smooth dashed SVG paths */
  private makeBorderPaths() {
    const halfW = this.tileWidth / 2;
    const halfH = this.tileHeight / 2;
    const findTile = (q: number, r: number) =>
      this.hexTiles.find(t => t.q === q && t.r === r);

    // collect all outer edges
    const edges: BorderEdge[] = [];
    for (const t of this.hexTiles) {
      if (t.owner === 'neutral') continue;
      const owner = t.owner;
      const candidates = [
        { dq:1, dr:0,  p1:[t.screenX,      t.screenY-halfH], p2:[t.screenX+halfW, t.screenY    ] },
        { dq:0, dr:1,  p1:[t.screenX+halfW, t.screenY     ], p2:[t.screenX,      t.screenY+halfH] },
        { dq:-1,dr:0,  p1:[t.screenX,      t.screenY+halfH], p2:[t.screenX-halfW, t.screenY    ] },
        { dq:0, dr:-1, p1:[t.screenX-halfW, t.screenY     ], p2:[t.screenX,      t.screenY-halfH] }
      ];
      for (const e of candidates) {
        const nb = findTile(t.q + e.dq, t.r + e.dr);
        if (!nb || nb.owner !== owner) {
          edges.push({ owner, x1:e.p1[0], y1:e.p1[1], x2:e.p2[0], y2:e.p2[1] });
        }
      }
    }

    // group by owner
    const byOwner = new Map<string, BorderEdge[]>();
    for (const e of edges) {
      (byOwner.get(e.owner) || byOwner.set(e.owner, []).get(e.owner)!).push(e);
    }

    this.borderPaths = [];
    // stitch each owner’s edges
    for (const [owner, list] of byOwner.entries()) {
      if (!list.length) continue;
      const pts: [number,number][] = [];
      // start with first edge
      let e = list.shift()!;
      pts.push([e.x1,e.y1],[e.x2,e.y2]);
      // chain remaining
      while (list.length) {
        const last = pts[pts.length-1];
        const idx = list.findIndex(ed =>
          (ed.x1===last[0]&&ed.y1===last[1]) || (ed.x2===last[0]&&ed.y2===last[1])
        );
        if (idx<0) break;
        const next = list.splice(idx,1)[0];
        if (next.x1===last[0]&&next.y1===last[1]) {
          pts.push([next.x2,next.y2]);
        } else {
          pts.push([next.x1,next.y1]);
        }
      }
      // build d string
      const d = pts.map((pt,i)=>(i? 'L':'M')+pt[0]+' '+pt[1]).join(' ') + ' Z';
      this.borderPaths.push({ owner, d });
    }
  }

  // ───────────────────────────────────────────
  // Pan & Zoom handlers
  // ───────────────────────────────────────────
  get mapTransform() {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  }
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    this.zoomLevel = Math.min(3, Math.max(0.2, this.zoomLevel+delta));
  }
  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isPanning = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }
  onMouseMove(event: MouseEvent) {
    if (!this.isPanning) return;
    const dx = event.clientX - this.lastMouseX;
    const dy = event.clientY - this.lastMouseY;
    this.panX += dx;
    this.panY += dy;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }
  onMouseUp() { this.isPanning = false; }

  @HostListener('document:mousemove', ['$event'])
  trackMouse(event: MouseEvent) {
    // optional overlay tracking
  }
}