import type { PlayerBuild, Reward, RewardRarity } from './reward';
import type { PaintEssence, Position, Tower, TowerStyle, TowerType, WaveDirectorConfig, WaveMetrics, GameState } from './game';
import type { ReplayData } from './replay';

export type CampaignEventType = 'paintStorm' | 'darkErosion' | 'mapRift' | 'inspirationBurst' | 'paintDrought';

export interface CampaignEventEffect {
  projectileSpeedMultiplier?: number;
  enemyHealthMultiplier?: number;
  blockedCells?: Position[];
  inspirationDamageMultiplier?: number;
  inspirationRangeBonus?: number;
  reducedPaintColor?: TowerType;
  reducedPaintMultiplier?: number;
}

export interface CampaignEventDefinition {
  id: CampaignEventType;
  name: string;
  description: string;
  durationWaves: number;
  effect: CampaignEventEffect;
}

export interface ActiveCampaignEvent extends CampaignEventDefinition {
  instanceId: string;
  startedWave: number;
  endsAfterWave: number;
  remainingWaves: number;
  highlightedTowerIds: number[];
  blockedCells: Position[];
}

export interface EventHistoryEntry {
  id: string;
  name: string;
  startedWave: number;
  endedWave?: number;
  description: string;
}

export interface DifficultySnapshot extends WaveDirectorConfig {
  wave: number;
  threatLevel: number;
  summary: string;
}

export interface DifficultyDirectorState {
  threatLevel: number;
  history: DifficultySnapshot[];
  lastWaveMetrics: WaveMetrics | null;
}

export interface CampaignStats {
  totalPaintEarned: number;
  totalPaintSpent: number;
  highestScore: number;
  highestWave: number;
  strongestBuild: string[];
  rewardRarityCount: Record<RewardRarity, number>;
  eventHistory: EventHistoryEntry[];
  waveHistory: WaveMetrics[];
  difficultyHistory: DifficultySnapshot[];
  finalResult?: 'victory' | 'gameOver';
}

export interface CampaignState {
  gameState: GameState;
  wave: number;
  coreHealth: number;
  paint: PaintEssence;
  score: number;
  enemiesKilled: number;
  towers: Tower[];
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  collectedTowers: string[];
  availableRewards: Reward[];
  activeEvent: ActiveCampaignEvent | null;
  difficultyDirector: DifficultyDirectorState;
  currentWaveConfig: WaveDirectorConfig;
  randomSeed: number;
}

export interface HistoricalMeta {
  highestScore: number;
  highestWave: number;
  strongestBuild: string[];
  latestReplay: ReplayData | null;
}

export interface SaveData {
  version: number;
  savedAt: number;
  campaign: CampaignState;
  build: PlayerBuild;
  stats: CampaignStats;
  replay: ReplayData;
  meta: HistoricalMeta;
}
