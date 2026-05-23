import { ReplayAction, ReplayData, ReplayViewerState } from '../types/replay';
import { Reward } from '../types/reward';

export class ReplaySystem {
  private static actions: ReplayAction[] = [];
  private static startTime: number = 0;
  private static difficultyHistory: Array<{ wave: number; difficulty: number }> = [];
  private static eventHistory: Array<{ wave: number; event: string }> = [];

  static initialize(): void {
    this.actions = [];
    this.startTime = Date.now();
    this.difficultyHistory = [];
    this.eventHistory = [];
  }

  static recordAction(type: ReplayAction['type'], wave: number, payload: unknown): void {
    const action: ReplayAction = {
      time: Date.now() - this.startTime,
      wave,
      type,
      payload
    };
    this.actions.push(action);
  }

  static recordPlaceTower(wave: number, x: number, y: number, type: string, style: string): void {
    this.recordAction('PLACE_TOWER', wave, { x, y, type, style });
  }

  static recordUpgradeTower(wave: number, towerId: number): void {
    this.recordAction('UPGRADE_TOWER', wave, { towerId });
  }

  static recordSelectReward(wave: number, reward: Reward): void {
    this.recordAction('SELECT_REWARD', wave, reward);
  }

  static recordStartWave(wave: number): void {
    this.recordAction('START_WAVE', wave, { wave });
  }

  static recordDifficultyChange(wave: number, difficulty: number): void {
    this.recordAction('DIFFICULTY_CHANGE', wave, { difficulty });
    this.difficultyHistory.push({ wave, difficulty });
  }

  static recordEventTrigger(wave: number, eventName: string): void {
    this.recordAction('EVENT_TRIGGER', wave, { eventName });
    this.eventHistory.push({ wave, event: eventName });
  }

  static getReplayData(
    finalWave: number,
    finalScore: number,
    selectedRewards: Reward[]
  ): ReplayData {
    return {
      actions: [...this.actions],
      duration: Date.now() - this.startTime,
      finalWave,
      finalScore,
      selectedRewards,
      difficultyHistory: [...this.difficultyHistory],
      eventHistory: [...this.eventHistory]
    };
  }

  static getActions(): ReplayAction[] {
    return [...this.actions];
  }

  static getEvents(): Array<{ wave: number; event: string }> {
    return [...this.eventHistory];
  }

  static getDifficultyHistory(): Array<{ wave: number; difficulty: number }> {
    return [...this.difficultyHistory];
  }
}

export class ReplayViewerController {
  private state: ReplayViewerState;
  private replayData: ReplayData;

  constructor(replayData: ReplayData) {
    this.replayData = replayData;
    this.state = {
      isPlaying: false,
      speed: 1,
      currentTime: 0,
      currentWave: 1,
      selectedActionIndex: null
    };
  }

  play(): void {
    this.state.isPlaying = true;
  }

  pause(): void {
    this.state.isPlaying = false;
  }

  setSpeed(speed: number): void {
    this.state.speed = speed;
  }

  seekToWave(wave: number): void {
    const waveAction = this.replayData.actions.find(a => a.type === 'START_WAVE' && a.wave === wave);
    if (waveAction) {
      this.state.currentTime = waveAction.time;
      this.state.currentWave = wave;
    }
  }

  seekToAction(index: number): void {
    if (index >= 0 && index < this.replayData.actions.length) {
      this.state.selectedActionIndex = index;
      this.state.currentTime = this.replayData.actions[index].time;
      this.state.currentWave = this.replayData.actions[index].wave;
    }
  }

  update(deltaTime: number): void {
    if (!this.state.isPlaying) return;

    this.state.currentTime += deltaTime * this.state.speed;

    if (this.state.currentTime >= this.replayData.duration) {
      this.state.currentTime = this.replayData.duration;
      this.state.isPlaying = false;
    }

    const currentAction = this.replayData.actions.find(a => a.time > this.state.currentTime);
    if (currentAction) {
      this.state.currentWave = currentAction.wave;
    }
  }

  getState(): ReplayViewerState {
    return { ...this.state };
  }

  getReplayData(): ReplayData {
    return { ...this.replayData };
  }

  getCurrentActions(): ReplayAction[] {
    return this.replayData.actions.filter(a => a.time <= this.state.currentTime);
  }
}
