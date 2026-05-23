import type { Tower, Enemy, Projectile, Particle } from '../types/entities';
import type { TowerType } from '../types/game';
import {
  PROJECTILE_SPEED,
  PROJECTILE_HIT_RANGE_NORMAL,
  PROJECTILE_HIT_RANGE_PIERCE,
  SLOW_SPEED_MULTIPLIER,
  MIN_ENEMY_SPEED,
} from '../config/towerConfig';
import {
  KILL_PAINT_BASE,
  KILL_PAINT_HEALTH_DIVISOR,
  KILL_SCORE_BASE,
  KILL_SCORE_HEALTH_DIVISOR,
} from '../config/enemyConfig';
import { CELL_SIZE } from '../config/gameConfig';

/**
 * 塔寻找范围内的敌人并发射弹丸
 */
export function attackEnemies(
  towers: Tower[],
  enemies: Enemy[],
  currentTime: number,
  projectileIdCounter: number,
  getColor: (type: TowerType) => string,
): { projectiles: Projectile[]; nextId: number } {
  const newProjectiles: Projectile[] = [];
  let nextId = projectileIdCounter;

  for (const tower of towers) {
    if (currentTime - tower.lastAttack < tower.attackSpeed) continue;

    const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
    const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

    const inRange = enemies.filter(e => {
      const dist = Math.sqrt(
        Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2),
      );
      return dist <= tower.range * CELL_SIZE;
    });

    if (inRange.length > 0) {
      const target = inRange[0];
      tower.lastAttack = currentTime;

      let projType: 'normal' | 'slow' | 'pierce' = 'normal';
      if (tower.type === 'blue') projType = 'slow';
      else if (tower.type === 'yellow') projType = 'pierce';

      newProjectiles.push({
        id: nextId++,
        x: towerCenterX,
        y: towerCenterY,
        targetX: target.x,
        targetY: target.y,
        color: getColor(tower.type),
        speed: PROJECTILE_SPEED,
        damage: tower.damage * tower.level,
        type: projType,
      });
    }
  }

  return { projectiles: newProjectiles, nextId };
}

/**
 * 弹丸移动并命中敌人处理结果
 */
export interface ProjectileHitResult {
  remainingProjectiles: Projectile[];
  enemies: Enemy[];
  killedEnemies: Enemy[];
  hitParticles: Array<{ x: number; y: number; color: string; count: number }>;
  paintGains: Array<{ colorType: 'red' | 'blue' | 'yellow'; amount: number }>;
  scoreGain: number;
  kills: number;
}

/**
 * 处理弹丸移动与命中
 */
export function resolveProjectileHits(
  projectiles: Projectile[],
  enemies: Enemy[],
  delta: number,
): ProjectileHitResult {
  const remaining: Projectile[] = [];
  let updatedEnemies = [...enemies];
  const killedEnemies: Enemy[] = [];
  const hitParticles: Array<{ x: number; y: number; color: string; count: number }> = [];
  const paintGains: Array<{ colorType: 'red' | 'blue' | 'yellow'; amount: number }> = [];
  let scoreGain = 0;
  let kills = 0;

  for (const proj of projectiles) {
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // 弹丸到达目标，判定命中
      const hitRange = proj.type === 'pierce' ? PROJECTILE_HIT_RANGE_PIERCE : PROJECTILE_HIT_RANGE_NORMAL;

      updatedEnemies = updatedEnemies.map(e => {
        const eDist = Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2));
        if (eDist >= hitRange) return e;

        hitParticles.push({ x: e.x, y: e.y, color: proj.color, count: 3 });

        const newHealth = e.health - proj.damage;

        if (newHealth <= 0) {
          const paintGain = KILL_PAINT_BASE + Math.floor(e.maxHealth / KILL_PAINT_HEALTH_DIVISOR);
          const colorType: 'red' | 'blue' | 'yellow' =
            e.colorType === 'mixed'
              ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
              : (e.colorType as 'red' | 'blue' | 'yellow');

          paintGains.push({ colorType, amount: paintGain });
          scoreGain += KILL_SCORE_BASE + Math.floor(e.maxHealth / KILL_SCORE_HEALTH_DIVISOR);
          kills++;
          killedEnemies.push({ ...e, health: 0 });
          hitParticles.push({ x: e.x, y: e.y, color: e.color, count: 8 });
          return { ...e, health: 0 };
        }

        if (proj.type === 'slow') {
          return { ...e, health: newHealth, speed: Math.max(MIN_ENEMY_SPEED, e.speed * SLOW_SPEED_MULTIPLIER) };
        }

        return { ...e, health: newHealth };
      }).filter(e => e.health > 0);
    } else {
      // 移动弹丸
      const newX = proj.x + (dx / dist) * proj.speed * delta;
      const newY = proj.y + (dy / dist) * proj.speed * delta;
      remaining.push({ ...proj, x: newX, y: newY });
    }
  }

  return {
    remainingProjectiles: remaining,
    enemies: updatedEnemies,
    killedEnemies,
    hitParticles,
    paintGains,
    scoreGain,
    kills,
  };
}

/**
 * 创建粒子效果
 */
export function createParticles(
  x: number,
  y: number,
  color: string,
  count: number,
  particleIdCounter: number,
): { particles: Particle[]; nextId: number } {
  const newParticles: Particle[] = [];
  let nextId = particleIdCounter;

  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: nextId++,
      x,
      y,
      color,
      size: 4 + Math.random() * 4,
      life: 30 + Math.random() * 20,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: (Math.random() - 0.5) * 4,
    });
  }

  return { particles: newParticles, nextId };
}

/**
 * 更新粒子状态（衰减）
 */
export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    }))
    .filter(p => p.life > 0);
}