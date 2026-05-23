import { ReplayAction, ReplayData } from '../types/replay';

export class ReplayRecorder {
  private actions: ReplayAction[] = [];
  private seed: number;
  private startTime: number;

  constructor(seed: number) {
    this.seed = seed;
    this.startTime = Date.now();
  }

  record(wave: number, type: ReplayAction['type'], payload: any) {
    this.actions.push({
      time: Date.now() - this.startTime,
      wave,
      type,
      payload
    });
  }

  getReplay(finalStats: any): ReplayData {
    return {
      seed: this.seed,
      actions: [...this.actions],
      finalStats
    };
  }
}
