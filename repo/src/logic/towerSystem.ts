import type { Tower, Enemy, Projectile } from '../types/entities';
import type { TowerType, TowerStyle, PaintEssence } from '../types/game';
import { GRID_SIZE, PATH, CORE_POSITION, TOWER_COSTS } from '../config/gameConfig';
import {
  STYLE_DAMAGE_MULTIPLIER,
  STYLE_ATTACK_SPEED,
  TOWER_BASE_STATS,
  TOWER_PROJECTILE_TYPE,
  UPGRADE_DAMAGE_MULTIPLIER,
  UPGRADE_RANGE_BONUS,
} from '../config/towerConfig';
import { COLORS } from '../config/gameConfig';

let towerIdCounter = 0;
let projectileIdCounter = 0;

export const resetTowerIdCounter = () => {
  towerIdCounter = 0;
  projectileIdCounter = 0;
};

export const canPlaceTower = (
  x: number,
  y: number,
  towers: Tower[]
): boolean => {
  const isOnPath = PATH.some(
    p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5
  );
  if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) {
    return false;
  }
  const hasTower = towers.some(t => t.x === x && t.y === y);
  if (hasTower) return false;
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  return true;
};

export const canAffordTower = (
  type: TowerType,
  paint: PaintEssence
): boolean => {
  const cost = TOWER_COSTS[type];
  return (
    paint.red >= cost.red &&
    paint.blue >= cost.blue &&
    paint.yellow >= cost.yellow
  );
};

export const createTower = (
  x: number,
  y: number,
  type: TowerType,
  style: TowerStyle
): Tower => {
  const styleMultiplier = STYLE_DAMAGE_MULTIPLIER[style];
  const baseStats = TOWER_BASE_STATS[type];

  return {
    id: towerIdCounter++,
    x,
    y,
    type,
    level: 1,
    range: baseStats.range,
    damage: Math.floor(baseStats.damage * styleMultiplier),
    attackSpeed: STYLE_ATTACK_SPEED[style],
    lastAttack: 0,
    style,
  };
};

export const upgradeTower = (
  tower: Tower,
  paint: PaintEssence
): { tower: Tower; paint: PaintEssence } | null => {
  if (tower.level >= 5) return null;
  const cost = tower.level * 25;
  if (paint[tower.type] < cost) return null;

  return {
    tower: {
      ...tower,
      level: tower.level + 1,
      damage: Math.floor(tower.damage * UPGRADE_DAMAGE_MULTIPLIER),
      range: tower.range + UPGRADE_RANGE_BONUS,
    },
    paint: {
      ...paint,
      [tower.type]: paint[tower.type] - cost,
    },
  };
};

export const getTowerColorValue = (type: TowerType): string => {
  return COLORS[type];
};

export const getTowerStyleClass = (style: string): string => {
  switch (style) {
    case 'pencil': return 'border-2 border-dashed';
    case 'watercolor': return 'opacity-80';
    case 'oil': return 'border-4';
    default: return '';
  }
};

export const processTowerAttacks = (
  towers: Tower[],
  enemies: Enemy[],
  currentTime: number,
  projectileIdGenerator: () => number
): { towers: Tower[]; newProjectiles: Projectile[] } => {
  const newProjectiles: Projectile[] = [];

  const updatedTowers = towers.map(tower => {
    if (currentTime - tower.lastAttack < tower.attackSpeed) {
      return tower;
    }

    const towerCenterX = tower.x * 50 + 25;
    const towerCenterY = tower.y * 50 + 25;

    const inRange = enemies.filter(e => {
      const dist = Math.sqrt(
        Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
      );
      return dist <= tower.range * 50;
    });

    if (inRange.length > 0) {
      const target = inRange[0];
      const newTower = { ...tower, lastAttack: currentTime };

      newProjectiles.push({
        id: projectileIdGenerator(),
        x: towerCenterX,
        y: towerCenterY,
        targetX: target.x,
        targetY: target.y,
        color: getTowerColorValue(tower.type),
        speed: 350,
        damage: tower.damage * tower.level,
        type: TOWER_PROJECTILE_TYPE[tower.type],
      });

      return newTower;
    }

    return tower;
  });

  return { towers: updatedTowers, newProjectiles };
};
