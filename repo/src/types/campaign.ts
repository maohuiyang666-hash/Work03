import { Reward } from './reward';

export interface BuildStats {
  redPower: number;
  blueControl: number;
  yellowSpeed: number;
  economy: number;
  defense: number;
}

export interface PlayerBuild {
  selectedRewards: Reward[];
  buildTags: string[];
  buildStats: BuildStats;
}

export interface DifficultyState {
  enemyCountMod: number;
  enemyHealthMod: number;
  enemySpeedMod: number;
  mixedColorChance: number;
  eliteChance: number;
  bonusRewardMod: number;
  lastWaveTime: number;
  enemiesReachedCore: boolean;
}

export interface CampaignEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  remainingWaves: number;
  effect: CampaignEventEffect;
  startedAtWave: number;
}

export interface CampaignEventEffect {
  type: 'projectileSpeed' | 'enemyHealth' | 'blockBuilding' | 'towerBuff' | 'paintReduction';
  value: number;
  targetColor?: string;
}

export interface CampaignState {
  wave: number;
  coreHealth: number;
  paint: { red: number; blue: number; yellow: number };
  score: number;
  enemiesKilled: number;
  seed: number;
  selectedRewards: Reward[];
  buildTags: string[];
  difficultyDirector: DifficultyState;
  activeEvents: CampaignEvent[];
  eventHistory: CampaignEvent[];
  difficultyHistory: { wave: number; enemyCount: number; enemyHealth: number; enemySpeed: number }[];
}

export interface CampaignStats {
  highScore: number;
  maxWave: number;
  bestBuild: { tags: string[]; stats: BuildStats } | null;
  totalGames: number;
  totalEnemiesKilled: number;
}

export interface SaveData {
  version: number;
  savedAt: number;
  campaign: CampaignState;
  build: PlayerBuild;
  stats: CampaignStats;
}