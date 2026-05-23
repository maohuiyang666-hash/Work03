import { Enemy, Tower, Projectile, Particle } from './entities';
import { GameState, TowerType, TowerStyle, PaintEssence } from './game';

export interface GameEngineState {
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
