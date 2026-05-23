import type { TowerType, TowerStyle } from '../types/game';
import type { TowerStats } from '../types/entities';

// 风格对应的属性倍率
export const STYLE_DAMAGE_MULTIPLIER: Record<TowerStyle, number> = {
  pencil: 0.8,
  watercolor: 1.0,
  oil: 1.2,
};

export const STYLE_ATTACK_SPEED: Record<TowerStyle, number> = {
  pencil: 800,
  watercolor: 1200,
  oil: 1500,
};

// 基础属性
export const TOWER_BASE_STATS: Record<TowerType, Omit<TowerStats, 'attackSpeed'>> = {
  red: {
    range: 2.5,
    damage: 15,
  },
  blue: {
    range: 2.5,
    damage: 15,
  },
  yellow: {
    range: 2.5,
    damage: 15,
  },
};

// 子弹类型映射
export const TOWER_PROJECTILE_TYPE: Record<TowerType, 'normal' | 'slow' | 'pierce'> = {
  red: 'normal',
  blue: 'slow',
  yellow: 'pierce',
};

// 升级属性增长
export const UPGRADE_DAMAGE_MULTIPLIER = 1.4;
export const UPGRADE_RANGE_BONUS = 0.2;

// 攻击速度限制
export const MIN_ATTACK_INTERVAL = 400;
