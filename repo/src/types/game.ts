export type TowerType = 'red' | 'blue' | 'yellow';
export type TowerStyle = 'pencil' | 'watercolor' | 'oil';
export type EnemyColorType = TowerType | 'mixed';
export type GameState = 'menu' | 'playing' | 'paused' | 'rewardSelection' | 'gameOver' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  color: string;
  colorType: EnemyColorType;
  pathIndex: number;
  rewardMultiplier: number;
  isElite: boolean;
  leakDamage: number;
}

export interface Tower {
  id: number;
  x: number;
  y: number;
  type: TowerType;
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: TowerStyle;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number | null;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
  damage: number;
  type: 'normal' | 'slow' | 'pierce';
  extraHits: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  velocityX: number;
  velocityY: number;
}

export interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

export interface WaveMetrics {
  wave: number;
  durationMs: number;
  leakedEnemies: number;
  leakedDamage: number;
  enemiesSpawned: number;
  enemiesDefeated: number;
  totalPaintGained: number;
  totalPaintSpent: number;
  coreHealthAfterWave: number;
}

export interface WaveDirectorConfig {
  enemyCount: number;
  enemyHealth: number;
  enemySpeed: number;
  mixedChance: number;
  eliteChance: number;
  rewardMultiplier: number;
  spawnRate: number;
}
