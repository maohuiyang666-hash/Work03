import { Reward } from './reward';

export interface PlayerBuild {
  selectedRewards: Reward[];
  buildTags: string[];
  buildStats: {
    redPower: number;
    blueControl: number;
    yellowSpeed: number;
    economy: number;
    defense: number;
  };
}

export interface DifficultyState {
  healthMultiplier: number;
  speedMultiplier: number;
  countMultiplier: number;
  mixedProb: number;
  eliteProb: number;
  rewardCount: number;
}

export interface CampaignStats {
  highestScore: number;
  highestWave: number;
  bestBuild: string[];
}

export interface CampaignState {
  currentWave: number;
  coreHealth: number;
  paint: { red: number; blue: number; yellow: number };
  score: number;
  enemiesKilled: number;
  randomSeed: number;
  difficulty: DifficultyState;
}

export interface SaveData {
  version: number;
  savedAt: number;
  campaign: CampaignState;
  build: PlayerBuild;
  stats: CampaignStats;
}
