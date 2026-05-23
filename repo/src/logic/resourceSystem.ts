import type { PaintEssence, TowerType } from '../types/game';
import { TOWER_COSTS } from '../config/gameConfig';

export const spendPaint = (
  paint: PaintEssence,
  cost: PaintEssence
): PaintEssence => {
  return {
    red: paint.red - cost.red,
    blue: paint.blue - cost.blue,
    yellow: paint.yellow - cost.yellow,
  };
};

export const addPaint = (
  paint: PaintEssence,
  gain: PaintEssence
): PaintEssence => {
  return {
    red: paint.red + gain.red,
    blue: paint.blue + gain.blue,
    yellow: paint.yellow + gain.yellow,
  };
};

export const canAfford = (
  paint: PaintEssence,
  cost: PaintEssence
): boolean => {
  return (
    paint.red >= cost.red &&
    paint.blue >= cost.blue &&
    paint.yellow >= cost.yellow
  );
};

export const getTowerCost = (type: TowerType): PaintEssence => {
  return { ...TOWER_COSTS[type] };
};

export const getUpgradeCost = (towerLevel: number): number => {
  return towerLevel * 25;
};
