import type { Position, PathLine, PaintEssence, WaveConfig } from '../types/game';

// 网格配置
export const GRID_SIZE = 10;
export const CELL_SIZE = 50;

// 路径点
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

// 核心位置
export const CORE_POSITION = { x: 9, y: 4 };

// 生成路径线
export const generatePathLines = (): PathLine[] => {
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

export const PATH_LINES = generatePathLines();

// 塔建造费用
export const TOWER_COSTS: Record<string, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

// 颜色值
export const COLORS = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f39c12',
  enemyRed: '#c0392b',
  enemyBlue: '#2980b9',
  enemyYellow: '#d68910',
};

// 波次配置生成器
export const getWaveConfig = (wave: number): WaveConfig => ({
  enemyCount: 5 + wave * 3,
  spawnRate: 1.5 - Math.min(wave * 0.1, 0.8),
  enemyHealth: 40 + wave * 15,
  enemySpeed: 35 + Math.min(wave * 3, 25),
});

// 游戏常量
export const MAX_WAVES = 10;
export const CORE_DAMAGE = 10;
export const WAVE_BONUS: PaintEssence = { red: 10, blue: 10, yellow: 10 };
export const MAX_TOWER_LEVEL = 5;
export const UPGRADE_COST_MULTIPLIER = 25;
