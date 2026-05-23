import type { Position, ColorType, TowerType, TowerStyle, ProjectileType } from './game';

// 敌人
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

// 防御塔
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

// 子弹
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

// 粒子
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

// 防御塔建造数据
export interface TowerBuildData {
  type: TowerType;
  style: TowerStyle;
}

// 防御塔属性
export interface TowerStats {
  range: number;
  damage: number;
  attackSpeed: number;
}
