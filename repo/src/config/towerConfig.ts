import type { PaintEssence, TowerType, StyleType } from '../types/game';

/** 每种塔的建造消耗 */
export const TOWER_COSTS: Record<TowerType, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

/** 基础塔属性 */
export const TOWER_BASE_STATS = {
  range: 2.5,
  damage: 15,
};

/** 风格攻速倍率（毫秒） */
export const STYLE_ATTACK_SPEED: Record<StyleType, number> = {
  pencil: 800,
  watercolor: 1200,
  oil: 1500,
};

/** 风格伤害倍率 */
export const STYLE_DAMAGE_MULTIPLIER: Record<StyleType, number> = {
  pencil: 0.8,
  watercolor: 1.0,
  oil: 1.2,
};

/** 塔的最高等级 */
export const MAX_TOWER_LEVEL = 5;

/** 升级消耗基数（每级消耗 = level * 此值） */
export const UPGRADE_COST_MULTIPLIER = 25;

/** 升级伤害倍率 */
export const UPGRADE_DAMAGE_MULTIPLIER = 1.4;

/** 升级射程增量 */
export const UPGRADE_RANGE_INCREMENT = 0.2;

/** 弹丸速度 */
export const PROJECTILE_SPEED = 350;

/** 弹丸命中半径 */
export const PROJECTILE_HIT_RANGE_NORMAL = 25;

/** 穿透弹命中半径 */
export const PROJECTILE_HIT_RANGE_PIERCE = 60;

/** 减速效果倍率 */
export const SLOW_SPEED_MULTIPLIER = 0.7;

/** 敌人最低速度 */
export const MIN_ENEMY_SPEED = 15;