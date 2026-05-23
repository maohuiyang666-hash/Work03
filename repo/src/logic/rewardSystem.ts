import { Reward, Rarity } from '../types/reward';
import { REWARD_POOL, RARITY_WEIGHTS } from '../config/rewardConfig';
import { Tower, PaintEssence } from '../App';

export class RewardSystem {
  static selectRandomRewards(count: number = 3): Reward[] {
    const rewards: Reward[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      const rarity = this.selectRandomRarity();
      const availableRewards = REWARD_POOL.filter(
        r => r.rarity === rarity && !usedIds.has(r.id)
      );

      if (availableRewards.length === 0) {
        const fallbackRewards = REWARD_POOL.filter(r => !usedIds.has(r.id));
        if (fallbackRewards.length === 0) break;
        const randomReward = fallbackRewards[Math.floor(Math.random() * fallbackRewards.length)];
        rewards.push(randomReward);
        usedIds.add(randomReward.id);
      } else {
        const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)];
        rewards.push(randomReward);
        usedIds.add(randomReward.id);
      }
    }

    return rewards;
  }

  private static selectRandomRarity(): Rarity {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      random -= weight;
      if (random <= 0) {
        return rarity as Rarity;
      }
    }
    return 'common';
  }

  static applyRewardToTower(tower: Tower, rewards: Reward[]): Tower {
    let { damage, range, attackSpeed } = tower;

    rewards.forEach(reward => {
      if (reward.appliesTo && reward.appliesTo !== 'all' && reward.appliesTo !== tower.type) {
        return;
      }

      switch (reward.type) {
        case 'damage':
          damage = Math.floor(damage * (1 + reward.effect));
          break;
        case 'range':
          range = range * (1 + reward.effect);
          break;
        case 'attackSpeed':
          attackSpeed = attackSpeed * (1 - reward.effect);
          break;
      }
    });

    return { ...tower, damage, range, attackSpeed };
  }

  static getPaintBonus(rewards: Reward[]): number {
    return rewards
      .filter(r => r.type === 'paintGain')
      .reduce((total, r) => total + r.effect, 0);
  }

  static getProjectileSpeedBonus(rewards: Reward[]): number {
    return rewards
      .filter(r => r.type === 'projectileSpeed')
      .reduce((total, r) => total + r.effect, 0);
  }

  static getHealthRestore(rewards: Reward[]): number {
    return rewards
      .filter(r => r.type === 'healthRestore')
      .reduce((total, r) => total + r.effect, 0);
  }

  static hasProjectileSplit(rewards: Reward[]): boolean {
    return rewards.some(r => r.type === 'projectileSplit');
  }
}
