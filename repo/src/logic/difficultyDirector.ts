import { getBuildStrengthScore } from './buildSystem';
import type { DifficultyDirectorState, DifficultySnapshot } from '../types/campaign';
import type { PaintEssence, Tower, WaveDirectorConfig, WaveMetrics } from '../types/game';
import type { PlayerBuild } from '../types/reward';

interface DirectorContext {
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  paint: PaintEssence;
  towers: Tower[];
  build: PlayerBuild;
  lastWaveMetrics: WaveMetrics;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const createInitialDifficultyDirector = (): DifficultyDirectorState => ({
  threatLevel: 1,
  history: [],
  lastWaveMetrics: null,
});

const calculatePerformance = (context: DirectorContext): number => {
  const healthScore = context.coreHealth / 100;
  const scoreRate = clamp(context.score / Math.max(context.wave * 140, 1), 0, 2);
  const killRate = clamp(context.enemiesKilled / Math.max(context.wave * 6, 1), 0, 2);
  const paintScore = clamp((context.paint.red + context.paint.blue + context.paint.yellow) / Math.max(context.wave * 55, 1), 0, 2);
  const towerScore = clamp(context.towers.length / Math.max(3 + context.wave * 0.75, 1), 0, 2);
  const durationTarget = Math.max(14000 - context.wave * 450, 7000);
  const durationScore = clamp(durationTarget / Math.max(context.lastWaveMetrics.durationMs, 1000), 0.6, 1.6);
  const leakPenalty = clamp(1 - context.lastWaveMetrics.leakedEnemies * 0.15 - context.lastWaveMetrics.leakedDamage / 120, 0.55, 1);
  const buildScore = clamp(getBuildStrengthScore(context.build) / Math.max(context.wave * 4, 1), 0, 2);

  return healthScore * 0.2 + scoreRate * 0.15 + killRate * 0.1 + paintScore * 0.12 + towerScore * 0.1 + durationScore * 0.13 + leakPenalty * 0.1 + buildScore * 0.1;
};

export const buildWaveConfig = (wave: number, threatLevel: number): WaveDirectorConfig => {
  const baseCount = 6 + wave * 2.4;
  const baseHealth = 42 + wave * 13;
  const baseSpeed = 34 + Math.min(wave * 2.5, 24);
  const smoothThreat = clamp(threatLevel, 0.75, 1.65);

  return {
    enemyCount: Math.round(baseCount * (0.88 + smoothThreat * 0.24)),
    enemyHealth: Math.round(baseHealth * (0.88 + smoothThreat * 0.26)),
    enemySpeed: Math.round(baseSpeed * (0.92 + smoothThreat * 0.16)),
    mixedChance: clamp(0.08 + Math.max(0, wave - 2) * 0.035 + (smoothThreat - 1) * 0.08, 0.08, 0.55),
    eliteChance: clamp(0.03 + wave * 0.018 + (smoothThreat - 1) * 0.06, 0.03, 0.26),
    rewardMultiplier: clamp(1 + (smoothThreat - 1) * 0.2, 0.92, 1.25),
    spawnRate: clamp(1.35 - wave * 0.05 - (smoothThreat - 1) * 0.1, 0.45, 1.35),
  };
};

export const advanceDifficultyDirector = (
  state: DifficultyDirectorState,
  context: DirectorContext,
): { director: DifficultyDirectorState; nextWaveConfig: WaveDirectorConfig; snapshot: DifficultySnapshot } => {
  const performance = calculatePerformance(context);
  const targetThreat = clamp(0.82 + performance * 0.42, 0.82, 1.6);
  const threatLevel = clamp(state.threatLevel * 0.75 + targetThreat * 0.25, 0.8, 1.58);
  const nextWaveConfig = buildWaveConfig(context.wave + 1, threatLevel);
  const summary =
    threatLevel >= state.threatLevel + 0.04
      ? '导演判断玩家表现强势，下一波略微增压。'
      : threatLevel <= state.threatLevel - 0.04
        ? '导演检测到防线吃紧，下一波略微放缓。'
        : '导演维持平滑节奏，下一波强度基本稳定。';

  const snapshot: DifficultySnapshot = {
    wave: context.wave + 1,
    threatLevel: Number(threatLevel.toFixed(2)),
    summary,
    ...nextWaveConfig,
  };

  return {
    director: {
      threatLevel,
      lastWaveMetrics: context.lastWaveMetrics,
      history: [...state.history, snapshot],
    },
    nextWaveConfig,
    snapshot,
  };
};
