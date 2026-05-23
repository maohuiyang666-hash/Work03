import { Reward, PlayerBuild, BuildStats } from './reward';

export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

export interface CampaignState {
  wave: number;
  coreHealth: number;
  paint: PaintEssence;
  score: number;
  enemiesKilled: number;
  towersCount: number;
  lastWaveDuration: number;
  lastWaveHadLeaker: boolean;
}

export interface DifficultyDirector {
  currentDifficulty: number;
  enemyMultiplier: number;
  healthMultiplier: number;
  speedMultiplier: number;
  mixedEnemyChance: number;
  eliteEnemyChance: number;
  rewardMultiplier: number;
  history: DifficultySnapshot[];
}

export interface DifficultySnapshot {
  wave: number;
  difficulty: number;
  timestamp: number;
}

export interface CampaignEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  duration: number;
  startTime: number;
  active: boolean;
  effect: EventEffect;
}

export type EventType =
  | 'paintStorm'
  | 'darkErosion'
  | 'mapCrack'
  | 'inspirationBurst'
  | 'paintDrought';

export interface EventEffect {
  projectileSpeedBonus?: number;
  enemyHealthMultiplier?: number;
  placeTowerRestriction?: boolean;
  randomTowerBonus?: boolean;
  paintGainReduction?: number;
}

export interface CampaignStats {
  highestWave: number;
  highestScore: number;
  totalKills: number;
  totalGames: number;
  bestBuild: PlayerBuild | null;
}

export interface SaveData {
  version: number;
  savedAt: number;
  campaign: CampaignState;
  build: PlayerBuild;
  difficulty: DifficultyDirector;
  stats: CampaignStats;
  replayActions: ReplayAction[];
}

export interface ReplayAction {
  time: number;
  wave: number;
  type: 'PLACE_TOWER' | 'UPGRADE_TOWER' | 'SELECT_REWARD' | 'START_WAVE' | 'EVENT_TRIGGER' | 'DIFFICULTY_CHANGE';
  payload: unknown;
}

export { Reward, PlayerBuild, BuildStats };
