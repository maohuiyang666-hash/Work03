import { CampaignEventEffect } from '../types/campaign';

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  effect: CampaignEventEffect;
  minWave: number;
  weight: number;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'paint_storm',
    name: '颜料风暴',
    description: '颜料能量激荡！所有子弹速度 +50%',
    duration: 3,
    effect: { type: 'projectileSpeed', value: 0.5 },
    minWave: 1,
    weight: 20,
  },
  {
    id: 'dark_erosion',
    name: '暗色侵蚀',
    description: '黑暗力量侵蚀画布，所有敌人生命值 +30%',
    duration: 3,
    effect: { type: 'enemyHealth', value: 0.3 },
    minWave: 2,
    weight: 18,
  },
  {
    id: 'map_crack',
    name: '地图裂缝',
    description: '画布出现裂缝，部分格子无法放置防御塔',
    duration: 2,
    effect: { type: 'blockBuilding', value: 0.3 },
    minWave: 2,
    weight: 14,
  },
  {
    id: 'inspiration_burst',
    name: '灵感爆发',
    description: '创作灵感涌动！随机 1 座防御塔获得临时强化（伤害 +80%）',
    duration: 3,
    effect: { type: 'towerBuff', value: 0.8 },
    minWave: 1,
    weight: 16,
  },
  {
    id: 'paint_drain',
    name: '颜料枯竭',
    description: '颜料资源变得稀少，击杀敌人时某类颜料奖励减少 40%',
    duration: 2,
    effect: { type: 'paintReduction', value: 0.4 },
    minWave: 3,
    weight: 12,
  },
];

export function getEventTriggerWave(wave: number): boolean {
  if (wave <= 1) return false;
  return wave % 3 === 0;
}