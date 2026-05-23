import type { Position } from '../types/game';

/** 网格尺寸（格子数） */
export const GRID_SIZE = 10;

/** 每格像素大小 */
export const CELL_SIZE = 50;

/** 怪物行走路径（格子坐标） */
export const PATH: Position[] = [
  { x: 0, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 2 },
  { x: 5, y: 2 },
  { x: 5, y: 6 },
  { x: 7, y: 6 },
  { x: 7, y: 4 },
  { x: 9, y: 4 },
];

/** 路径线段 */
export interface PathLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 根据 PATH 生成线段坐标 */
const generatePathLines = (): PathLine[] => {
  const lines: PathLine[] = [];
  for (let i = 0; i < PATH.length - 1; i++) {
    lines.push({
      x1: PATH[i].x * CELL_SIZE + CELL_SIZE / 2,
      y1: PATH[i].y * CELL_SIZE + CELL_SIZE / 2,
      x2: PATH[i + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y2: PATH[i + 1].y * CELL_SIZE + CELL_SIZE / 2,
    });
  }
  return lines;
};

export const PATH_LINES: PathLine[] = generatePathLines();

/** 核心（终点）位置 */
export const CORE_POSITION: Position = { x: 9, y: 4 };

/** 初始生命值 */
export const INITIAL_CORE_HEALTH = 100;

/** 初始颜料精华 */
export const INITIAL_PAINT = { red: 50, blue: 50, yellow: 50 };

/** 敌人到达终点造成的伤害 */
export const CORE_DAMAGE_PER_ENEMY = 10;

/** 最大波次 */
export const MAX_WAVES = 10;

/** 波次加成奖励 */
export const WAVE_BONUS = { red: 10, blue: 10, yellow: 10 };