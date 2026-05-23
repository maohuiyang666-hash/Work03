import type { Enemy, Particle, Projectile, Tower } from './entities';
import type { GameStatus, PaintEssence, TowerCollectionKey, TowerStyle, TowerType } from './game';

export interface GameState {
  gameStatus: GameStatus;
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
  collectedTowers: Set<TowerCollectionKey>;
}

export interface GameLoopRefs {
  enemyId: number;
  towerId: number;
  projectileId: number;
  particleId: number;
  lastUpdate: number;
  enemiesSpawned: number;
  spawnTimer: number;
}
