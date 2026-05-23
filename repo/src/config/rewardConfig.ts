import { Reward, Rarity, RewardType } from '../types/reward';

export const REWARD_POOL: Reward[] = [
  {
    id: 'damage-red',
    name: '烈焰增幅',
    description: '红色塔伤害 +20%',
    rarity: 'common',
    type: 'damage',
    effect: 0.2,
    appliesTo: 'red'
  },
  {
    id: 'damage-blue',
    name: '寒冰强化',
    description: '蓝色塔伤害 +20%',
    rarity: 'common',
    type: 'damage',
    effect: 0.2,
    appliesTo: 'blue'
  },
  {
    id: 'damage-yellow',
    name: '雷电增强',
    description: '黄色塔伤害 +20%',
    rarity: 'common',
    type: 'damage',
    effect: 0.2,
    appliesTo: 'yellow'
  },
  {
    id: 'damage-all',
    name: '画技精进',
    description: '所有塔伤害 +15%',
    rarity: 'rare',
    type: 'damage',
    effect: 0.15,
    appliesTo: 'all'
  },
  {
    id: 'range-red',
    name: '烈焰领域',
    description: '红色塔范围 +25%',
    rarity: 'common',
    type: 'range',
    effect: 0.25,
    appliesTo: 'red'
  },
  {
    id: 'range-blue',
    name: '寒冰领域',
    description: '蓝色塔范围 +25%',
    rarity: 'common',
    type: 'range',
    effect: 0.25,
    appliesTo: 'blue'
  },
  {
    id: 'range-yellow',
    name: '雷电领域',
    description: '黄色塔范围 +25%',
    rarity: 'common',
    type: 'range',
    effect: 0.25,
    appliesTo: 'yellow'
  },
  {
    id: 'range-all',
    name: '远视之眼',
    description: '所有塔范围 +20%',
    rarity: 'rare',
    type: 'range',
    effect: 0.2,
    appliesTo: 'all'
  },
  {
    id: 'speed-red',
    name: '烈焰急速',
    description: '红色塔攻速 +30%',
    rarity: 'common',
    type: 'attackSpeed',
    effect: 0.3,
    appliesTo: 'red'
  },
  {
    id: 'speed-blue',
    name: '寒冰急速',
    description: '蓝色塔攻速 +30%',
    rarity: 'common',
    type: 'attackSpeed',
    effect: 0.3,
    appliesTo: 'blue'
  },
  {
    id: 'speed-yellow',
    name: '雷电急速',
    description: '黄色塔攻速 +30%',
    rarity: 'common',
    type: 'attackSpeed',
    effect: 0.3,
    appliesTo: 'yellow'
  },
  {
    id: 'speed-all',
    name: '疾风之笔',
    description: '所有塔攻速 +25%',
    rarity: 'rare',
    type: 'attackSpeed',
    effect: 0.25,
    appliesTo: 'all'
  },
  {
    id: 'paint-gain',
    name: '颜料丰收',
    description: '击杀敌人额外获得 +50% 颜料',
    rarity: 'common',
    type: 'paintGain',
    effect: 0.5,
    appliesTo: 'all'
  },
  {
    id: 'paint-gain-epic',
    name: '颜料风暴',
    description: '击杀敌人额外获得 +100% 颜料',
    rarity: 'epic',
    type: 'paintGain',
    effect: 1.0,
    appliesTo: 'all'
  },
  {
    id: 'proj-speed',
    name: '飞墨流光',
    description: '子弹速度 +40%',
    rarity: 'common',
    type: 'projectileSpeed',
    effect: 0.4,
    appliesTo: 'all'
  },
  {
    id: 'health-restore',
    name: '画布修复',
    description: '核心生命恢复 20 点',
    rarity: 'rare',
    type: 'healthRestore',
    effect: 20,
    appliesTo: 'all'
  },
  {
    id: 'health-restore-epic',
    name: '重生之墨',
    description: '核心生命恢复 50 点',
    rarity: 'epic',
    type: 'healthRestore',
    effect: 50,
    appliesTo: 'all'
  },
  {
    id: 'proj-split',
    name: '墨影分身',
    description: '子弹命中后分裂出额外子弹',
    rarity: 'legendary',
    type: 'projectileSplit',
    effect: 1,
    appliesTo: 'all'
  },
  {
    id: 'damage-red-epic',
    name: '炎狱熔炉',
    description: '红色塔伤害 +50%',
    rarity: 'epic',
    type: 'damage',
    effect: 0.5,
    appliesTo: 'red'
  },
  {
    id: 'damage-blue-epic',
    name: '冰封王座',
    description: '蓝色塔伤害 +50%',
    rarity: 'epic',
    type: 'damage',
    effect: 0.5,
    appliesTo: 'blue'
  },
  {
    id: 'damage-yellow-epic',
    name: '雷神之怒',
    description: '黄色塔伤害 +50%',
    rarity: 'epic',
    type: 'damage',
    effect: 0.5,
    appliesTo: 'yellow'
  },
  {
    id: 'damage-all-legendary',
    name: '画圣降临',
    description: '所有塔伤害 +80%',
    rarity: 'legendary',
    type: 'damage',
    effect: 0.8,
    appliesTo: 'all'
  }
];

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
};

export const RARITY_BG: Record<Rarity, string> = {
  common: 'bg-gray-100',
  rare: 'bg-blue-100',
  epic: 'bg-purple-100',
  legendary: 'bg-yellow-100'
};

export const RARITY_BORDER: Record<Rarity, string> = {
  common: 'border-gray-300',
  rare: 'border-blue-300',
  epic: 'border-purple-300',
  legendary: 'border-yellow-400'
};
