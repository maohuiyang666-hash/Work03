export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RewardType =
  | 'towerDamage'
  | 'towerRange'
  | 'towerAttackSpeed'
  | 'bonusPaint'
  | 'projectileSpeed'
  | 'coreHeal'
  | 'specialTower'
  | 'splitProjectile';

export interface RewardEffect {
  type: RewardType;
  value: number;
  target?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  rarity: RewardRarity;
  type: RewardType;
  effect: RewardEffect;
}

export interface ActiveRewardModifiers {
  towerDamageMult: number;
  towerRangeMult: number;
  towerAttackSpeedMult: number;
  bonusPaintMult: number;
  projectileSpeedMult: number;
  splitProjectile: boolean;
  splitCount: number;
  unlockSpecialTower: string | null;
}