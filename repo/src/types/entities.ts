import type { EnemyColorType, TowerType, ProjectileType, StyleType } from './game';

/** 敌人实体 */
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

/** 防御塔实体 */
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
  style: StyleType;
}

/** 弹丸实体 */
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

/** 粒子效果 */
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