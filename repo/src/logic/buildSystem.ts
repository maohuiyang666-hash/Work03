import { PlayerBuild } from '../types/campaign';
import { Reward } from '../types/reward';

export function calculateBuildStats(rewards: Reward[]): PlayerBuild['buildStats'] {
  const stats = {
    redPower: 0,
    blueControl: 0,
    yellowSpeed: 0,
    economy: 0,
    defense: 0,
  };

  rewards.forEach(r => {
    if (r.type === 'redPower' || r.type === 'damage') stats.redPower += 1;
    if (r.type === 'blueControl' || r.type === 'attackSpeed') stats.blueControl += 1;
    if (r.type === 'yellowSpeed' || r.type === 'projectileSpeed' || r.type === 'special') stats.yellowSpeed += 1;
    if (r.type === 'economy') stats.economy += 1;
    if (r.type === 'defense') stats.defense += 1;
  });

  return stats;
}

export function generateBuildTags(stats: PlayerBuild['buildStats']): string[] {
  const tags: string[] = [];
  if (stats.redPower >= 2) tags.push('火焰强化流');
  if (stats.blueControl >= 2) tags.push('控制冻结流');
  if (stats.yellowSpeed >= 2) tags.push('高速连射流');
  if (stats.economy >= 1) tags.push('颜料经济流');
  if (stats.redPower > 0 && stats.blueControl > 0 && stats.yellowSpeed > 0) tags.push('三色融合流');
  
  if (tags.length === 0) tags.push('初级画师');
  return tags;
}

export function updateBuild(currentBuild: PlayerBuild, newReward: Reward): PlayerBuild {
  const selectedRewards = [...currentBuild.selectedRewards, newReward];
  const buildStats = calculateBuildStats(selectedRewards);
  const buildTags = generateBuildTags(buildStats);
  
  return {
    selectedRewards,
    buildStats,
    buildTags
  };
}
