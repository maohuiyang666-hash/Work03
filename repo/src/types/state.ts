import type { Enemy, Tower, Projectile, Particle, TowerType, TowerStyle } from './entities';
import type { GameState, PaintEssence } from './game';

export interface GameStateData {
  gameState: GameState;
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
