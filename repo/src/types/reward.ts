export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Reward {
  id: string;
  name: string;
  description: string;
  rarity: RewardRarity;
  type: string;
  effect: Record<string, any>;
}
