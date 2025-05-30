import {Unit} from './unit';

export class Tile {
    constructor(
        public x: number,
        public y: number,
        public terrainType: string,
        public unit: Unit | null = null
    ) {}
}
