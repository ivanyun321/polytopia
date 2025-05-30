import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tile } from '../models/tile';

@Injectable({ providedIn: 'root' })
export class GameService {
  map$ = new BehaviorSubject<Tile[][]>(this.generateMap());

  generateMap(): Tile[][] {
    const terrain = ['Field'];
    const map: Tile[][] = [];

    for (let y = 0; y < 15; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < 15; x++) {
        row.push({
          x,
          y,
          terrainType: terrain[Math.floor(Math.random() * terrain.length)],
        });
      }
      map.push(row);
    }

    return map;
  }
}
