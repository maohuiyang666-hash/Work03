import type { PaintEssence, PathLine, Position } from '../types/game';

export const GRID_SIZE = 10;
export const CELL_SIZE = 50;
export const MAX_WAVE = 10;
export const INITIAL_CORE_HEALTH = 100;
export const INITIAL_PAINT: PaintEssence = { red: 50, blue: 50, yellow: 50 };
export const WAVE_REWARD: PaintEssence = { red: 10, blue: 10, yellow: 10 };
export const CORE_DAMAGE_PER_ENEMY = 10;

export const PATH: Position[] = [
  { x: 0, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 2 },
  { x: 5, y: 2 },
  { x: 5, y: 6 },
  { x: 7, y: 6 },
  { x: 7, y: 4 },
  { x: 9, y: 4 },
];

export const CORE_POSITION: Position = { x: 9, y: 4 };

export const generatePathLines = (): PathLine[] => {
  const lines: PathLine[] = [];
  for (let index = 0; index < PATH.length - 1; index += 1) {
    lines.push({
      x1: PATH[index].x * CELL_SIZE + CELL_SIZE / 2,
      y1: PATH[index].y * CELL_SIZE + CELL_SIZE / 2,
      x2: PATH[index + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y2: PATH[index + 1].y * CELL_SIZE + CELL_SIZE / 2,
    });
  }
  return lines;
};

export const PATH_LINES = generatePathLines();
