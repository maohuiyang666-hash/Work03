import type { ReplayAction, ReplayActionType, ReplayData } from '../types/replay';

export const createReplay = (seed: number): ReplayData => ({
  seed,
  startedAt: Date.now(),
  actions: [],
});

export const appendReplayAction = (
  replay: ReplayData,
  wave: number,
  type: ReplayActionType,
  payload: unknown,
): ReplayData => ({
  ...replay,
  actions: [
    ...replay.actions,
    {
      time: Date.now(),
      wave,
      type,
      payload,
    } satisfies ReplayAction,
  ],
});

export const finalizeReplay = (replay: ReplayData, result: 'victory' | 'gameOver', payload: unknown): ReplayData => ({
  ...appendReplayAction(replay, replay.actions[replay.actions.length - 1]?.wave ?? 1, 'END_RUN', payload),
  endedAt: Date.now(),
  result,
});

export const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  const next = () => {
    current = (current * 1664525 + 1013904223) >>> 0;
    return current / 4294967296;
  };

  const getState = () => current;
  const setState = (value: number) => {
    current = value >>> 0;
  };

  return { next, getState, setState };
};
