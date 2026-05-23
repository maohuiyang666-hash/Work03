export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RewardType =
  | 'damage'
  | 'range'
  | 'attackSpeed'
  | 'paintGain'
  | 'projectileSpeed'
  | 'healthRestore'
  | 'specialTower'
  | 'projectileSplit';

export interface Reward {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: RewardType;
  effect: number;
  appliesTo?: 'red' | 'blue' | 'yellow' | 'all';
}

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
