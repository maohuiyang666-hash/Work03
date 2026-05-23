import { Reward } from './reward';

export interface ReplayAction {
  time: number;
  wave: number;
  type: 'PLACE_TOWER' | 'UPGRADE_TOWER' | 'SELECT_REWARD' | 'START_WAVE' | 'EVENT_TRIGGER' | 'DIFFICULTY_CHANGE';
  payload: unknown;
}

export interface ReplayData {
  actions: ReplayAction[];
  duration: number;
  finalWave: number;
  finalScore: number;
  selectedRewards: Reward[];
  difficultyHistory: Array<{ wave: number; difficulty: number }>;
  eventHistory: Array<{ wave: number; event: string }>;
}

export interface ReplayViewerState {
  isPlaying: boolean;
  speed: number;
  currentTime: number;
  currentWave: number;
  selectedActionIndex: number | null;
}
