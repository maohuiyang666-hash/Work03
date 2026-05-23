import type { PaintEssence, WaveConfig } from '../types/game';
import { getWaveConfig, MAX_WAVES, WAVE_BONUS } from '../config/gameConfig';

export const calculateWaveReward = (): PaintEssence => {
  return { ...WAVE_BONUS };
};

export const getWaveEnemiesCount = (wave: number): number => {
  return getWaveConfig(wave).enemyCount;
};

export const getSpawnRate = (wave: number): number => {
  return getWaveConfig(wave).spawnRate;
};

export const isLastWave = (wave: number): boolean => {
  return wave >= MAX_WAVES;
};

export const getNextWaveConfig = (currentWave: number): WaveConfig => {
  return getWaveConfig(currentWave + 1);
};

export const canSkipWave = (
  wave: number,
  waveInProgress: boolean,
  enemiesCount: number
): boolean => {
  return !waveInProgress && wave < MAX_WAVES && enemiesCount === 0;
};
