import { REWARD_POOL } from '../config/rewardConfig';
import type { Reward, RewardRarity } from '../types/reward';
import type { Tower } from '../types/game';

const rarityWeights: Record<RewardRarity, number> = {
  common: 55,
  rare: 28,
  epic: 12,
  legendary: 5,
};

const synergyForReward = (reward: Reward, selectedRewardIds: Set<string>): number => {
  const sharedTagBoost = reward.tags.some((tag) => Array.from(selectedRewardIds).some((id) => id.includes(tag))) ? 6 : 0;
  return sharedTagBoost;
};

const weightedPick = (pool: Reward[], selectedRewardIds: Set<string>, random: () => number): Reward => {
  const totalWeight = pool.reduce((sum, reward) => {
    const duplicatePenalty = selectedRewardIds.has(reward.id) ? 0 : 1;
    return sum + rarityWeights[reward.rarity] * duplicatePenalty + synergyForReward(reward, selectedRewardIds);
  }, 0);

  let roll = random() * totalWeight;

  for (const reward of pool) {
    if (selectedRewardIds.has(reward.id)) continue;
    roll -= rarityWeights[reward.rarity] + synergyForReward(reward, selectedRewardIds);
    if (roll <= 0) return reward;
  }

  return pool.find((reward) => !selectedRewardIds.has(reward.id)) ?? pool[0];
};

export const generateRewardChoices = (currentRewards: Reward[], random: () => number): Reward[] => {
  const choices: Reward[] = [];
  const selectedRewardIds = new Set(currentRewards.map((reward) => reward.id));

  while (choices.length < 3 && choices.length < REWARD_POOL.length) {
    const reward = weightedPick(REWARD_POOL, new Set([...selectedRewardIds, ...choices.map((choice) => choice.id)]), random);
    if (!choices.some((choice) => choice.id === reward.id) && !selectedRewardIds.has(reward.id)) {
      choices.push(reward);
    }
  }

  return choices;
};

const applyTowerAdjustment = (tower: Tower, reward: Reward): Tower => {
  const damageMultiplier = (reward.effect.towerDamageMultiplier ?? 1) * (1 + (reward.effect.towerTypeDamageBonus?.[tower.type] ?? 0));
  const rangeBonus = (reward.effect.towerRangeBonus ?? 0) + (reward.effect.towerTypeRangeBonus?.[tower.type] ?? 0);
  const attackSpeedMultiplier = (reward.effect.towerAttackSpeedMultiplier ?? 1) * (reward.effect.towerTypeAttackSpeedMultiplier?.[tower.type] ?? 1);

  return {
    ...tower,
    damage: Math.max(1, Math.round(tower.damage * damageMultiplier)),
    range: Number((tower.range + rangeBonus).toFixed(2)),
    attackSpeed: Math.max(250, Math.round(tower.attackSpeed * attackSpeedMultiplier)),
  };
};

export const applyRewardToTowers = (towers: Tower[], reward: Reward): Tower[] => towers.map((tower) => applyTowerAdjustment(tower, reward));

export const getRewardRarityClassName = (rarity: RewardRarity): string => {
  switch (rarity) {
    case 'legendary':
      return 'from-fuchsia-500 to-amber-400 text-white border-fuchsia-200';
    case 'epic':
      return 'from-violet-500 to-purple-500 text-white border-violet-200';
    case 'rare':
      return 'from-sky-500 to-blue-500 text-white border-sky-200';
    default:
      return 'from-stone-100 to-white text-amber-900 border-amber-200';
  }
};
