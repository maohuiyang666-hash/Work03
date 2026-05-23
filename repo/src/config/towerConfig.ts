import { PaintEssence, TowerType } from '../types';

export const TOWER_COSTS: Record<TowerType, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

export const TOWER_COLORS: Record<TowerType, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f39c12',
};

export const getColorValue = (type: TowerType): string => TOWER_COLORS[type];

export const getStyleClass = (style: string) => {
  switch (style) {
    case 'pencil': return 'border-2 border-dashed';
    case 'watercolor': return 'opacity-80';
    case 'oil': return 'border-4';
    default: return '';
  }
};
