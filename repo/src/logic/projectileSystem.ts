import type { Enemy, Tower, Projectile, Particle, TowerType } from '../types/entities';
import type { PaintEssence } from '../types/game';
import { CELL_SIZE, COLOR_VALUES } from '../config/gameConfig';
import { ENEMY_KILL_BASE_GAIN, ENEMY_KILL_GAIN_PER_HEALTH, ENEMY_KILL_BASE_SCORE, ENEMY_KILL_SCORE_PER_HEALTH } from '../config/enemyConfig';

export const createProjectile = (
  tower: Tower,
  target: Enemy,
  idRef: { current: number }
): Projectile => {
  const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
  const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;
  const color = COLOR_VALUES[tower.type];

  let type: 'normal' | 'slow' | 'pierce' = 'normal';
  if (tower.type === 'blue') type = 'slow';
  if (tower.type === 'yellow') type = 'pierce';

  return {
    id: idRef.current++,
    x: towerCenterX,
    y: towerCenterY,
    targetX: target.x,
    targetY: target.y,
    color,
    speed: 350,
    damage: tower.damage * tower.level,
    type,
  };
};

export const processProjectiles = (
  projectiles: Projectile[],
  enemies: Enemy[],
  delta: number,
  particleIdRef: { current: number }
): {
  projectiles: Projectile[];
  enemies: Enemy[];
  paintGain: PaintEssence;
  scoreGain: number;
  killCount: number;
  particles: Particle[];
} => {
  const remainingProjectiles: Projectile[] = [];
  let updatedEnemies = [...enemies];
  let paintGain: PaintEssence = { red: 0, blue: 0, yellow: 0 };
  let scoreGain = 0;
  let killCount = 0;
  const newParticles: Particle[] = [];

  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        color,
        size: 4 + Math.random() * 4,
        life: 30 + Math.random() * 20,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4,
      });
    }
  };

  projectiles.forEach(proj => {
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      const hitRange = proj.type === 'pierce' ? 60 : 25;
      updatedEnemies = updatedEnemies.map(enemy => {
        const eDist = Math.sqrt(Math.pow(enemy.x - proj.x, 2) + Math.pow(enemy.y - proj.y, 2));
        if (eDist < hitRange) {
          createParticles(enemy.x, enemy.y, proj.color, 3);
          const newHealth = enemy.health - proj.damage;

          if (newHealth <= 0) {
            const gain = ENEMY_KILL_BASE_GAIN + Math.floor(enemy.maxHealth / ENEMY_KILL_GAIN_PER_HEALTH);
            const colorType = enemy.colorType === 'mixed'
              ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
              : enemy.colorType;

            paintGain[colorType] += gain;
            scoreGain += ENEMY_KILL_BASE_SCORE + Math.floor(enemy.maxHealth / ENEMY_KILL_SCORE_PER_HEALTH);
            killCount++;
            createParticles(enemy.x, enemy.y, enemy.color, 8);
            return { ...enemy, health: 0 };
          }

          if (proj.type === 'slow') {
            return { ...enemy, health: newHealth, speed: Math.max(15, enemy.speed * 0.7) };
          }

          return { ...enemy, health: newHealth };
        }
        return enemy;
      }).filter(enemy => enemy.health > 0);
    } else {
      remainingProjectiles.push({
        ...proj,
        x: proj.x + (dx / dist) * proj.speed * delta,
        y: proj.y + (dy / dist) * proj.speed * delta,
      });
    }
  });

  return {
    projectiles: remainingProjectiles,
    enemies: updatedEnemies,
    paintGain,
    scoreGain,
    killCount,
    particles: newParticles,
  };
};

export const updateParticles = (particles: Particle[]): Particle[] => {
  return particles.map(p => ({
    ...p,
    x: p.x + p.velocityX,
    y: p.y + p.velocityY,
    life: p.life - 1,
    size: p.size * 0.95,
  })).filter(p => p.life > 0);
};
