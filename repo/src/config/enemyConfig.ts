export const ENEMY_BASE_HEALTH = 40;
export const ENEMY_HEALTH_PER_WAVE = 15;
export const ENEMY_BASE_SPEED = 35;
export const ENEMY_SPEED_PER_WAVE = 3;
export const ENEMY_MAX_SPEED_BONUS = 25;
export const MIXED_ENEMY_UNLOCK_WAVE = 3;
export const PROJECTILE_HIT_DISTANCE = 10;
export const NORMAL_HIT_RANGE = 25;
export const PIERCE_HIT_RANGE = 60;
export const MIN_SLOWED_SPEED = 15;

export const ENEMY_COLORS = {
  red: '#c0392b',
  blue: '#2980b9',
  yellow: '#d68910',
};

export const MIXED_ENEMY_COLORS = ['#8e44ad', '#16a085', '#d35400'] as const;

export const getEnemiesPerWave = (wave: number): number => 5 + wave * 3;

export const getSpawnRate = (wave: number): number => 1.5 - Math.min(wave * 0.1, 0.8);
