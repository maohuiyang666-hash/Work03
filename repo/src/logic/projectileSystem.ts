import type { Projectile, Enemy, Particle } from '../types/entities';
import type { PaintEssence } from '../types/game';
import { PIERCE_HIT_RANGE, NORMAL_HIT_RANGE, SLOW_EFFECT_MULTIPLIER, MIN_SPEED_AFTER_SLOW, getKillPaintReward, getKillScoreReward } from '../config/enemyConfig';
import { createParticles } from './enemySystem';

let projectileIdCounter = 0;

export const resetProjectileIdCounter = () => {
  projectileIdCounter = 0;
};

export const resolveProjectileHits = (
  projectiles: Projectile[],
  enemies: Enemy[],
  delta: number,
  particleIdGenerator: () => number
): {
  projectiles: Projectile[];
  enemies: Enemy[];
  particles: Particle[];
  paintGain: PaintEssence;
  scoreGain: number;
  kills: number;
} => {
  const remainingProjectiles: Projectile[] = [];
  let paintGain: PaintEssence = { red: 0, blue: 0, yellow: 0 };
  let scoreGain = 0;
  let kills = 0;
  const newParticles: Particle[] = [];

  const updatedEnemies = [...enemies];

  for (const proj of projectiles) {
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      const hitRange = proj.type === 'pierce' ? PIERCE_HIT_RANGE : NORMAL_HIT_RANGE;
      
      for (let i = 0; i < updatedEnemies.length; i++) {
        const e = updatedEnemies[i];
        const eDist = Math.sqrt(
          Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2)
        );

        if (eDist < hitRange) {
          newParticles.push(...createParticles(e.x, e.y, proj.color, 3));
          
          const newHealth = e.health - proj.damage;
          
          if (newHealth <= 0) {
            const paintReward = getKillPaintReward(e.maxHealth);
            const colorType = e.colorType === 'mixed'
              ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
              : e.colorType;
            
            paintGain[colorType] += paintReward;
            scoreGain += getKillScoreReward(e.maxHealth);
            kills++;
            newParticles.push(...createParticles(e.x, e.y, e.color, 8));
            updatedEnemies.splice(i, 1);
            break;
          }

          if (proj.type === 'slow') {
            updatedEnemies[i] = {
              ...e,
              health: newHealth,
              speed: Math.max(MIN_SPEED_AFTER_SLOW, e.speed * SLOW_EFFECT_MULTIPLIER),
            };
          } else {
            updatedEnemies[i] = { ...e, health: newHealth };
          }
        }
      }
    } else {
      remainingProjectiles.push({
        ...proj,
        x: proj.x + (dx / dist) * proj.speed * delta,
        y: proj.y + (dy / dist) * proj.speed * delta,
      });
    }
  }

  return {
    projectiles: remainingProjectiles,
    enemies: updatedEnemies,
    particles: newParticles,
    paintGain,
    scoreGain,
    kills,
  };
};
