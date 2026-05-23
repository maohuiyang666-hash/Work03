import { CampaignEvent, EventType, EventEffect } from '../types/campaign';

export const EVENT_TEMPLATES: Record<EventType, Omit<CampaignEvent, 'id' | 'startTime' | 'active'>> = {
  paintStorm: {
    name: '颜料风暴',
    description: '子弹速度大幅提升！',
    type: 'paintStorm',
    duration: 120,
    effect: { projectileSpeedBonus: 0.8 }
  },
  darkErosion: {
    name: '暗色侵蚀',
    description: '敌人变得更强壮了...',
    type: 'darkErosion',
    duration: 90,
    effect: { enemyHealthMultiplier: 1.5 }
  },
  mapCrack: {
    name: '地图裂缝',
    description: '部分区域无法放置防御塔',
    type: 'mapCrack',
    duration: 60,
    effect: { placeTowerRestriction: true }
  },
  inspirationBurst: {
    name: '灵感爆发',
    description: '随机防御塔获得强化！',
    type: 'inspirationBurst',
    duration: 45,
    effect: { randomTowerBonus: true }
  },
  paintDrought: {
    name: '颜料枯竭',
    description: '击杀获得的颜料减少',
    type: 'paintDrought',
    duration: 100,
    effect: { paintGainReduction: 0.5 }
  }
};

export const EVENT_TRIGGER_INTERVAL = 3;
export const EVENT_COLORS: Record<EventType, string> = {
  paintStorm: 'from-cyan-500 to-blue-500',
  darkErosion: 'from-gray-700 to-gray-900',
  mapCrack: 'from-orange-500 to-red-500',
  inspirationBurst: 'from-yellow-400 to-pink-400',
  paintDrought: 'from-amber-600 to-amber-800'
};

export const EVENT_ICONS: Record<EventType, string> = {
  paintStorm: '🌪️',
  darkErosion: '🌑',
  mapCrack: '🌋',
  inspirationBurst: '✨',
  paintDrought: '🏜️'
};
