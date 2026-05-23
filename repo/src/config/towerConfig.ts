import type { PaintEssence, TowerType, TowerStyle } from '../types/entities';
import { COLOR_VALUES } from './gameConfig';

export const TOWER_COSTS: Record<TowerType, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

export const TOWER_BASE_RANGE = 2.5;
export const TOWER_BASE_DAMAGE = 15;
export const TOWER_LEVEL_DAMAGE_MULTIPLIER = 1.4;
export const TOWER_LEVEL_RANGE_BONUS = 0.2;

export interface StyleMultipliers {
  damage: number;
  attackSpeed: number;
}

export const STYLE_MULTIPLIERS: Record<TowerStyle, StyleMultipliers> = {
  pencil: { damage: 0.8, attackSpeed: 800 },
  watercolor: { damage: 1.0, attackSpeed: 1200 },
  oil: { damage: 1.2, attackSpeed: 1500 },
};

export const TOWER_NAMES: Record<TowerType, string> = {
  red: '烈焰塔',
  blue: '寒冰塔',
  yellow: '雷电塔',
};

export const TOWER_ICONS: Record<TowerStyle, string> = {
  pencil: '✏️',
  watercolor: '💧',
  oil: '🖌️',
};
