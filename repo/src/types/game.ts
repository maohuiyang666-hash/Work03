export interface Position {
  x: number;
  y: number;
}

export type TowerType = 'red' | 'blue' | 'yellow';
export type TowerStyle = 'pencil' | 'watercolor' | 'oil';
export type ProjectileType = 'normal' | 'slow' | 'pierce';
export type EnemyColorType = 'red' | 'blue' | 'yellow' | 'mixed';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}
