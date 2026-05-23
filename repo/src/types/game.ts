export type TowerType = 'red' | 'blue' | 'yellow';
export type TowerStyle = 'pencil' | 'watercolor' | 'oil';
export type EnemyColorType = 'red' | 'blue' | 'yellow' | 'mixed';
export type ProjectileType = 'normal' | 'slow' | 'pierce';
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface PathLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

export type PaintColor = keyof PaintEssence;
export type TowerCollectionKey = `${TowerType}-${TowerStyle}`;
