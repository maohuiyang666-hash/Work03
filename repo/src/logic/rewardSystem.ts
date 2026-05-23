import { Reward, RewardRarity, ActiveRewardModifiers } from '../types/reward';
import { ALL_REWARDS, getWaveBonusRewards } from '../config/rewardConfig';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

let _random: () => number = Math.random;

export function setRewardRng(fn: () => number): void {
  _random = fn;
}

export function getRewardRng(): () => number {
  return _random;
}

function getWeightedRarity(): RewardRarity {
  const roll = _random() * 100;
  if (roll < 5) return 'legendary';
  if (roll < 15) return 'epic';
  if (roll < 40) return 'rare';
  return 'common';
}

export function generateRewardChoices(wave: number, count: number = 3): Reward[] {
  const available = [...ALL_REWARDS];
  const choices: Reward[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const weighted = available.filter(r => !usedIds.has(r.id));
    if (weighted.length === 0) break;

    const rarity = i === 0 && wave >= 5 ? (Math.random() < 0.3 ? 'epic' : getWeightedRarity()) : getWeightedRarity();

    const ofRarity = weighted.filter(r => r.rarity === rarity);
    const pool = ofRarity.length > 0 ? ofRarity : weighted;

    const idx = Math.floor(_random() * pool.length);
    const reward = pool[idx];
    choices.push(reward);
    usedIds.add(reward.id);
  }

  return choices;
}

export function applyRewardEffect(reward: Reward, modifiers: ActiveRewardModifiers): ActiveRewardModifiers {
  const m = { ...modifiers };

  switch (reward.effect.type) {
    case 'towerDamage':
      m.towerDamageMult += reward.effect.value;
      break;
    case 'towerRange':
      m.towerRangeMult += reward.effect.value;
      break;
    case 'towerAttackSpeed':
      m.towerAttackSpeedMult += reward.effect.value;
      break;
    case 'bonusPaint':
      m.bonusPaintMult += reward.effect.value;
      break;
    case 'projectileSpeed':
      m.projectileSpeedMult += reward.effect.value;
      break;
    case 'coreHeal':
      break;
    case 'splitProjectile':
      m.splitProjectile = true;
      m.splitCount = Math.max(m.splitCount, reward.effect.value);
      break;
    case 'specialTower':
      m.unlockSpecialTower = reward.effect.target ?? null;
      break;
  }

  return m;
}

export function getDefaultModifiers(): ActiveRewardModifiers {
  return {
    towerDamageMult: 0,
    towerRangeMult: 0,
    towerAttackSpeedMult: 0,
    bonusPaintMult: 0,
    projectileSpeedMult: 0,
    splitProjectile: false,
    splitCount: 0,
    unlockSpecialTower: null,
  };
}

export function getWaveChoicesCount(_wave: number): number {
  return getWaveBonusRewards(_wave);
}