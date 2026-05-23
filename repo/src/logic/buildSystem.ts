import { Reward, RewardType } from '../types/reward';
import { PlayerBuild, BuildStats } from '../types/campaign';

function getDefaultBuildStats(): BuildStats {
  return {
    redPower: 0,
    blueControl: 0,
    yellowSpeed: 0,
    economy: 0,
    defense: 0,
  };
}

function rewardToStatContribution(reward: Reward): Partial<BuildStats> {
  const stats: Partial<BuildStats> = {};

  switch (reward.type) {
    case 'towerDamage':
      if (reward.effect.target === 'red') {
        stats.redPower = 2;
      } else if (reward.effect.target === 'blue') {
        stats.blueControl = 2;
      } else if (reward.effect.target === 'yellow') {
        stats.yellowSpeed = 2;
      } else {
        stats.redPower = 1;
        stats.blueControl = 1;
        stats.yellowSpeed = 1;
      }
      break;
    case 'towerRange':
      stats.blueControl = 1;
      stats.yellowSpeed = 0.5;
      break;
    case 'towerAttackSpeed':
      stats.yellowSpeed = 1.5;
      stats.redPower = 0.5;
      break;
    case 'bonusPaint':
      stats.economy = 2;
      break;
    case 'projectileSpeed':
      stats.yellowSpeed = 1;
      break;
    case 'coreHeal':
      stats.defense = 1.5;
      break;
    case 'splitProjectile':
      stats.redPower = 1.5;
      stats.yellowSpeed = 1;
      break;
    case 'specialTower':
      stats.redPower = 1;
      stats.blueControl = 1;
      stats.yellowSpeed = 1;
      break;
  }

  return stats;
}

function calculateBuildTags(stats: BuildStats, selectedRewards: Reward[]): string[] {
  const tags: string[] = [];
  const typeCounts: Record<RewardType, number> = {
    towerDamage: 0, towerRange: 0, towerAttackSpeed: 0,
    bonusPaint: 0, projectileSpeed: 0, coreHeal: 0,
    splitProjectile: 0, specialTower: 0,
  };

  selectedRewards.forEach(r => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  });

  if (stats.redPower >= 4) tags.push('火焰强化流');
  else if (stats.redPower >= 2) tags.push('攻击强化流');

  if (stats.blueControl >= 3) tags.push('控制冻结流');

  if (stats.yellowSpeed >= 4) tags.push('高速连射流');
  else if (stats.yellowSpeed >= 2 && stats.redPower >= 2) tags.push('三色融合流');

  if (stats.economy >= 3) tags.push('颜料经济流');

  if (stats.defense >= 3) tags.push('铁壁防御流');

  if (typeCounts.splitProjectile >= 1 && typeCounts.projectileSpeed >= 1) {
    tags.push('弹幕风暴流');
  }

  if (typeCounts.specialTower >= 1) tags.push('彩虹绘师');

  const unityCount = Math.min(stats.redPower, stats.blueControl, stats.yellowSpeed);
  if (unityCount >= 2 && !tags.includes('三色融合流')) {
    tags.push('三色融合流');
  }

  if (tags.length === 0) {
    tags.push('自由绘者');
  }

  return tags;
}

export function updateBuildAfterReward(
  currentBuild: PlayerBuild,
  reward: Reward
): PlayerBuild {
  const newRewards = [...currentBuild.selectedRewards, reward];
  const contributions = rewardToStatContribution(reward);

  const newStats: BuildStats = {
    redPower: (currentBuild.buildStats.redPower || 0) + (contributions.redPower || 0),
    blueControl: (currentBuild.buildStats.blueControl || 0) + (contributions.blueControl || 0),
    yellowSpeed: (currentBuild.buildStats.yellowSpeed || 0) + (contributions.yellowSpeed || 0),
    economy: (currentBuild.buildStats.economy || 0) + (contributions.economy || 0),
    defense: (currentBuild.buildStats.defense || 0) + (contributions.defense || 0),
  };

  const tags = calculateBuildTags(newStats, newRewards);

  return {
    selectedRewards: newRewards,
    buildTags: tags,
    buildStats: newStats,
  };
}

export function createInitialBuild(): PlayerBuild {
  return {
    selectedRewards: [],
    buildTags: [],
    buildStats: getDefaultBuildStats(),
  };
}

export function getRarityLabelMap(rarity: string): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    default: return rarity;
  }
}