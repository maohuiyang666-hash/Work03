import {
  MIN_SLOWED_SPEED,
  NORMAL_HIT_RANGE,
  PIERCE_HIT_RANGE,
  PROJECTILE_HIT_DISTANCE,
} from '../config/enemyConfig';
import { CELL_SIZE } from '../config/gameConfig';
import { TOWER_BASE_STATS, getTowerColor } from '../config/towerConfig';
import { createParticles } from './particleSystem';
import { calculateEnemyDefeatReward } from './resourceSystem';
import { getTowerCenter } from './towerSystem';
import type { Enemy, Particle, Projectile, Tower } from '../types/entities';
import type { ProjectileType } from '../types/game';

const getProjectileType = (tower: Tower): ProjectileType => {
  if (tower.type === 'blue') {
    return 'slow';
  }
  if (tower.type === 'yellow') {
    return 'pierce';
  }
  return 'normal';
};

export interface TowerFireResult {
  towers: Tower[];
  projectiles: Projectile[];
  nextProjectileId: number;
}

export const fireProjectiles = (
  towers: Tower[],
  enemies: Enemy[],
  currentTime: number,
  nextProjectileId: number,
): TowerFireResult => {
  const projectiles: Projectile[] = [];
  let projectileId = nextProjectileId;

  const updatedTowers = towers.map((tower) => {
    if (currentTime - tower.lastAttack < tower.attackSpeed) {
      return tower;
    }

    const towerCenter = getTowerCenter(tower);
    const target = enemies.find((enemy) => {
      const dx = enemy.x - towerCenter.x;
      const dy = enemy.y - towerCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= tower.range * CELL_SIZE;
    });

    if (!target) {
      return tower;
    }

    projectiles.push({
      id: projectileId,
      x: towerCenter.x,
      y: towerCenter.y,
      targetX: target.x,
      targetY: target.y,
      color: getTowerColor(tower.type),
      speed: TOWER_BASE_STATS.projectileSpeed,
      damage: tower.damage * tower.level,
      type: getProjectileType(tower),
    });

    projectileId += 1;

    return {
      ...tower,
      lastAttack: currentTime,
    };
  });

  return {
    towers: updatedTowers,
    projectiles,
    nextProjectileId: projectileId,
  };
};

export interface ProjectileResolutionResult {
  projectiles: Projectile[];
  enemies: Enemy[];
  particles: Particle[];
  nextParticleId: number;
  scoreGain: number;
  enemiesKilled: number;
  paintRewards: Partial<Record<'red' | 'blue' | 'yellow', number>>;
}

export const resolveProjectileHits = (
  projectiles: Projectile[],
  enemies: Enemy[],
  delta: number,
  nextParticleId: number,
): ProjectileResolutionResult => {
  const remainingProjectiles: Projectile[] = [];
  let updatedEnemies = [...enemies];
  let particleId = nextParticleId;
  let scoreGain = 0;
  let enemiesKilled = 0;
  const paintRewards: Partial<Record<'red' | 'blue' | 'yellow', number>> = {};
  const particles: Particle[] = [];

  projectiles.forEach((projectile) => {
    const dx = projectile.targetX - projectile.x;
    const dy = projectile.targetY - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= PROJECTILE_HIT_DISTANCE) {
      remainingProjectiles.push({
        ...projectile,
        x: projectile.x + (dx / distance) * projectile.speed * delta,
        y: projectile.y + (dy / distance) * projectile.speed * delta,
      });
      return;
    }

    updatedEnemies = updatedEnemies
      .map((enemy) => {
        const enemyDistance = Math.sqrt((enemy.x - projectile.x) ** 2 + (enemy.y - projectile.y) ** 2);
        const hitRange = projectile.type === 'pierce' ? PIERCE_HIT_RANGE : NORMAL_HIT_RANGE;

        if (enemyDistance >= hitRange) {
          return enemy;
        }

        const hitParticleResult = createParticles(particleId, enemy.x, enemy.y, projectile.color, 3);
        particles.push(...hitParticleResult.particles);
        particleId = hitParticleResult.nextParticleId;

        const nextHealth = enemy.health - projectile.damage;
        if (nextHealth <= 0) {
          const reward = calculateEnemyDefeatReward(enemy, Math.random());
          paintRewards[reward.colorType] = (paintRewards[reward.colorType] ?? 0) + reward.paintGain;
          scoreGain += reward.scoreGain;
          enemiesKilled += 1;

          const defeatParticleResult = createParticles(particleId, enemy.x, enemy.y, enemy.color, 8);
          particles.push(...defeatParticleResult.particles);
          particleId = defeatParticleResult.nextParticleId;
          return { ...enemy, health: 0 };
        }

        if (projectile.type === 'slow') {
          return {
            ...enemy,
            health: nextHealth,
            speed: Math.max(MIN_SLOWED_SPEED, enemy.speed * 0.7),
          };
        }

        return {
          ...enemy,
          health: nextHealth,
        };
      })
      .filter((enemy) => enemy.health > 0);
  });

  return {
    projectiles: remainingProjectiles,
    enemies: updatedEnemies,
    particles,
    nextParticleId: particleId,
    scoreGain,
    enemiesKilled,
    paintRewards,
  };
};
