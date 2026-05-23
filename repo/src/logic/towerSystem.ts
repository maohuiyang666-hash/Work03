import { CORE_POSITION, GRID_SIZE, CELL_SIZE, PATH } from '../config/gameConfig';
import { TOWER_BASE_STATS, TOWER_STYLE_META, TOWER_COSTS } from '../config/towerConfig';
import type { Tower } from '../types/entities';
import type { TowerCollectionKey, TowerStyle, TowerType, PaintEssence } from '../types/game';

export const canPlaceTower = (x: number, y: number, towers: Tower[]): boolean => {
  const isOnPath = PATH.some((position) => Math.abs(position.x - x) < 0.5 && Math.abs(position.y - y) < 0.5);
  if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) {
    return false;
  }

  const hasTower = towers.some((tower) => tower.x === x && tower.y === y);
  if (hasTower) {
    return false;
  }

  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false;
  }

  return true;
};

export const createTower = (
  id: number,
  x: number,
  y: number,
  type: TowerType,
  style: TowerStyle,
): Tower => {
  const styleMeta = TOWER_STYLE_META[style];

  return {
    id,
    x,
    y,
    type,
    level: 1,
    range: TOWER_BASE_STATS.range,
    damage: Math.floor(TOWER_BASE_STATS.damage * styleMeta.damageMultiplier),
    attackSpeed: styleMeta.attackSpeed,
    lastAttack: 0,
    style,
  };
};

export const getTowerCost = (type: TowerType): PaintEssence => TOWER_COSTS[type];

export const upgradeTower = (tower: Tower): Tower => ({
  ...tower,
  level: tower.level + 1,
  damage: Math.floor(tower.damage * TOWER_BASE_STATS.upgradeDamageMultiplier),
  range: tower.range + TOWER_BASE_STATS.upgradeRangeBonus,
});

export const getTowerUpgradeCost = (tower: Tower): number => tower.level * TOWER_BASE_STATS.upgradeCostMultiplier;

export const isTowerMaxLevel = (tower: Tower): boolean => tower.level >= TOWER_BASE_STATS.maxLevel;

export const getTowerCollectionKey = (type: TowerType, style: TowerStyle): TowerCollectionKey => `${type}-${style}`;

export const getTowerCenter = (tower: Tower): { x: number; y: number } => ({
  x: tower.x * CELL_SIZE + CELL_SIZE / 2,
  y: tower.y * CELL_SIZE + CELL_SIZE / 2,
});
