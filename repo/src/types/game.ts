/** 坐标位置 */
export interface Position {
  x: number;
  y: number;
}

/** 颜料精华资源 */
export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

/** 游戏状态 */
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

/** 塔的颜色类型 */
export type TowerType = 'red' | 'blue' | 'yellow';

/** 敌人的颜色类型 */
export type EnemyColorType = 'red' | 'blue' | 'yellow' | 'mixed';

/** 塔的笔触风格 */
export type StyleType = 'pencil' | 'watercolor' | 'oil';

/** 弹丸类型 */
export type ProjectileType = 'normal' | 'slow' | 'pierce';

/** 颜色值映射 */
export const TOWER_COLOR_MAP: Record<TowerType, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f39c12',
};

export const ENEMY_COLOR_MAP: Record<EnemyColorType, string | string[]> = {
  red: '#c0392b',
  blue: '#2980b9',
  yellow: '#d68910',
  mixed: ['#8e44ad', '#16a085', '#d35400'],
};