import type { EnemyColorType } from '../types/game';

/** 每波敌人数量的基础值 */
export const ENEMIES_PER_WAVE_BASE = 5;

/** 每波敌人增量系数 */
export const ENEMIES_PER_WAVE_MULTIPLIER = 3;

/** 生成间隔基础值（秒） */
export const SPAWN_RATE_BASE = 1.5;

/** 生成间隔每波减少量 */
export const SPAWN_RATE_DECREASE_PER_WAVE = 0.1;

/** 最小生成间隔 */
export const MIN_SPAWN_RATE = 0.8;

/** 敌人基础生命值 */
export const ENEMY_BASE_HEALTH = 40;

/** 每波敌人生命增量 */
export const ENEMY_HEALTH_PER_WAVE = 15;

/** 敌人基础速度（像素/秒） */
export const ENEMY_BASE_SPEED = 35;

/** 每波敌人速度增量上限 */
export const ENEMY_SPEED_CAP_INCREASE = 25;

/** 每波敌人速度增量 */
export const ENEMY_SPEED_PER_WAVE = 3;

/** mixed 敌人出现的起始波次 */
export const MIXED_ENEMY_START_WAVE = 3;

/** 可用的敌人颜色类型（不含 mixed） */
export const BASE_ENEMY_COLOR_TYPES: EnemyColorType[] = ['red', 'blue', 'yellow'];

/** 所有敌人颜色类型 */
export const ALL_ENEMY_COLOR_TYPES: EnemyColorType[] = ['red', 'blue', 'yellow', 'mixed'];

/** 击杀奖励基础值 */
export const KILL_PAINT_BASE = 8;

/** 击杀奖励生命值系数 */
export const KILL_PAINT_HEALTH_DIVISOR = 15;

/** 击杀分数基础值 */
export const KILL_SCORE_BASE = 15;

/** 击杀分数生命值系数 */
export const KILL_SCORE_HEALTH_DIVISOR = 10;