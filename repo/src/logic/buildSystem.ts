import type { BuildModifiers, BuildStats, PlayerBuild, Reward } from '../types/reward';

const createEmptyBuildStats = (): BuildStats => ({
  redPower: 0,
  blueControl: 0,
  yellowSpeed: 0,
  economy: 0,
  defense: 0,
  fusion: 0,
});

const createEmptyModifiers = (): BuildModifiers => ({
  damageMultiplier: 1,
  rangeBonus: 0,
  attackSpeedMultiplier: 1,
  projectileSpeedMultiplier: 1,
  bonusPaintOnKill: 0,
  splitShots: 0,
  chainHits: 0,
  towerTypeDamageBonus: { red: 0, blue: 0, yellow: 0 },
  towerTypeRangeBonus: { red: 0, blue: 0, yellow: 0 },
  towerTypeAttackSpeedMultiplier: { red: 1, blue: 1, yellow: 1 },
});

export const createInitialBuild = (): PlayerBuild => ({
  selectedRewards: [],
  buildTags: [],
  buildStats: createEmptyBuildStats(),
  modifiers: createEmptyModifiers(),
  unlockedSpecials: [],
});

export const deriveBuildTags = (buildStats: BuildStats, selectedRewards: Reward[]): string[] => {
  const tagSet = new Set<string>();

  selectedRewards.forEach((reward) => {
    reward.tags.forEach((tag) => tagSet.add(tag));
  });

  if (buildStats.redPower >= 3) tagSet.add('火焰强化流');
  if (buildStats.blueControl >= 3) tagSet.add('控制冻结流');
  if (buildStats.yellowSpeed >= 3) tagSet.add('高速连射流');
  if (buildStats.economy >= 3) tagSet.add('颜料经济流');
  if (buildStats.defense >= 3) tagSet.add('核心防御流');
  if (buildStats.redPower >= 2 && buildStats.blueControl >= 2 && buildStats.yellowSpeed >= 2) {
    tagSet.add('三色融合流');
  }

  return Array.from(tagSet);
};

export const applyRewardToBuild = (build: PlayerBuild, reward: Reward): PlayerBuild => {
  const nextStats: BuildStats = {
    redPower: build.buildStats.redPower + (reward.buildStatDeltas.redPower ?? 0),
    blueControl: build.buildStats.blueControl + (reward.buildStatDeltas.blueControl ?? 0),
    yellowSpeed: build.buildStats.yellowSpeed + (reward.buildStatDeltas.yellowSpeed ?? 0),
    economy: build.buildStats.economy + (reward.buildStatDeltas.economy ?? 0),
    defense: build.buildStats.defense + (reward.buildStatDeltas.defense ?? 0),
    fusion: build.buildStats.fusion + (reward.buildStatDeltas.fusion ?? 0),
  };

  const modifiers: BuildModifiers = {
    ...build.modifiers,
    damageMultiplier: build.modifiers.damageMultiplier * (reward.effect.towerDamageMultiplier ?? 1),
    rangeBonus: build.modifiers.rangeBonus + (reward.effect.towerRangeBonus ?? 0),
    attackSpeedMultiplier: build.modifiers.attackSpeedMultiplier * (reward.effect.towerAttackSpeedMultiplier ?? 1),
    projectileSpeedMultiplier: build.modifiers.projectileSpeedMultiplier * (reward.effect.projectileSpeedMultiplier ?? 1),
    bonusPaintOnKill: build.modifiers.bonusPaintOnKill + (reward.effect.bonusPaintOnKill ?? 0),
    splitShots: build.modifiers.splitShots + (reward.effect.splitShots ?? 0),
    chainHits: build.modifiers.chainHits + (reward.effect.chainHits ?? 0),
    towerTypeDamageBonus: {
      red: build.modifiers.towerTypeDamageBonus.red + (reward.effect.towerTypeDamageBonus?.red ?? 0),
      blue: build.modifiers.towerTypeDamageBonus.blue + (reward.effect.towerTypeDamageBonus?.blue ?? 0),
      yellow: build.modifiers.towerTypeDamageBonus.yellow + (reward.effect.towerTypeDamageBonus?.yellow ?? 0),
    },
    towerTypeRangeBonus: {
      red: build.modifiers.towerTypeRangeBonus.red + (reward.effect.towerTypeRangeBonus?.red ?? 0),
      blue: build.modifiers.towerTypeRangeBonus.blue + (reward.effect.towerTypeRangeBonus?.blue ?? 0),
      yellow: build.modifiers.towerTypeRangeBonus.yellow + (reward.effect.towerTypeRangeBonus?.yellow ?? 0),
    },
    towerTypeAttackSpeedMultiplier: {
      red: build.modifiers.towerTypeAttackSpeedMultiplier.red * (reward.effect.towerTypeAttackSpeedMultiplier?.red ?? 1),
      blue: build.modifiers.towerTypeAttackSpeedMultiplier.blue * (reward.effect.towerTypeAttackSpeedMultiplier?.blue ?? 1),
      yellow: build.modifiers.towerTypeAttackSpeedMultiplier.yellow * (reward.effect.towerTypeAttackSpeedMultiplier?.yellow ?? 1),
    },
  };

  const unlockedSpecials = reward.effect.unlockSpecial
    ? Array.from(new Set([...build.unlockedSpecials, reward.effect.unlockSpecial]))
    : build.unlockedSpecials;

  const selectedRewards = [...build.selectedRewards, reward];

  return {
    selectedRewards,
    buildStats: nextStats,
    modifiers,
    unlockedSpecials,
    buildTags: deriveBuildTags(nextStats, selectedRewards),
  };
};

export const getBuildStrengthScore = (build: PlayerBuild): number => {
  const rewardPower = build.selectedRewards.reduce((sum, reward) => {
    const rarityWeight = reward.rarity === 'legendary' ? 4 : reward.rarity === 'epic' ? 3 : reward.rarity === 'rare' ? 2 : 1;
    return sum + rarityWeight;
  }, 0);

  const statsPower = Object.values(build.buildStats).reduce((sum, value) => sum + value, 0);
  const modifierPower =
    (build.modifiers.damageMultiplier - 1) * 10 +
    build.modifiers.rangeBonus * 5 +
    (1 - build.modifiers.attackSpeedMultiplier) * 12 +
    (build.modifiers.projectileSpeedMultiplier - 1) * 6 +
    build.modifiers.bonusPaintOnKill * 0.8 +
    build.modifiers.splitShots * 6 +
    build.modifiers.chainHits * 7;

  return rewardPower + statsPower + modifierPower;
};
