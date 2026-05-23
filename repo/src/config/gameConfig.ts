import type { Position, PathLine } from '../types/game';

export const GRID_SIZE = 10;
export const CELL_SIZE = 50;

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

const generatePathLines = (): PathLine[] => {
  const lines: PathLine[] = [];
  for (let i = 0; i < PATH.length - 1; i++) {
    lines.push({
      x1: PATH[i].x * CELL_SIZE + CELL_SIZE / 2,
      y1: PATH[i].y * CELL_SIZE + CELL_SIZE / 2,
      x2: PATH[i + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y2: PATH[i + 1].y * CELL_SIZE + CELL_SIZE / 2,
    });
  }
  return lines;
};

export const PATH_LINES = generatePathLines();

export const CORE_POSITION: Position = { x: 9, y: 4 };

export const INITIAL_PAINT = { red: 50, blue: 50, yellow: 50 };
export const WAVE_BONUS = { red: 10, blue: 10, yellow: 10 };
export const INITIAL_CORE_HEALTH = 100;
export const MAX_WAVES = 10;
export const MAX_TOWER_LEVEL = 5;

export const COLOR_VALUES: Record<string, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f39c12',
};
