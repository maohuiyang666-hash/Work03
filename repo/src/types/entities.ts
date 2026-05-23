import type { EnemyColorType, ProjectileType, TowerStyle, TowerType } from './game';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  color: string;
  colorType: EnemyColorType;
  pathIndex: number;
}

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
