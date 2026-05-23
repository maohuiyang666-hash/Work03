import type { EnemyColorType } from '../types/game';
import type { Enemy } from '../types/entities';
import {
  ENEMY_BASE_HEALTH,
  ENEMY_HEALTH_PER_WAVE,
  ENEMY_BASE_SPEED,
  ENEMY_SPEED_PER_WAVE,
  ENEMY_SPEED_CAP_INCREASE,
  MIXED_ENEMY_START_WAVE,
  BASE_ENEMY_COLOR_TYPES,
  ENEMIES_PER_WAVE_BASE,
  ENEMIES_PER_WAVE_MULTIPLIER,
  SPAWN_RATE_BASE,
  SPAWN_RATE_DECREASE_PER_WAVE,
  MIN_SPAWN_RATE,
} from '../config/enemyConfig';
import { ENEMY_COLOR_MAP } from '../types/game';
import { PATH, CELL_SIZE, CORE_DAMAGE_PER_ENEMY } from '../config/gameConfig';

/**
 * 获取随机敌人颜色类型
 */
export function getRandomEnemyColorType(wave: number): EnemyColorType {
  const colorTypes: EnemyColorType[] = [...BASE_ENEMY_COLOR_TYPES];
  if (wave >= MIXED_ENEMY_START_WAVE) {
    colorTypes.push('mixed');
  }
  return colorTypes[Math.floor(Math.random() * colorTypes.length)];
}

/**
 * 获取敌人颜色值
 */
export function getEnemyColor(type: EnemyColorType): string {
  const colorEntry = ENEMY_COLOR_MAP[type];
  if (Array.isArray(colorEntry)) {
    return colorEntry[Math.floor(Math.random() * colorEntry.length)];
  }
  return colorEntry;
}

/**
 * 创建敌人实体
 */
export function spawnEnemy(wave: number, id: number): Enemy {
  const colorType = getRandomEnemyColorType(wave);
  const health = ENEMY_BASE_HEALTH + wave * ENEMY_HEALTH_PER_WAVE;

  return {
    id,
    x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
    y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
    health,
    maxHealth: health,
    speed: ENEMY_BASE_SPEED + Math.min(wave * ENEMY_SPEED_PER_WAVE, ENEMY_SPEED_CAP_INCREASE),
    color: getEnemyColor(colorType),
    colorType,
    pathIndex: 0,
  };
}

/**
 * 计算每波敌人数
 */
export function getEnemiesPerWave(wave: number): number {
  return ENEMIES_PER_WAVE_BASE + wave * ENEMIES_PER_WAVE_MULTIPLIER;
}

/**
 * 计算敌人生成间隔（秒）
 */
export function getSpawnRate(wave: number): number {
  return Math.max(SPAWN_RATE_BASE - wave * SPAWN_RATE_DECREASE_PER_WAVE, MIN_SPAWN_RATE);
}

/**
 * 移动所有敌人沿路径前进，返回存活敌人和核心受到的伤害
 */
export function moveEnemies(
  enemies: Enemy[],
  delta: number,
): { survivors: Enemy[]; coreDamage: number } {
  const survivors: Enemy[] = [];
  let coreDamage = 0;

  for (const enemy of enemies) {
    // 到达终点
    if (enemy.pathIndex >= PATH.length - 1) {
      coreDamage += CORE_DAMAGE_PER_ENEMY;
      continue;
    }

    const target = PATH[enemy.pathIndex + 1];
    const targetX = target.x * CELL_SIZE + CELL_SIZE / 2;
    const targetY = target.y * CELL_SIZE + CELL_SIZE / 2;

    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      enemy.pathIndex++;
    } else {
      enemy.x += (dx / dist) * enemy.speed * delta;
      enemy.y += (dy / dist) * enemy.speed * delta;
    }

    survivors.push(enemy);
  }

  return { survivors, coreDamage };
}