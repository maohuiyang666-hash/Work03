import type { Particle } from '../types/entities';

export const createParticles = (
  startId: number,
  x: number,
  y: number,
  color: string,
  count = 5,
): { particles: Particle[]; nextParticleId: number } => {
  const particles: Particle[] = [];
  let nextParticleId = startId;

  for (let index = 0; index < count; index += 1) {
    particles.push({
      id: nextParticleId,
      x,
      y,
      color,
      size: 4 + Math.random() * 4,
      life: 30 + Math.random() * 20,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: (Math.random() - 0.5) * 4,
    });
    nextParticleId += 1;
  }

  return { particles, nextParticleId };
};

export const advanceParticles = (particles: Particle[]): Particle[] => (
  particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.velocityX,
      y: particle.y + particle.velocityY,
      life: particle.life - 1,
      size: particle.size * 0.95,
    }))
    .filter((particle) => particle.life > 0)
);
