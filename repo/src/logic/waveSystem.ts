import { PaintEssence } from '../types';

export const calculateWaveReward = (): PaintEssence => {
  return { red: 10, blue: 10, yellow: 10 };
};

export const checkGameOver = (coreHealth: number): boolean => {
  return coreHealth <= 0;
};

export const checkVictory = (wave: number, maxWave: number): boolean => {
  return wave >= maxWave;
};
