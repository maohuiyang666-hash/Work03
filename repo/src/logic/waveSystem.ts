import type { PaintEssence } from '../types/game';
import { MAX_WAVES, WAVE_BONUS } from '../config/gameConfig';

/**
 * 计算波次完成奖励
 */
export function calculateWaveReward(): PaintEssence {
  return { ...WAVE_BONUS };
}

/**
 * 检查游戏是否失败
 */
export function checkGameOver(coreHealth: number): boolean {
  return coreHealth <= 0;
}

/**
 * 检查是否胜利（完成所有波次且没有敌人剩余）
 */
export function checkVictory(wave: number, enemiesCount: number): boolean {
  return wave >= MAX_WAVES && enemiesCount === 0;
}

/**
 * 获取下一波次号（不超过最高波次）
 */
export function getNextWave(currentWave: number): number {
  return Math.min(currentWave + 1, MAX_WAVES);
}