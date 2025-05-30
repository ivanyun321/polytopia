import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tile } from '../models/tile';
import { Unit } from '../models/unit';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private mapSize = 11;
  private mapSubject = new BehaviorSubject<Tile[][]>([]);
  public map$ = this.mapSubject.asObservable(); // <-- You need this

  constructor() {
    this.generateMap();
  }

  generateMap() {
    const terrainTypes = ['Field'];
    const map: Tile[][] = [];

    for (let x = 0; x < this.mapSize; x++) {
      const row: Tile[] = [];
      for (let y = 0; y < this.mapSize; y++) {
        const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        row.push(new Tile(x, y, terrain));
      }
      map.push(row);
    }

    this.mapSubject.next(map);
  }

  updateTile(x: number, y: number, newTile: Tile) {
    const map = this.mapSubject.value.map(row => row.slice());
    map[x][y] = newTile;
    this.mapSubject.next(map);
  }
}
