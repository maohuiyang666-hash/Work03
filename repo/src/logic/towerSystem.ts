import { Tower, TowerType, TowerStyle, PaintEssence, Enemy, Projectile } from '../types';
import { PATH, CORE_POSITION, GRID_SIZE, CELL_SIZE, getColorValue } from '../config';

export const canPlaceTower = (x: number, y: number, towers: Tower[]): boolean => {
  const isOnPath = PATH.some(p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
  if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
  const hasTower = towers.some(t => t.x === x && t.y === y);
  if (hasTower) return false;
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  return true;
};

export const createTower = (
  id: number,
  x: number,
  y: number,
  type: TowerType,
  style: TowerStyle
): Tower => {
  const styleMultiplier = style === 'pencil' ? 0.8 : style === 'watercolor' ? 1.0 : 1.2;
  return {
    id,
    x,
    y,
    type,
    level: 1,
    range: 2.5,
    damage: Math.floor(15 * styleMultiplier),
    attackSpeed: style === 'watercolor' ? 1200 : style === 'pencil' ? 800 : 1500,
    lastAttack: 0,
    style,
  };
};

export const upgradeTower = (
  tower: Tower,
  paint: PaintEssence
): { tower: Tower; paint: PaintEssence; success: boolean } => {
  if (tower.level >= 5) return { tower, paint, success: false };
  const cost = tower.level * 25;
  if (paint[tower.type] >= cost) {
    return {
      tower: {
        ...tower,
        level: tower.level + 1,
        damage: Math.floor(tower.damage * 1.4),
        range: tower.range + 0.2,
      },
      paint: { ...paint, [tower.type]: paint[tower.type] - cost },
      success: true,
    };
  }
  return { tower, paint, success: false };
};

export const towersAttack = (
  towers: Tower[],
  enemies: Enemy[],
  currentTime: number,
  projectileIdStart: number
): { updatedTowers: Tower[]; newProjectiles: Projectile[]; nextProjectileId: number } => {
  const updatedTowers = [...towers];
  const newProjectiles: Projectile[] = [];
  let currentProjectileId = projectileIdStart;

  updatedTowers.forEach(tower => {
    if (currentTime - tower.lastAttack < tower.attackSpeed) return;

    const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
    const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

    const inRange = enemies.filter(e => {
      const dist = Math.sqrt(
        Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
      );
      return dist <= tower.range * CELL_SIZE;
    });

    if (inRange.length > 0) {
      const target = inRange[0];
      tower.lastAttack = currentTime;

      const projectile: Projectile = {
        id: currentProjectileId++,
        x: towerCenterX,
        y: towerCenterY,
        targetX: target.x,
        targetY: target.y,
        color: getColorValue(tower.type),
        speed: 350,
        damage: tower.damage * tower.level,
        type: tower.type === 'blue' ? 'slow' : tower.type === 'yellow' ? 'pierce' : 'normal',
      };

      newProjectiles.push(projectile);
    }
  });

  return { updatedTowers, newProjectiles, nextProjectileId: currentProjectileId };
};
