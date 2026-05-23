import type { ColorType } from '../types/game';
import { COLORS, getWaveConfig } from './gameConfig';

// 敌人颜色映射
export const ENEMY_COLORS: Record<ColorType, string> = {
  red: COLORS.enemyRed,
  blue: COLORS.enemyBlue,
  yellow: COLORS.enemyYellow,
  mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(Math.random() * 3)],
};

// 减速效果
export const SLOW_EFFECT_MULTIPLIER = 0.7;
export const MIN_SPEED_AFTER_SLOW = 15;

// 击杀奖励
export const getKillPaintReward = (maxHealth: number): number => 8 + Math.floor(maxHealth / 15);
export const getKillScoreReward = (maxHealth: number): number => 15 + Math.floor(maxHealth / 10);

// 穿透攻击范围
export const PIERCE_HIT_RANGE = 60;
export const NORMAL_HIT_RANGE = 25;

// 生成敌人生成配置
export const getEnemySpawnConfig = (wave: number, colorTypes: ColorType[]) => {
  const config = getWaveConfig(wave);
  const type = colorTypes[Math.floor(Math.random() * colorTypes.length)];
  
  return {
    health: config.enemyHealth,
    speed: config.enemySpeed,
    color: ENEMY_COLORS[type],
    colorType: type,
  };
};
