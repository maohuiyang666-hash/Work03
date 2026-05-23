import type { PaintEssence, GameState, StyleType, TowerType } from './game';
import type { Enemy, Tower, Projectile, Particle } from './entities';

/** 完整游戏运行时状态（用于传递给逻辑层纯函数） */
export interface GameRuntimeState {
  gameState: GameState;
  wave: number;
  coreHealth: number;
  paint: PaintEssence;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  particles: Particle[];
  selectedTowerType: TowerType | null;
  selectedStyle: StyleType;
  score: number;
  enemiesKilled: number;
  waveInProgress: boolean;
  collectedTowers: Set<string>;
  enemyIdCounter: number;
  towerIdCounter: number;
  projectileIdCounter: number;
  particleIdCounter: number;
  enemiesSpawnedCount: number;
  spawnTimer: number;
}