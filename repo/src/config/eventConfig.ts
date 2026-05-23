import type { CampaignEventDefinition } from '../types/campaign';

export const EVENT_POOL: CampaignEventDefinition[] = [
  {
    id: 'paintStorm',
    name: '颜料风暴',
    description: '空气中的颜料加速涌动，所有子弹速度提升。',
    durationWaves: 2,
    effect: {
      projectileSpeedMultiplier: 1.35,
    },
  },
  {
    id: 'darkErosion',
    name: '暗色侵蚀',
    description: '敌人的色块更加厚重，生命值显著提高。',
    durationWaves: 2,
    effect: {
      enemyHealthMultiplier: 1.2,
    },
  },
  {
    id: 'mapRift',
    name: '地图裂缝',
    description: '部分画布格子崩裂，本阶段无法在裂缝区域放塔。',
    durationWaves: 1,
    effect: {},
  },
  {
    id: 'inspirationBurst',
    name: '灵感爆发',
    description: '随机几座防御塔获得临时强化。',
    durationWaves: 1,
    effect: {
      inspirationDamageMultiplier: 1.3,
      inspirationRangeBonus: 0.35,
    },
  },
  {
    id: 'paintDrought',
    name: '颜料枯竭',
    description: '某一类颜料产出减少，资源运营更加紧张。',
    durationWaves: 2,
    effect: {
      reducedPaintMultiplier: 0.6,
    },
  },
];
