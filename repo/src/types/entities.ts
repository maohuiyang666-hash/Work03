import type { Position } from './game';

export type ColorType = 'red' | 'blue' | 'yellow' | 'mixed';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  color: string;
  colorType: ColorType;
  pathIndex: number;
}

export type TowerType = 'red' | 'blue' | 'yellow';
export type TowerStyle = 'pencil' | 'watercolor' | 'oil';

export interface Tower {
  id: number;
  x: number;
  y: number;
  type: TowerType;
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: TowerStyle;
}

export type ProjectileType = 'normal' | 'slow' | 'pierce';

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
  damage: number;
  type: ProjectileType;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  velocityX: number;
  velocityY: number;
}
