import { Reward, PlayerBuild, BuildStats } from '../types/reward';

const BUILD_TAG_THRESHOLDS = {
  redPower: 0.6,
  blueControl: 0.6,
  yellowSpeed: 0.6,
  economy: 0.5,
  defense: 0.5
};

const BUILD_TAGS: Record<string, { name: string; description: string; icon: string }> = {
  flameMaster: { name: '火焰强化流', description: '专注红色塔伤害', icon: '🔥' },
  iceMaster: { name: '控制冻结流', description: '专注蓝色塔减速', icon: '❄️' },
  lightningMaster: { name: '高速连射流', description: '专注黄色塔攻速', icon: '⚡' },
  economyMaster: { name: '颜料经济流', description: '专注颜料收集', icon: '🎨' },
  defenseMaster: { name: '坚固守护流', description: '专注核心防御', icon: '🛡️' },
  hybridMaster: { name: '三色融合流', description: '均衡发展所有塔', icon: '🌈' },
  legendaryCollector: { name: '传说收藏家', description: '收集了传说奖励', icon: '👑' }
};

export class BuildSystem {
  static calculateBuildStats(rewards: Reward[]): BuildStats {
    const stats: BuildStats = {
      redPower: 0,
      blueControl: 0,
      yellowSpeed: 0,
      economy: 0,
      defense: 0
    };

    rewards.forEach(reward => {
      switch (reward.type) {
        case 'damage':
        case 'range':
        case 'attackSpeed':
          if (reward.appliesTo === 'red' || reward.appliesTo === 'all') {
            stats.redPower += reward.effect;
          }
          if (reward.appliesTo === 'blue' || reward.appliesTo === 'all') {
            stats.blueControl += reward.effect;
          }
          if (reward.appliesTo === 'yellow' || reward.appliesTo === 'all') {
            stats.yellowSpeed += reward.effect;
          }
          break;
        case 'paintGain':
          stats.economy += reward.effect;
          break;
        case 'healthRestore':
          stats.defense += reward.effect / 50;
          break;
        case 'projectileSpeed':
        case 'projectileSplit':
        case 'specialTower':
          stats.redPower += reward.effect * 0.5;
          stats.blueControl += reward.effect * 0.5;
          stats.yellowSpeed += reward.effect * 0.5;
          break;
      }
    });

    return stats;
  }

  static generateBuildTags(rewards: Reward[], stats: BuildStats): string[] {
    const tags: string[] = [];
    const maxPower = Math.max(stats.redPower, stats.blueControl, stats.yellowSpeed);
    const totalPower = stats.redPower + stats.blueControl + stats.yellowSpeed;

    if (stats.redPower >= BUILD_TAG_THRESHOLDS.redPower && stats.redPower === maxPower) {
      tags.push('flameMaster');
    }
    if (stats.blueControl >= BUILD_TAG_THRESHOLDS.blueControl && stats.blueControl === maxPower) {
      tags.push('iceMaster');
    }
    if (stats.yellowSpeed >= BUILD_TAG_THRESHOLDS.yellowSpeed && stats.yellowSpeed === maxPower) {
      tags.push('lightningMaster');
    }
    if (stats.economy >= BUILD_TAG_THRESHOLDS.economy) {
      tags.push('economyMaster');
    }
    if (stats.defense >= BUILD_TAG_THRESHOLDS.defense) {
      tags.push('defenseMaster');
    }
    if (totalPower >= 1.5 && stats.redPower > 0.3 && stats.blueControl > 0.3 && stats.yellowSpeed > 0.3) {
      tags.push('hybridMaster');
    }
    if (rewards.some(r => r.rarity === 'legendary')) {
      tags.push('legendaryCollector');
    }

    return tags;
  }

  static getTagInfo(tag: string) {
    return BUILD_TAGS[tag] || null;
  }

  static initializeBuild(): PlayerBuild {
    return {
      selectedRewards: [],
      buildTags: [],
      buildStats: {
        redPower: 0,
        blueControl: 0,
        yellowSpeed: 0,
        economy: 0,
        defense: 0
      }
    };
  }

  static addReward(build: PlayerBuild, reward: Reward): PlayerBuild {
    const newRewards = [...build.selectedRewards, reward];
    const newStats = this.calculateBuildStats(newRewards);
    const newTags = this.generateBuildTags(newRewards, newStats);

    return {
      selectedRewards: newRewards,
      buildTags: newTags,
      buildStats: newStats
    };
  }

  static getRarityCount(rewards: Reward[]): Record<string, number> {
    return rewards.reduce((acc, reward) => {
      acc[reward.rarity] = (acc[reward.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
