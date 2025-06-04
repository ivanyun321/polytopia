// src/app/app.ts

import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HexTile {
  q: number;
  r: number;
  terrain: 'grass';
  screenX: number;
  screenY: number;
  imgUrl: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule]
})
export class App implements OnInit {
  // ────────────────
  // Mouse‐tracking (unchanged)
  // ────────────────
  mouseX = 0;
  mouseY = 0;
  hoverTag = '';

  // ────────────────
  // Isometric grid parameters (unchanged)
  // ────────────────
  mapWidth = 15;
  mapHeight = 15;

  tileWidth = 100; // must match your PNG’s width
  tileHeight = 30; // must match your PNG’s height

  hexTiles: HexTile[] = [];

  // ───────────────────────
  // NEW: Pan & Zoom state
  // ───────────────────────
  zoomLevel = 1;    // 100% by default
  panX = 0;         // no pan offset initially
  panY = 0;
  isPanning = false;
  lastMouseX = 0;
  lastMouseY = 0;

  // ───────────────────────
  // Angular initialization
  // ───────────────────────
  ngOnInit(): void {
    this.generateIsoMap();
  }

  // ─────────────────────────
  // Compute isometric tile positions
  // ─────────────────────────
  generateIsoMap() {
    const terrains: Array<HexTile['terrain']> = ['grass'];
    for (let r = 0; r < this.mapHeight; r++) {
      for (let q = 0; q < this.mapWidth; q++) {
        const terrain = terrains[0]; // always “grass” for now

        // Isometric math:
        const screenX = (q - r) * (this.tileWidth / 2);
        const screenY = (q + r) * (this.tileHeight / 2);

        const tile: HexTile = {
          q,
          r,
          terrain,
          screenX,
          screenY,
          imgUrl: `assets/tiles/${terrain}.png`
        };

        this.hexTiles.push(tile);
      }
    }
  }

  // ─────────────────────────
  // Getter for the combined pan+zoom transform
  // ─────────────────────────
  get mapTransform(): string {
    // First translate (panX, panY), then scale by zoomLevel
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  }

  // ─────────────────────────
  // Click on a tile
  // ─────────────────────────
  onHexClick(tile: HexTile) {
    console.log(`Clicked tile q=${tile.q}, r=${tile.r} terrain=${tile.terrain}`);
  }

  // ─────────────────────────
  // Mouse wheel → zoom
  // ─────────────────────────
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomDelta = event.deltaY < 0 ? 0.1 : -0.1;
    this.zoomLevel = Math.max(0.2, Math.min(3, this.zoomLevel + zoomDelta));
    // 0.2× min, 3× max
  }

  // ─────────────────────────
  // Mouse down → start panning
  // ─────────────────────────
  onMouseDown(event: MouseEvent) {
    this.isPanning = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  // ─────────────────────────
  // Mouse move → if panning, update pan offsets
  // ─────────────────────────
  onMouseMove(event: MouseEvent) {
    if (!this.isPanning) return;
    const dx = event.clientX - this.lastMouseX;
    const dy = event.clientY - this.lastMouseY;
    this.panX += dx;
    this.panY += dy;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  // ─────────────────────────
  // Mouse up → stop panning
  // ─────────────────────────
  onMouseUp() {
    this.isPanning = false;
  }

  // ────────────────
  // Also keep mouse-tracking for overlay:
  // ────────────────
  @HostListener('document:mousemove', ['$event'])
  onGlobalMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  @HostListener('document:mouseover', ['$event'])
  onGlobalMouseOver(event: MouseEvent) {
    const target = event.target as HTMLElement;
    let tag = target.tagName.toLowerCase();
    if (target.id) {
      tag += `#${target.id}`;
    }
    if (target.classList.length) {
      tag += '.' + Array.from(target.classList).join('.');
    }
    this.hoverTag = tag;
  }
}
