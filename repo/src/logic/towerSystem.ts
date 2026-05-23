import type { Tower, TowerType, TowerStyle } from '../types/entities';
import type { PaintEssence, Position } from '../types/game';
import { GRID_SIZE, CELL_SIZE, PATH, CORE_POSITION, MAX_TOWER_LEVEL } from '../config/gameConfig';
import { TOWER_COSTS, TOWER_BASE_RANGE, TOWER_BASE_DAMAGE, STYLE_MULTIPLIERS, TOWER_LEVEL_DAMAGE_MULTIPLIER, TOWER_LEVEL_RANGE_BONUS } from '../config/towerConfig';

export const canPlaceTower = (x: number, y: number, towers: Tower[]): boolean => {
  const isOnPath = PATH.some(p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
  if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
  const hasTower = towers.some(t => t.x === x && t.y === y);
  if (hasTower) return false;
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  return true;
};

export const createTower = (
  x: number,
  y: number,
  type: TowerType,
  style: TowerStyle,
  idRef: { current: number }
): Tower => {
  const styleMultipliers = STYLE_MULTIPLIERS[style];
  return {
    id: idRef.current++,
    x,
    y,
    type,
    level: 1,
    range: TOWER_BASE_RANGE,
    damage: Math.floor(TOWER_BASE_DAMAGE * styleMultipliers.damage),
    attackSpeed: styleMultipliers.attackSpeed,
    lastAttack: 0,
    style,
  };
};

export const upgradeTower = (
  tower: Tower,
  paint: PaintEssence
): { tower: Tower; paint: PaintEssence } | null => {
  if (!tower || tower.level >= MAX_TOWER_LEVEL) return null;
  const cost = tower.level * 25;
  if (paint[tower.type] >= cost) {
    return {
      tower: {
        ...tower,
        level: tower.level + 1,
        damage: Math.floor(tower.damage * TOWER_LEVEL_DAMAGE_MULTIPLIER),
        range: tower.range + TOWER_LEVEL_RANGE_BONUS,
      },
      paint: {
        ...paint,
        [tower.type]: paint[tower.type] - cost,
      },
    };
  }
  return null;
};

export const canAffordTower = (type: TowerType, paint: PaintEssence): boolean => {
  const cost = TOWER_COSTS[type];
  return paint.red >= cost.red && paint.blue >= cost.blue && paint.yellow >= cost.yellow;
};

export const deductTowerCost = (type: TowerType, paint: PaintEssence): PaintEssence => {
  const cost = TOWER_COSTS[type];
  return {
    red: paint.red - cost.red,
    blue: paint.blue - cost.blue,
    yellow: paint.yellow - cost.yellow,
  };
};
