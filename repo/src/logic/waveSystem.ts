import { getEnemiesPerWave, getSpawnRate } from '../config/enemyConfig';
import { MAX_WAVE, WAVE_REWARD } from '../config/gameConfig';
import type { PaintEssence } from '../types/game';

export const getWaveEnemyCount = (wave: number): number => getEnemiesPerWave(wave);

export const getWaveSpawnRate = (wave: number): number => getSpawnRate(wave);

export const calculateWaveReward = (): PaintEssence => ({ ...WAVE_REWARD });

export const checkGameOver = (coreHealth: number): boolean => coreHealth <= 0;

export const checkVictory = (wave: number): boolean => wave >= MAX_WAVE;
