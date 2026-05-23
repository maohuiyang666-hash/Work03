export interface ReplayAction {
  time: number;
  wave: number;
  type: 'PLACE_TOWER' | 'UPGRADE_TOWER' | 'SELECT_REWARD' | 'START_WAVE' | 'EVENT_TRIGGER' | 'DIFFICULTY_CHANGE';
  payload: any;
}

export interface ReplayData {
  seed: number;
  actions: ReplayAction[];
  finalStats: any;
}
