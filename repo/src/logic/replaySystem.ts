import { ReplayData, ReplayAction } from '../types/replay';

export function createReplay(seed: number): ReplayData {
  return {
    version: 1,
    seed,
    actions: [],
    finalStats: {
      score: 0,
      wave: 0,
      coreHealth: 0,
      enemiesKilled: 0,
      buildTags: [],
      selectedRewards: [],
    },
  };
}

export function recordAction(
  replay: ReplayData,
  action: ReplayAction
): ReplayData {
  return {
    ...replay,
    actions: [...replay.actions, action],
  };
}

export function finalizeReplay(
  replay: ReplayData,
  finalStats: ReplayData['finalStats']
): ReplayData {
  return {
    ...replay,
    finalStats,
  };
}

export function getActionsAtWave(replay: ReplayData, wave: number): ReplayAction[] {
  return replay.actions.filter(a => a.wave === wave);
}

export function getMaxWave(replay: ReplayData): number {
  if (replay.actions.length === 0) return 0;
  return Math.max(...replay.actions.map(a => a.wave));
}