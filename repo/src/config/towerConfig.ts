import type { PaintEssence, TowerStyle, TowerType } from '../types/game';

export const TOWER_COSTS: Record<TowerType, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

export const TOWER_BASE_STATS = {
  damage: 15,
  range: 2.5,
  projectileSpeed: 350,
  maxLevel: 5,
  upgradeCostMultiplier: 25,
  upgradeDamageMultiplier: 1.4,
  upgradeRangeBonus: 0.2,
};

export const TOWER_TYPE_META: Record<TowerType, { color: string; label: string }> = {
  red: { color: '#e74c3c', label: '烈焰塔' },
  blue: { color: '#3498db', label: '寒冰塔' },
  yellow: { color: '#f39c12', label: '雷电塔' },
};

export const TOWER_STYLE_META: Record<
  TowerStyle,
  { icon: string; label: string; attackSpeed: number; damageMultiplier: number; className: string }
> = {
  pencil: {
    icon: '✏️',
    label: '✏️铅笔',
    attackSpeed: 800,
    damageMultiplier: 0.8,
    className: 'border-2 border-dashed',
  },
  watercolor: {
    icon: '💧',
    label: '💧水彩',
    attackSpeed: 1200,
    damageMultiplier: 1,
    className: 'opacity-80',
  },
  oil: {
    icon: '🖌️',
    label: '🖌️油画',
    attackSpeed: 1500,
    damageMultiplier: 1.2,
    className: 'border-4',
  },
};

export const getTowerColor = (type: TowerType): string => TOWER_TYPE_META[type].color;

export const getStyleClass = (style: TowerStyle): string => TOWER_STYLE_META[style].className;
