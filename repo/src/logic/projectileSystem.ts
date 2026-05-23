import { Projectile, Enemy, Particle, PaintEssence } from '../types';

export const createParticles = (
  idStart: number,
  x: number,
  y: number,
  color: string,
  count: number = 5
): { particles: Particle[]; nextId: number } => {
  const newParticles: Particle[] = [];
  let currentId = idStart;
  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: currentId++,
      x,
      y,
      color,
      size: 4 + Math.random() * 4,
      life: 30 + Math.random() * 20,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: (Math.random() - 0.5) * 4,
    });
  }
  return { particles: newParticles, nextId: currentId };
};

export const updateParticles = (particles: Particle[]): Particle[] => {
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

export interface HitResult {
  remainingProjectiles: Projectile[];
  updatedEnemies: Enemy[];
  newParticles: Particle[];
  paintGain: PaintEssence;
  scoreGain: number;
  enemiesKilled: number;
  nextParticleId: number;
}

export const resolveProjectileHits = (
  projectiles: Projectile[],
  enemies: Enemy[],
  delta: number,
  particleIdStart: number
): HitResult => {
  const remainingProjectiles: Projectile[] = [];
  let currentEnemies = [...enemies];
  const newParticles: Particle[] = [];
  const paintGain: PaintEssence = { red: 0, blue: 0, yellow: 0 };
  let scoreGain = 0;
  let enemiesKilled = 0;
  let currentParticleId = particleIdStart;

  projectiles.forEach(proj => {
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      let hitSomeone = false;
      const updated = currentEnemies
        .map(e => {
          const eDist = Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2));
          const hitRange = proj.type === 'pierce' ? 60 : 25;

          if (eDist < hitRange) {
            hitSomeone = true;
            const hitRes = createParticles(currentParticleId, e.x, e.y, proj.color, 3);
            currentParticleId = hitRes.nextId;
            newParticles.push(...hitRes.particles);

            const newHealth = e.health - proj.damage;

            if (newHealth <= 0) {
              const gain = 8 + Math.floor(e.maxHealth / 15);
              const colorType =
                e.colorType === 'mixed'
                  ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
                  : e.colorType;

              paintGain[colorType] += gain;
              scoreGain += 15 + Math.floor(e.maxHealth / 10);
              enemiesKilled += 1;

              const deathRes = createParticles(currentParticleId, e.x, e.y, e.color, 8);
              currentParticleId = deathRes.nextId;
              newParticles.push(...deathRes.particles);

              return { ...e, health: 0 };
            }

            if (proj.type === 'slow') {
              return { ...e, health: newHealth, speed: Math.max(15, e.speed * 0.7) };
            }

            return { ...e, health: newHealth };
          }
          return e;
        })
        .filter(e => e.health > 0);

      currentEnemies = updated;
      
      // If it's a pierce projectile, it continues moving instead of disappearing?
      // Wait, original code:
      // if (dist < 10) { ... it removes the projectile }
      // The original code always removes the projectile when it reaches target!
      // So pierce just has a larger hitRange when it arrives.
    } else {
      remainingProjectiles.push({
        ...proj,
        x: proj.x + (dx / dist) * proj.speed * delta,
        y: proj.y + (dy / dist) * proj.speed * delta,
      });
    }
  });

  return {
    remainingProjectiles,
    updatedEnemies: currentEnemies,
    newParticles,
    paintGain,
    scoreGain,
    enemiesKilled,
    nextParticleId: currentParticleId,
  };
};
