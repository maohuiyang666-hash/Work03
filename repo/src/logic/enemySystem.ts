import {
  ENEMY_BASE_HEALTH,
  ENEMY_BASE_SPEED,
  ENEMY_COLORS,
  ENEMY_HEALTH_PER_WAVE,
  ENEMY_MAX_SPEED_BONUS,
  ENEMY_SPEED_PER_WAVE,
  MIXED_ENEMY_COLORS,
  MIXED_ENEMY_UNLOCK_WAVE,
} from '../config/enemyConfig';
import { CELL_SIZE, CORE_DAMAGE_PER_ENEMY, PATH } from '../config/gameConfig';
import type { Enemy } from '../types/entities';
import type { EnemyColorType } from '../types/game';

export const spawnEnemy = (
  wave: number,
  id: number,
  typeRandomValue: number,
  colorRandomValue: number,
): Enemy => {
  const colorTypes: EnemyColorType[] = ['red', 'blue', 'yellow'];
  if (wave >= MIXED_ENEMY_UNLOCK_WAVE) {
    colorTypes.push('mixed');
  }

  const type = colorTypes[Math.floor(typeRandomValue * colorTypes.length) % colorTypes.length];
  const color = type === 'mixed'
    ? MIXED_ENEMY_COLORS[Math.floor(colorRandomValue * MIXED_ENEMY_COLORS.length) % MIXED_ENEMY_COLORS.length]
    : ENEMY_COLORS[type];

  return {
    id,
    x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
    y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
    health: ENEMY_BASE_HEALTH + wave * ENEMY_HEALTH_PER_WAVE,
    maxHealth: ENEMY_BASE_HEALTH + wave * ENEMY_HEALTH_PER_WAVE,
    speed: ENEMY_BASE_SPEED + Math.min(wave * ENEMY_SPEED_PER_WAVE, ENEMY_MAX_SPEED_BONUS),
    color,
    colorType: type,
    pathIndex: 0,
  };
};

export interface MoveEnemiesResult {
  enemies: Enemy[];
  coreDamage: number;
}

export const moveEnemies = (enemies: Enemy[], delta: number): MoveEnemiesResult => {
  const updatedEnemies: Enemy[] = [];
  let coreDamage = 0;

  enemies.forEach((enemy) => {
    if (enemy.pathIndex >= PATH.length - 1) {
      coreDamage += CORE_DAMAGE_PER_ENEMY;
      return;
    }

    const target = {
      x: PATH[enemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[enemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
    };

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      updatedEnemies.push({ ...enemy, pathIndex: enemy.pathIndex + 1 });
      return;
    }

    updatedEnemies.push({
      ...enemy,
      x: enemy.x + (dx / distance) * enemy.speed * delta,
      y: enemy.y + (dy / distance) * enemy.speed * delta,
    });
  });

  return { enemies: updatedEnemies, coreDamage };
};
