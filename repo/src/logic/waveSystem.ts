import type { Enemy } from '../types/entities';
import { MAX_WAVES } from '../config/gameConfig';

export const calculateWaveReward = (wave: number) => {
  return { red: 10, blue: 10, yellow: 10 };
};

export const isVictory = (wave: number, waveInProgress: boolean, enemies: Enemy[]): boolean => {
  return wave >= MAX_WAVES && !waveInProgress && enemies.length === 0;
};

export const isGameOver = (coreHealth: number): boolean => {
  return coreHealth <= 0;
};

export const getEnemiesPerWave = (wave: number): number => {
  return 5 + wave * 3;
};

export const getSpawnRate = (wave: number): number => {
  return 1.5 - Math.min(wave * 0.1, 0.8);
};
