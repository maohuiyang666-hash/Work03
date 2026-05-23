import { Reward } from '../types/reward';

export const REWARD_POOL: Reward[] = [
  {
    id: 'dmg_up_1',
    name: '强力颜料',
    description: '所有防御塔伤害提升 20%',
    rarity: 'common',
    type: 'damage',
    effect: { damageMultiplier: 1.2 }
  },
  {
    id: 'range_up_1',
    name: '鹰眼画笔',
    description: '所有防御塔攻击范围提升 15%',
    rarity: 'common',
    type: 'range',
    effect: { rangeMultiplier: 1.15 }
  },
  {
    id: 'speed_up_1',
    name: '速写技巧',
    description: '所有防御塔攻击速度提升 15%',
    rarity: 'rare',
    type: 'attackSpeed',
    effect: { attackSpeedMultiplier: 0.85 } // lower is faster
  },
  {
    id: 'paint_drop_1',
    name: '颜料回收',
    description: '击杀敌人额外获得 20% 颜料',
    rarity: 'rare',
    type: 'economy',
    effect: { paintDropMultiplier: 1.2 }
  },
  {
    id: 'proj_speed_1',
    name: '流线型笔触',
    description: '子弹飞行速度提升 30%',
    rarity: 'common',
    type: 'projectileSpeed',
    effect: { projSpeedMultiplier: 1.3 }
  },
  {
    id: 'core_heal_1',
    name: '画布修复',
    description: '核心立即恢复 20 点生命值，且生命上限提升 20',
    rarity: 'epic',
    type: 'defense',
    effect: { heal: 20, maxHealthUp: 20 }
  },
  {
    id: 'proj_split_1',
    name: '色彩溅射',
    description: '子弹有 30% 几率分裂成额外的子弹或造成额外伤害',
    rarity: 'legendary',
    type: 'special',
    effect: { splitChance: 0.3 }
  },
  {
    id: 'red_power_up',
    name: '烈焰专精',
    description: '红色防御塔伤害额外提升 40%',
    rarity: 'rare',
    type: 'redPower',
    effect: { redDamageMultiplier: 1.4 }
  },
  {
    id: 'blue_control_up',
    name: '深蓝寒意',
    description: '蓝色防御塔减速效果提升 20%',
    rarity: 'rare',
    type: 'blueControl',
    effect: { blueSlowMultiplier: 1.2 } // enemy speed multiplier goes down further
  },
  {
    id: 'yellow_speed_up',
    name: '闪电连锁',
    description: '黄色防御塔穿透数量/范围提升',
    rarity: 'epic',
    type: 'yellowSpeed',
    effect: { yellowPierceMultiplier: 1.5 }
  },
];
