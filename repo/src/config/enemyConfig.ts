import type { ColorType } from '../types/entities';

export const ENEMY_COLORS: Record<ColorType, string> = {
  red: '#c0392b',
  blue: '#2980b9',
  yellow: '#d68910',
  mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(Math.random() * 3)],
};

export const ENEMY_BASE_HEALTH = 40;
export const ENEMY_HEALTH_PER_WAVE = 15;
export const ENEMY_BASE_SPEED = 35;
export const ENEMY_SPEED_PER_WAVE = 3;
export const ENEMY_MAX_SPEED_BONUS = 25;

export const ENEMY_KILL_BASE_GAIN = 8;
export const ENEMY_KILL_GAIN_PER_HEALTH = 15;
export const ENEMY_KILL_BASE_SCORE = 15;
export const ENEMY_KILL_SCORE_PER_HEALTH = 10;

export const ENEMY_CORE_DAMAGE = 10;
