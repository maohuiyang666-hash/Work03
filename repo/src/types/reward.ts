import type { TowerType } from './game';

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardType = 'damage' | 'range' | 'attackSpeed' | 'economy' | 'projectile' | 'healing' | 'unlock' | 'special';

export interface BuildModifiers {
  damageMultiplier: number;
  rangeBonus: number;
  attackSpeedMultiplier: number;
  projectileSpeedMultiplier: number;
  bonusPaintOnKill: number;
  splitShots: number;
  chainHits: number;
  towerTypeDamageBonus: Record<TowerType, number>;
  towerTypeRangeBonus: Record<TowerType, number>;
  towerTypeAttackSpeedMultiplier: Record<TowerType, number>;
}

export interface BuildStats {
  redPower: number;
  blueControl: number;
  yellowSpeed: number;
  economy: number;
  defense: number;
  fusion: number;
}

export interface RewardEffect {
  towerDamageMultiplier?: number;
  towerRangeBonus?: number;
  towerAttackSpeedMultiplier?: number;
  bonusPaintOnKill?: number;
  projectileSpeedMultiplier?: number;
  coreHealthRestore?: number;
  unlockSpecial?: string;
  splitShots?: number;
  chainHits?: number;
  towerTypeDamageBonus?: Partial<Record<TowerType, number>>;
  towerTypeRangeBonus?: Partial<Record<TowerType, number>>;
  towerTypeAttackSpeedMultiplier?: Partial<Record<TowerType, number>>;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  rarity: RewardRarity;
  type: RewardType;
  effect: RewardEffect;
  buildStatDeltas: Partial<BuildStats>;
  tags: string[];
}

export interface PlayerBuild {
  selectedRewards: Reward[];
  buildTags: string[];
  buildStats: BuildStats;
  modifiers: BuildModifiers;
  unlockedSpecials: string[];
}
