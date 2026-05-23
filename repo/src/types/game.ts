// 位置
export interface Position {
  x: number;
  y: number;
}

// 画线
export interface PathLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// 颜料精华
export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

// 颜色类型
export type ColorType = 'red' | 'blue' | 'yellow' | 'mixed';

// 防御塔类型
export type TowerType = 'red' | 'blue' | 'yellow';

// 防御塔风格
export type TowerStyle = 'pencil' | 'watercolor' | 'oil';

// 子弹类型
export type ProjectileType = 'normal' | 'slow' | 'pierce';

// 游戏状态
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

// 波次配置
export interface WaveConfig {
  enemyCount: number;
  spawnRate: number;
  enemyHealth: number;
  enemySpeed: number;
}
