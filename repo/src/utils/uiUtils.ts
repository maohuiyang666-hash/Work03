import type { TowerStyle } from '../types/entities';
import { COLOR_VALUES } from '../config/gameConfig';
import { TOWER_NAMES, TOWER_ICONS } from '../config/towerConfig';

export const getColorValue = (type: string): string => {
  return COLOR_VALUES[type] || '#888';
};

export const getStyleClass = (style: TowerStyle): string => {
  switch (style) {
    case 'pencil': return 'border-2 border-dashed';
    case 'watercolor': return 'opacity-80';
    case 'oil': return 'border-4';
    default: return '';
  }
};

export const getTowerName = (type: string): string => {
  return TOWER_NAMES[type as any] || type;
};

export const getTowerIcon = (style: TowerStyle): string => {
  return TOWER_ICONS[style];
};
