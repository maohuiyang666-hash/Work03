import type { TowerType, PaintEssence, StyleType } from '../types/game';
import type { Tower } from '../types/entities';
import {
  TOWER_COSTS,
  TOWER_BASE_STATS,
  STYLE_ATTACK_SPEED,
  STYLE_DAMAGE_MULTIPLIER,
  MAX_TOWER_LEVEL,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_DAMAGE_MULTIPLIER,
  UPGRADE_RANGE_INCREMENT,
} from '../config/towerConfig';
import { GRID_SIZE, PATH, CORE_POSITION } from '../config/gameConfig';

/**
 * 判断某个网格坐标是否可以放置塔
 */
export function canPlaceTower(
  x: number,
  y: number,
  existingTowers: Tower[],
): boolean {
  // 检查是否在路径上（且不是核心位置）
  const isOnPath = PATH.some(
    p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5,
  );
  if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) {
    return false;
  }
  // 已存在塔
  if (existingTowers.some(t => t.x === x && t.y === y)) {
    return false;
  }
  // 超出边界
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false;
  }
  return true;
}

/**
 * 创建新塔（返回塔数据和消耗），不修改任何状态
 */
export function createTower(
  x: number,
  y: number,
  type: TowerType,
  style: StyleType,
  id: number,
): { tower: Tower; cost: PaintEssence } {
  const cost = { ...TOWER_COSTS[type] };
  const damageMultiplier = STYLE_DAMAGE_MULTIPLIER[style];
  const attackSpeed = STYLE_ATTACK_SPEED[style];

  const tower: Tower = {
    id,
    x,
    y,
    type,
    level: 1,
    range: TOWER_BASE_STATS.range,
    damage: Math.floor(TOWER_BASE_STATS.damage * damageMultiplier),
    attackSpeed,
    lastAttack: 0,
    style,
  };

  return { tower, cost };
}

/**
 * 检查塔是否可以升级，返回升级消耗或 null
 */
export function getUpgradeCost(
  tower: Tower,
  currentPaint: PaintEssence,
): { canUpgrade: boolean; cost: number } {
  if (tower.level >= MAX_TOWER_LEVEL) {
    return { canUpgrade: false, cost: 0 };
  }
  const cost = tower.level * UPGRADE_COST_MULTIPLIER;
  const canUpgrade = currentPaint[tower.type] >= cost;
  return { canUpgrade, cost };
}

/**
 * 升级塔（返回升级后的塔）
 */
export function upgradeTower(tower: Tower): Tower {
  return {
    ...tower,
    level: tower.level + 1,
    damage: Math.floor(tower.damage * UPGRADE_DAMAGE_MULTIPLIER),
    range: tower.range + UPGRADE_RANGE_INCREMENT,
  };
}