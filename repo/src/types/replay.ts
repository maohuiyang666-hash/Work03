export type ReplayActionType =
  | 'PLACE_TOWER'
  | 'UPGRADE_TOWER'
  | 'SELECT_REWARD'
  | 'START_WAVE'
  | 'END_WAVE'
  | 'TRIGGER_EVENT'
  | 'DIFFICULTY_CHANGE'
  | 'GAME_START'
  | 'GAME_END';

export interface ReplayAction {
  time: number;
  wave: number;
  type: ReplayActionType;
  payload: unknown;
}

export interface ReplayData {
  version: number;
  seed: number;
  actions: ReplayAction[];
  finalStats: {
    score: number;
    wave: number;
    coreHealth: number;
    enemiesKilled: number;
    buildTags: string[];
    selectedRewards: { name: string; rarity: string }[];
  };
}

export type PlaybackSpeed = 1 | 2 | 4 | 8;