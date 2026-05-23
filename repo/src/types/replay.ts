export type ReplayActionType =
  | 'PLACE_TOWER'
  | 'UPGRADE_TOWER'
  | 'SELECT_REWARD'
  | 'START_WAVE'
  | 'END_WAVE'
  | 'RANDOM_EVENT_TRIGGER'
  | 'RANDOM_EVENT_END'
  | 'DIFFICULTY_UPDATE'
  | 'END_RUN';

export interface ReplayAction {
  time: number;
  wave: number;
  type: ReplayActionType;
  payload: unknown;
}

export interface ReplayData {
  seed: number;
  startedAt: number;
  endedAt?: number;
  result?: 'victory' | 'gameOver';
  actions: ReplayAction[];
}
