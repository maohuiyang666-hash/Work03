import type { GameStatus, PaintEssence } from './game';
import type { Enemy, Tower, Projectile, Particle } from './entities';
import type { TowerType, TowerStyle } from './game';

// 游戏状态
export interface GameState {
  status: GameStatus;
  wave: number;
  coreHealth: number;
  paint: PaintEssence;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  particles: Particle[];
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  score: number;
  enemiesKilled: number;
  waveInProgress: boolean;
  collectedTowers: Set<string>;
}

// 游戏状态初始值
export const INITIAL_GAME_STATE: Omit<GameState, 'enemies' | 'towers' | 'projectiles' | 'particles' | 'collectedTowers'> = {
  status: 'menu',
  wave: 1,
  coreHealth: 100,
  paint: { red: 50, blue: 50, yellow: 50 },
  selectedTowerType: null,
  selectedStyle: 'pencil',
  score: 0,
  enemiesKilled: 0,
  waveInProgress: false,
};

// ID 生成器引用
export interface IdRefs {
  enemyId: number;
  towerId: number;
  projectileId: number;
  particleId: number;
  enemiesSpawned: number;
  spawnTimer: number;
}

// 游戏循环 refs
export interface GameLoopRefs {
  lastUpdate: number;
  gameLoopId: number | null;
}

// 收集物品记录
export interface CollectionRecord {
  [key: string]: boolean;
}
