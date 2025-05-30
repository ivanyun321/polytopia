export interface Tile {
  x: number;
  y: number;
  terrainType: string;
  unit?: {
    type: string;
  };
}
