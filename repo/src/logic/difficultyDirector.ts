import { DifficultyState } from '../types/campaign';

export function createInitialDifficulty(): DifficultyState {
  return {
    enemyCountMod: 0,
    enemyHealthMod: 0,
    enemySpeedMod: 0,
    mixedColorChance: 0.1,
    eliteChance: 0,
    bonusRewardMod: 0,
    lastWaveTime: 0,
    enemiesReachedCore: false,
  };
}

export interface DirectorInput {
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  paintTotal: number;
  towerCount: number;
  lastWaveDurationMs: number;
  enemiesReachedCore: boolean;
  buildStrengthScore: number;
  previousDifficulty: DifficultyState;
}

export function calculateDifficulty(input: DirectorInput): DifficultyState {
  const { wave, coreHealth, score, enemiesKilled, paintTotal, towerCount, lastWaveDurationMs, enemiesReachedCore, buildStrengthScore, previousDifficulty } = input;

  const performanceScore = calculatePerformanceScore({
    coreHealth, score, enemiesKilled, paintTotal, towerCount, lastWaveDurationMs, enemiesReachedCore,
  });

  const effectiveScore = (performanceScore + buildStrengthScore * 0.3);

  const baseEnemyCount = 5 + wave * 3;
  let targetEnemyHealthMod = 0;
  let targetEnemySpeedMod = 0;
  let targetMixedChance = 0.1 + wave * 0.02;
  let targetEliteChance = 0;

  if (effectiveScore > 0.7) {
    targetEnemyHealthMod = wave * 0.12;
    targetEnemySpeedMod = wave * 0.04;
    targetMixedChance = 0.15 + wave * 0.04;
    targetEliteChance = Math.min(0.25, (wave - 3) * 0.03);
  } else if (effectiveScore > 0.4) {
    targetEnemyHealthMod = wave * 0.07;
    targetEnemySpeedMod = wave * 0.02;
    targetMixedChance = 0.12 + wave * 0.03;
    targetEliteChance = Math.min(0.15, (wave - 4) * 0.02);
  } else {
    targetEnemyHealthMod = wave * 0.03;
    targetEnemySpeedMod = Math.max(0, wave * 0.01 - 0.02);
    targetMixedChance = 0.1 + wave * 0.02;
    targetEliteChance = Math.min(0.08, (wave - 5) * 0.01);
  }

  const smooth = (prev: number, target: number): number => prev + (target - prev) * 0.4;

  return {
    enemyCountMod: Math.floor(baseEnemyCount * (1 + smooth(previousDifficulty.enemyCountMod, targetEnemyHealthMod)) - baseEnemyCount),
    enemyHealthMod: smooth(previousDifficulty.enemyHealthMod, targetEnemyHealthMod),
    enemySpeedMod: smooth(previousDifficulty.enemySpeedMod, targetEnemySpeedMod),
    mixedColorChance: Math.min(0.5, smooth(previousDifficulty.mixedColorChance, targetMixedChance)),
    eliteChance: Math.min(0.3, smooth(previousDifficulty.eliteChance, targetEliteChance)),
    bonusRewardMod: 0,
    lastWaveTime: lastWaveDurationMs,
    enemiesReachedCore,
  };
}

interface PerformanceInput {
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  paintTotal: number;
  towerCount: number;
  lastWaveDurationMs: number;
  enemiesReachedCore: boolean;
}

function calculatePerformanceScore(input: PerformanceInput): number {
  let score = 0;

  score += Math.min(1, input.coreHealth / 100) * 0.3;

  score += Math.min(1, input.towerCount / 8) * 0.15;

  score += Math.min(1, input.paintTotal / 300) * 0.15;

  if (input.lastWaveDurationMs > 0) {
    const maxTime = 120000;
    const timeRatio = 1 - Math.min(1, input.lastWaveDurationMs / maxTime);
    score += timeRatio * 0.2;
  }

  if (!input.enemiesReachedCore) {
    score += 0.2;
  }

  return score;
}