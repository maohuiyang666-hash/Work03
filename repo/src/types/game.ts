export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

export interface PathLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
