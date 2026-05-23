import { Reward, RewardRarity } from '../types/reward';

export const ALL_REWARDS: Reward[] = [
  // COMMON - tower damage
  {
    id: 'damage_up_1',
    name: '颜料强化 I',
    description: '所有防御塔伤害 +15%',
    rarity: 'common',
    type: 'towerDamage',
    effect: { type: 'towerDamage', value: 0.15 },
  },
  {
    id: 'damage_up_2',
    name: '颜料强化 II',
    description: '所有防御塔伤害 +25%',
    rarity: 'rare',
    type: 'towerDamage',
    effect: { type: 'towerDamage', value: 0.25 },
  },
  {
    id: 'damage_up_3',
    name: '颜料强化 III',
    description: '所有防御塔伤害 +40%',
    rarity: 'epic',
    type: 'towerDamage',
    effect: { type: 'towerDamage', value: 0.40 },
  },
  // COMMON/RARE - tower range
  {
    id: 'range_up_1',
    name: '视野扩展 I',
    description: '所有防御塔攻击范围 +15%',
    rarity: 'common',
    type: 'towerRange',
    effect: { type: 'towerRange', value: 0.15 },
  },
  {
    id: 'range_up_2',
    name: '视野扩展 II',
    description: '所有防御塔攻击范围 +30%',
    rarity: 'rare',
    type: 'towerRange',
    effect: { type: 'towerRange', value: 0.30 },
  },
  // COMMON/RARE - tower attack speed
  {
    id: 'speed_up_1',
    name: '疾笔 I',
    description: '所有防御塔攻击速度 +15%',
    rarity: 'common',
    type: 'towerAttackSpeed',
    effect: { type: 'towerAttackSpeed', value: 0.15 },
  },
  {
    id: 'speed_up_2',
    name: '疾笔 II',
    description: '所有防御塔攻击速度 +30%',
    rarity: 'rare',
    type: 'towerAttackSpeed',
    effect: { type: 'towerAttackSpeed', value: 0.30 },
  },
  // BONUS PAINT
  {
    id: 'bonus_paint_1',
    name: '颜料丰收 I',
    description: '击杀敌人额外获得 +25% 颜料',
    rarity: 'common',
    type: 'bonusPaint',
    effect: { type: 'bonusPaint', value: 0.25 },
  },
  {
    id: 'bonus_paint_2',
    name: '颜料丰收 II',
    description: '击杀敌人额外获得 +50% 颜料',
    rarity: 'rare',
    type: 'bonusPaint',
    effect: { type: 'bonusPaint', value: 0.50 },
  },
  // PROJECTILE SPEED
  {
    id: 'proj_speed_1',
    name: '疾风弹 I',
    description: '子弹飞行速度 +20%',
    rarity: 'common',
    type: 'projectileSpeed',
    effect: { type: 'projectileSpeed', value: 0.20 },
  },
  {
    id: 'proj_speed_2',
    name: '疾风弹 II',
    description: '子弹飞行速度 +40%',
    rarity: 'rare',
    type: 'projectileSpeed',
    effect: { type: 'projectileSpeed', value: 0.40 },
  },
  // CORE HEAL
  {
    id: 'core_heal_1',
    name: '画布修复 I',
    description: '核心生命恢复 15 点',
    rarity: 'common',
    type: 'coreHeal',
    effect: { type: 'coreHeal', value: 15 },
  },
  {
    id: 'core_heal_2',
    name: '画布修复 II',
    description: '核心生命恢复 30 点',
    rarity: 'rare',
    type: 'coreHeal',
    effect: { type: 'coreHeal', value: 30 },
  },
  // SPLIT PROJECTILE
  {
    id: 'split_1',
    name: '分裂弹 I',
    description: '子弹命中时有 25% 概率分裂为 2 颗子弹',
    rarity: 'rare',
    type: 'splitProjectile',
    effect: { type: 'splitProjectile', value: 2 },
  },
  {
    id: 'split_2',
    name: '分裂弹 II',
    description: '子弹必定分裂为 3 颗子弹',
    rarity: 'epic',
    type: 'splitProjectile',
    effect: { type: 'splitProjectile', value: 3 },
  },
  // SPECIAL TOWER UNLOCK (legendary)
  {
    id: 'special_rainbow',
    name: '彩虹笔触',
    description: '解锁特殊塔：彩虹塔（三色融合，伤害 +60%）',
    rarity: 'legendary',
    type: 'specialTower',
    effect: { type: 'specialTower', value: 0.6, target: 'rainbow' },
  },
  // EPIC combos
  {
    id: 'flame_master',
    name: '烈焰大师',
    description: '红色塔伤害额外 +50%，红色颜料获取 +40%',
    rarity: 'epic',
    type: 'towerDamage',
    effect: { type: 'towerDamage', value: 0.50, target: 'red' },
  },
  {
    id: 'frost_lord',
    name: '冰霜领主',
    description: '蓝色塔减速效果翻倍，+25% 核心防御',
    rarity: 'epic',
    type: 'towerAttackSpeed',
    effect: { type: 'towerAttackSpeed', value: 0.40, target: 'blue' },
  },
  {
    id: 'thunder_god',
    name: '雷霆之神',
    description: '黄色塔穿透范围 +50%，子弹速度 +30%',
    rarity: 'epic',
    type: 'projectileSpeed',
    effect: { type: 'projectileSpeed', value: 0.30, target: 'yellow' },
  },
  // Legendary
  {
    id: 'triple_fusion',
    name: '三色融合',
    description: '所有防御塔获得三色属性加成，伤害 +50%',
    rarity: 'legendary',
    type: 'towerDamage',
    effect: { type: 'towerDamage', value: 0.50 },
  },
  {
    id: 'infinite_canvas',
    name: '无限画卷',
    description: '核心生命上限翻倍并完全恢复',
    rarity: 'legendary',
    type: 'coreHeal',
    effect: { type: 'coreHeal', value: 999 },
  },
];

const RARITY_WEIGHTS: Record<RewardRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 5,
};

export function getRarityWeight(rarity: RewardRarity): number {
  return RARITY_WEIGHTS[rarity];
}

export function getWaveBonusRewards(wave: number): number {
  if (wave >= 8) return 4;
  if (wave >= 5) return 3;
  return 3;
}