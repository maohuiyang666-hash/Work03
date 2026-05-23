import type { Enemy, Projectile, Particle } from '../types/entities';
import type { ColorType } from '../types/game';
import { PATH, CELL_SIZE } from '../config/gameConfig';
import { ENEMY_COLORS, SLOW_EFFECT_MULTIPLIER, MIN_SPEED_AFTER_SLOW, getKillPaintReward, getKillScoreReward } from '../config/enemyConfig';

let enemyIdCounter = 0;
let particleIdCounter = 0;

export const resetEnemyIdCounter = () => {
  enemyIdCounter = 0;
  particleIdCounter = 0;
};

export const createEnemy = (
  wave: number,
  colorType: ColorType
): Enemy => {
  const health = 40 + wave * 15;
  const speed = 35 + Math.min(wave * 3, 25);

  return {
    id: enemyIdCounter++,
    x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
    y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
    health,
    maxHealth: health,
    speed,
    color: ENEMY_COLORS[colorType],
    colorType,
    pathIndex: 0,
  };
};

export const moveEnemies = (
  enemies: Enemy[],
  delta: number
): { enemies: Enemy[]; damageToCore: number } => {
  let damageToCore = 0;
  
  const movedEnemies = enemies.map(enemy => {
    if (enemy.pathIndex >= PATH.length - 1) {
      damageToCore += 10;
      return null;
    }

    const target = {
      x: PATH[enemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[enemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
    };

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      return { ...enemy, pathIndex: enemy.pathIndex + 1 };
    } else {
      return {
        ...enemy,
        x: enemy.x + (dx / dist) * enemy.speed * delta,
        y: enemy.y + (dy / dist) * enemy.speed * delta,
      };
    }
  }).filter((e): e is Enemy => e !== null);

  return { enemies: movedEnemies, damageToCore };
};

export const createParticles = (
  x: number,
  y: number,
  color: string,
  count: number
): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: particleIdCounter++,
      x,
      y,
      color,
      size: 4 + Math.random() * 4,
      life: 30 + Math.random() * 20,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: (Math.random() - 0.5) * 4,
    });
  }
  return particles;
};

export const updateParticles = (
  particles: Particle[]
): Particle[] => {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    }))
    .filter(p => p.life > 0);
};

export const getColorTypeForWave = (wave: number): ColorType[] => {
  const types: ColorType[] = ['red', 'blue', 'yellow'];
  if (wave >= 3) {
    types.push('mixed');
  }
  return types;
};
