import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BuildPanel } from './components/BuildPanel';
import { CampaignSummary } from './components/CampaignSummary';
import { EventBanner } from './components/EventBanner';
import { ReplayViewer } from './components/ReplayViewer';
import { RewardSelection } from './components/RewardSelection';
import {
  eventBlocksPlacement,
  getEnemyHealthMultiplierFromEvent,
  getPaintRewardMultiplierFromEvent,
  getProjectileSpeedMultiplierFromEvent,
  getTowerEventBuff,
  progressCampaignEvent,
  rollCampaignEvent,
  shouldTriggerEvent,
} from './logic/campaignEventSystem';
import { applyRewardToBuild, createInitialBuild } from './logic/buildSystem';
import { advanceDifficultyDirector, buildWaveConfig, createInitialDifficultyDirector } from './logic/difficultyDirector';
import { appendReplayAction, createReplay, createSeededRandom, finalizeReplay } from './logic/replaySystem';
import { getSaveVersion, loadCampaignSave, loadHistoricalMeta, saveCampaign, saveHistoricalMeta, clearCampaignSave } from './logic/saveSystem';
import { applyRewardToTowers, generateRewardChoices } from './logic/rewardSystem';
import type {
  CampaignStats,
  DifficultyDirectorState,
  HistoricalMeta,
  SaveData,
  ActiveCampaignEvent,
} from './types/campaign';
import type { ReplayData } from './types/replay';
import type { PlayerBuild, Reward } from './types/reward';
import type {
  Enemy,
  GameState,
  PaintEssence,
  Particle,
  Position,
  Projectile,
  Tower,
  TowerStyle,
  TowerType,
  WaveDirectorConfig,
  WaveMetrics,
} from './types/game';

const GRID_SIZE = 10;
const CELL_SIZE = 50;
const TOTAL_WAVES = 10;
const CORE_MAX_HEALTH = 100;

const PATH: Position[] = [
  { x: 0, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 2 },
  { x: 5, y: 2 },
  { x: 5, y: 6 },
  { x: 7, y: 6 },
  { x: 7, y: 4 },
  { x: 9, y: 4 },
];

const CORE_POSITION = { x: 9, y: 4 };

const TOWER_COSTS: Record<TowerType, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

const generatePathLines = () => {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < PATH.length - 1; i += 1) {
    lines.push({
      x1: PATH[i].x * CELL_SIZE + CELL_SIZE / 2,
      y1: PATH[i].y * CELL_SIZE + CELL_SIZE / 2,
      x2: PATH[i + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y2: PATH[i + 1].y * CELL_SIZE + CELL_SIZE / 2,
    });
  }
  return lines;
};

const PATH_LINES = generatePathLines();

const getColorValue = (type: TowerType): string => {
  const colors: Record<TowerType, string> = {
    red: '#e74c3c',
    blue: '#3498db',
    yellow: '#f39c12',
  };
  return colors[type];
};

const getStyleClass = (style: TowerStyle) => {
  switch (style) {
    case 'pencil':
      return 'border-2 border-dashed';
    case 'watercolor':
      return 'opacity-80';
    case 'oil':
      return 'border-4';
    default:
      return '';
  }
};

const createInitialCampaignStats = (): CampaignStats => ({
  totalPaintEarned: 0,
  totalPaintSpent: 0,
  highestScore: 0,
  highestWave: 1,
  strongestBuild: [],
  rewardRarityCount: {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  },
  eventHistory: [],
  waveHistory: [],
  difficultyHistory: [],
});

const clampHealth = (value: number) => Math.max(0, Math.min(CORE_MAX_HEALTH, value));

export default function CanvasDefender() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(CORE_MAX_HEALTH);
  const [paint, setPaint] = useState<PaintEssence>({ red: 50, blue: 50, yellow: 50 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<TowerStyle>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [playerBuild, setPlayerBuild] = useState<PlayerBuild>(createInitialBuild());
  const [difficultyDirector, setDifficultyDirector] = useState<DifficultyDirectorState>(createInitialDifficultyDirector());
  const [currentWaveConfig, setCurrentWaveConfig] = useState<WaveDirectorConfig>(buildWaveConfig(1, 1));
  const [activeEvent, setActiveEvent] = useState<ActiveCampaignEvent | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>(createInitialCampaignStats());
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [historicalMeta, setHistoricalMeta] = useState<HistoricalMeta>(loadHistoricalMeta());
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hasActiveSave, setHasActiveSave] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const waveStartTimeRef = useRef(0);
  const wavePaintEarnedRef = useRef(0);
  const waveLeakCountRef = useRef(0);
  const waveLeakDamageRef = useRef(0);
  const waveSpentAtStartRef = useRef(0);
  const waveCompletionLockRef = useRef(false);
  const rngRef = useRef(createSeededRandom(1));
  const replayRef = useRef<ReplayData | null>(null);
  const buildRef = useRef(playerBuild);
  const difficultyDirectorRef = useRef(difficultyDirector);
  const activeEventRef = useRef(activeEvent);
  const currentWaveConfigRef = useRef(currentWaveConfig);
  const towersRef = useRef(towers);
  const paintRef = useRef(paint);
  const scoreRef = useRef(score);
  const enemiesKilledRef = useRef(enemiesKilled);
  const coreHealthRef = useRef(coreHealth);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    replayRef.current = replayData;
  }, [replayData]);

  useEffect(() => {
    buildRef.current = playerBuild;
  }, [playerBuild]);

  useEffect(() => {
    difficultyDirectorRef.current = difficultyDirector;
  }, [difficultyDirector]);

  useEffect(() => {
    activeEventRef.current = activeEvent;
  }, [activeEvent]);

  useEffect(() => {
    currentWaveConfigRef.current = currentWaveConfig;
  }, [currentWaveConfig]);

  useEffect(() => {
    towersRef.current = towers;
  }, [towers]);

  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    enemiesKilledRef.current = enemiesKilled;
  }, [enemiesKilled]);

  useEffect(() => {
    coreHealthRef.current = coreHealth;
  }, [coreHealth]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    setHistoricalMeta(loadHistoricalMeta());
    setHasActiveSave(Boolean(loadCampaignSave()));
  }, []);

  const nextRandom = useCallback(() => rngRef.current.next(), []);

  const appendAction = useCallback((actionWave: number, type: Parameters<typeof appendReplayAction>[2], payload: unknown) => {
    setReplayData((prev) => (prev ? appendReplayAction(prev, actionWave, type, payload) : prev));
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i += 1) {
      newParticles.push({
        id: particleIdRef.current += 1,
        x,
        y,
        color,
        size: 4 + nextRandom() * 4,
        life: 30 + nextRandom() * 20,
        velocityX: (nextRandom() - 0.5) * 4,
        velocityY: (nextRandom() - 0.5) * 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, [nextRandom]);

  const getTowerBaseStats = useCallback((type: TowerType, style: TowerStyle) => {
    const styleMultiplier = style === 'pencil' ? 0.8 : style === 'watercolor' ? 1 : 1.2;
    const baseAttackSpeed = style === 'watercolor' ? 1200 : style === 'pencil' ? 800 : 1500;
    const modifiers = buildRef.current.modifiers;

    return {
      range: Number((2.5 + modifiers.rangeBonus + modifiers.towerTypeRangeBonus[type]).toFixed(2)),
      damage: Math.max(
        1,
        Math.round(15 * styleMultiplier * modifiers.damageMultiplier * (1 + modifiers.towerTypeDamageBonus[type])),
      ),
      attackSpeed: Math.max(
        250,
        Math.round(baseAttackSpeed * modifiers.attackSpeedMultiplier * modifiers.towerTypeAttackSpeedMultiplier[type]),
      ),
    };
  }, []);

  const createTower = useCallback((type: TowerType, style: TowerStyle, x: number, y: number): Tower => {
    const baseStats = getTowerBaseStats(type, style);
    return {
      id: towerIdRef.current += 1,
      x,
      y,
      type,
      level: 1,
      range: baseStats.range,
      damage: baseStats.damage,
      attackSpeed: baseStats.attackSpeed,
      lastAttack: 0,
      style,
    };
  }, [getTowerBaseStats]);

  const canPlaceTower = useCallback((x: number, y: number): boolean => {
    const isOnPath = PATH.some((point) => Math.abs(point.x - x) < 0.5 && Math.abs(point.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    if (eventBlocksPlacement(x, y, activeEventRef.current)) return false;
    const hasTower = towersRef.current.some((tower) => tower.x === x && tower.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  }, []);

  const registerPaintSpend = useCallback((amount: number) => {
    setCampaignStats((prev) => ({
      ...prev,
      totalPaintSpent: prev.totalPaintSpent + amount,
    }));
  }, []);

  const registerScore = useCallback((value: number) => {
    setScore((prev) => {
      const next = prev + value;
      setCampaignStats((stats) => (stats.highestScore >= next ? stats : { ...stats, highestScore: next }));
      return next;
    });
  }, []);

  const handleEnemyDeath = useCallback((enemy: Enemy) => {
    const rewardColor: TowerType = enemy.colorType === 'mixed'
      ? (['red', 'blue', 'yellow'] as TowerType[])[Math.floor(nextRandom() * 3)]
      : enemy.colorType;
    const paintGainBase = Math.round((8 + Math.floor(enemy.maxHealth / 15)) * enemy.rewardMultiplier);
    const paintGain = Math.max(
      1,
      Math.round((paintGainBase + buildRef.current.modifiers.bonusPaintOnKill) * getPaintRewardMultiplierFromEvent(rewardColor, activeEventRef.current)),
    );
    const scoreGain = 15 + Math.floor(enemy.maxHealth / 10) + (enemy.isElite ? 15 : 0);

    wavePaintEarnedRef.current += paintGain;
    setPaint((prev) => ({ ...prev, [rewardColor]: prev[rewardColor] + paintGain }));
    setEnemiesKilled((prev) => prev + 1);
    registerScore(scoreGain);
    setCampaignStats((prev) => ({
      ...prev,
      totalPaintEarned: prev.totalPaintEarned + paintGain,
    }));
    createParticles(enemy.x, enemy.y, enemy.color, 8);
  }, [createParticles, nextRandom, registerScore]);

  const spawnEnemy = useCallback(() => {
    const config = currentWaveConfigRef.current;
    const mixedChance = wave >= 3 ? config.mixedChance : 0;
    const isMixed = nextRandom() < mixedChance;
    const baseTypes: Array<TowerType | 'mixed'> = isMixed ? ['mixed'] : ['red', 'blue', 'yellow'];
    const type = baseTypes[Math.floor(nextRandom() * baseTypes.length)] ?? 'red';
    const elite = nextRandom() < config.eliteChance;
    const eventHealthMultiplier = getEnemyHealthMultiplierFromEvent(activeEventRef.current);
    const health = Math.round(config.enemyHealth * eventHealthMultiplier * (elite ? 1.7 : 1));
    const speed = Math.round(config.enemySpeed * (elite ? 1.12 : 1));

    const colors = {
      red: '#c0392b',
      blue: '#2980b9',
      yellow: '#d68910',
      mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(nextRandom() * 3)],
    } as const;

    const enemy: Enemy = {
      id: enemyIdRef.current += 1,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health,
      maxHealth: health,
      speed,
      baseSpeed: speed,
      color: elite ? '#111827' : colors[type],
      colorType: type,
      pathIndex: 0,
      rewardMultiplier: config.rewardMultiplier * (elite ? 1.45 : 1),
      isElite: elite,
      leakDamage: elite ? 15 : 10,
    };

    setEnemies((prev) => [...prev, enemy]);
  }, [nextRandom, wave]);

  const finalizeRun = useCallback((result: 'victory' | 'gameOver') => {
    if (gameStateRef.current === 'victory' || gameStateRef.current === 'gameOver') return;

    const finalReplay = replayRef.current
      ? finalizeReplay(replayRef.current, result, {
          score: scoreRef.current,
          wave,
          coreHealth: coreHealthRef.current,
          enemiesKilled: enemiesKilledRef.current,
          buildTags: buildRef.current.buildTags,
        })
      : null;

    const currentMeta = loadHistoricalMeta();
    const newRecord = scoreRef.current > currentMeta.highestScore || wave > currentMeta.highestWave;
    const shouldPromoteBuild =
      buildRef.current.selectedRewards.length > currentMeta.strongestBuild.length ||
      (wave >= currentMeta.highestWave && buildRef.current.buildTags.length >= currentMeta.strongestBuild.length);

    const nextMeta: HistoricalMeta = {
      highestScore: Math.max(currentMeta.highestScore, scoreRef.current),
      highestWave: Math.max(currentMeta.highestWave, wave),
      strongestBuild: shouldPromoteBuild ? buildRef.current.buildTags : currentMeta.strongestBuild,
      latestReplay: finalReplay,
    };

    if (finalReplay) {
      setReplayData(finalReplay);
    }

    setHistoricalMeta(nextMeta);
    setIsNewRecord(newRecord);
    setWaveInProgress(false);
    setAvailableRewards([]);
    setCampaignStats((prev) => ({
      ...prev,
      strongestBuild: buildRef.current.buildTags,
      finalResult: result,
      highestWave: Math.max(prev.highestWave, wave),
      highestScore: Math.max(prev.highestScore, scoreRef.current),
    }));
    saveHistoricalMeta(nextMeta);
    clearCampaignSave();
    setHasActiveSave(false);
    setGameState(result);
  }, [wave]);

  const completeWave = useCallback(() => {
    if (waveCompletionLockRef.current) return;
    waveCompletionLockRef.current = true;
    setWaveInProgress(false);

    const metrics: WaveMetrics = {
      wave,
      durationMs: Date.now() - waveStartTimeRef.current,
      leakedEnemies: waveLeakCountRef.current,
      leakedDamage: waveLeakDamageRef.current,
      enemiesSpawned: enemiesSpawnedRef.current,
      enemiesDefeated: enemiesSpawnedRef.current - waveLeakCountRef.current,
      totalPaintGained: wavePaintEarnedRef.current,
      totalPaintSpent: campaignStats.totalPaintSpent - waveSpentAtStartRef.current,
      coreHealthAfterWave: coreHealthRef.current,
    };

    const progressedEvent = progressCampaignEvent(activeEventRef.current, wave);

    if (progressedEvent.endedEvent) {
      appendAction(wave, 'RANDOM_EVENT_END', progressedEvent.endedEvent);
      setCampaignStats((prev) => ({
        ...prev,
        eventHistory: prev.eventHistory.map((event) => (
          event.id === progressedEvent.endedEvent?.id ? progressedEvent.endedEvent : event
        )),
      }));
    }

    setActiveEvent(progressedEvent.nextEvent);
    setCampaignStats((prev) => ({
      ...prev,
      waveHistory: [...prev.waveHistory, metrics],
      highestWave: Math.max(prev.highestWave, wave),
    }));
    appendAction(wave, 'END_WAVE', metrics);

    if (wave >= TOTAL_WAVES) {
      finalizeRun('victory');
      return;
    }

    const directorAdvance = advanceDifficultyDirector(difficultyDirectorRef.current, {
      wave,
      coreHealth: coreHealthRef.current,
      score: scoreRef.current,
      enemiesKilled: enemiesKilledRef.current,
      paint: paintRef.current,
      towers: towersRef.current,
      build: buildRef.current,
      lastWaveMetrics: metrics,
    });

    setDifficultyDirector(directorAdvance.director);
    setCurrentWaveConfig(directorAdvance.nextWaveConfig);
    setCampaignStats((prev) => ({
      ...prev,
      difficultyHistory: [...prev.difficultyHistory, directorAdvance.snapshot],
    }));
    appendAction(wave + 1, 'DIFFICULTY_UPDATE', directorAdvance.snapshot);

    if (shouldTriggerEvent(wave + 1)) {
      const nextEvent = rollCampaignEvent(wave + 1, towersRef.current, nextRandom);
      setActiveEvent(nextEvent);
      setCampaignStats((prev) => ({
        ...prev,
        eventHistory: [
          ...prev.eventHistory,
          {
            id: nextEvent.instanceId,
            name: nextEvent.name,
            startedWave: nextEvent.startedWave,
            description: nextEvent.description,
          },
        ],
      }));
      appendAction(wave + 1, 'RANDOM_EVENT_TRIGGER', {
        name: nextEvent.name,
        description: nextEvent.description,
      });
    }

    const rewards = generateRewardChoices(buildRef.current.selectedRewards, nextRandom);
    setAvailableRewards(rewards);
    setGameState('rewardSelection');
  }, [appendAction, campaignStats.totalPaintSpent, finalizeRun, nextRandom, wave]);

  const startNewCampaign = useCallback(() => {
    const seed = Date.now() >>> 0;
    rngRef.current.setState(seed);

    const freshReplay = createReplay(seed);

    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    waveStartTimeRef.current = 0;
    wavePaintEarnedRef.current = 0;
    waveLeakCountRef.current = 0;
    waveLeakDamageRef.current = 0;
    waveSpentAtStartRef.current = 0;
    waveCompletionLockRef.current = false;
    lastUpdateRef.current = Date.now();

    setGameState('playing');
    setWave(1);
    setCoreHealth(CORE_MAX_HEALTH);
    setPaint({ red: 50, blue: 50, yellow: 50 });
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setParticles([]);
    setScore(0);
    setEnemiesKilled(0);
    setWaveInProgress(false);
    setCollectedTowers(new Set());
    setSelectedTowerType(null);
    setSelectedStyle('pencil');
    setAvailableRewards([]);
    setPlayerBuild(createInitialBuild());
    setDifficultyDirector(createInitialDifficultyDirector());
    setCurrentWaveConfig(buildWaveConfig(1, 1));
    setActiveEvent(null);
    setCampaignStats(createInitialCampaignStats());
    setReplayData(freshReplay);
    setIsNewRecord(false);
    setHasActiveSave(false);
    clearCampaignSave();
  }, []);

  const restoreCampaign = useCallback((saveData: SaveData) => {
    rngRef.current.setState(saveData.campaign.randomSeed);

    setGameState(saveData.campaign.gameState === 'paused' ? 'playing' : saveData.campaign.gameState);
    setWave(saveData.campaign.wave);
    setCoreHealth(saveData.campaign.coreHealth);
    setPaint(saveData.campaign.paint);
    setEnemies([]);
    setTowers(saveData.campaign.towers);
    setProjectiles([]);
    setParticles([]);
    setScore(saveData.campaign.score);
    setEnemiesKilled(saveData.campaign.enemiesKilled);
    setWaveInProgress(false);
    setCollectedTowers(new Set(saveData.campaign.collectedTowers));
    setSelectedTowerType(saveData.campaign.selectedTowerType);
    setSelectedStyle(saveData.campaign.selectedStyle);
    setAvailableRewards(saveData.campaign.availableRewards);
    setPlayerBuild(saveData.build);
    setDifficultyDirector(saveData.campaign.difficultyDirector);
    setCurrentWaveConfig(saveData.campaign.currentWaveConfig);
    setActiveEvent(saveData.campaign.activeEvent);
    setCampaignStats(saveData.stats);
    setReplayData(saveData.replay);
    setHistoricalMeta(saveData.meta);
    setHasActiveSave(true);
    setIsNewRecord(false);

    enemyIdRef.current = 0;
    towerIdRef.current = Math.max(0, ...saveData.campaign.towers.map((tower) => tower.id));
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    wavePaintEarnedRef.current = 0;
    waveLeakCountRef.current = 0;
    waveLeakDamageRef.current = 0;
    waveSpentAtStartRef.current = saveData.stats.totalPaintSpent;
    waveCompletionLockRef.current = false;
    lastUpdateRef.current = Date.now();
  }, []);

  const placeTower = useCallback((x: number, y: number) => {
    if (!selectedTowerType || (gameStateRef.current !== 'playing' && gameStateRef.current !== 'paused')) return;
    if (!canPlaceTower(x, y)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    const currentPaint = paintRef.current;
    if (currentPaint.red < cost.red || currentPaint.blue < cost.blue || currentPaint.yellow < cost.yellow) return;

    const tower = createTower(selectedTowerType, selectedStyle, x, y);
    const spend = cost.red + cost.blue + cost.yellow;

    setTowers((prev) => [...prev, tower]);
    setPaint((prev) => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));
    registerPaintSpend(spend);

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    setCollectedTowers((prev) => {
      const next = new Set(prev);
      next.add(towerKey);
      return next;
    });
    appendAction(wave, 'PLACE_TOWER', { x, y, type: selectedTowerType, style: selectedStyle });
  }, [appendAction, canPlaceTower, createTower, registerPaintSpend, selectedStyle, selectedTowerType, wave]);

  const upgradeTower = useCallback((towerId: number) => {
    const target = towersRef.current.find((tower) => tower.id === towerId);
    if (!target || target.level >= 5) return;

    const cost = target.level * 25;
    if (paintRef.current[target.type] < cost) return;

    setPaint((prev) => ({ ...prev, [target.type]: prev[target.type] - cost }));
    registerPaintSpend(cost);
    setTowers((prev) => prev.map((tower) => (
      tower.id === towerId
        ? {
            ...tower,
            level: tower.level + 1,
            damage: Math.round(tower.damage * 1.4),
            range: Number((tower.range + 0.2).toFixed(2)),
          }
        : tower
    )));
    appendAction(wave, 'UPGRADE_TOWER', { towerId });
  }, [appendAction, registerPaintSpend, wave]);

  const startWave = useCallback(() => {
    if (waveInProgress || gameStateRef.current !== 'playing') return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    wavePaintEarnedRef.current = 0;
    waveLeakCountRef.current = 0;
    waveLeakDamageRef.current = 0;
    waveSpentAtStartRef.current = campaignStats.totalPaintSpent;
    waveStartTimeRef.current = Date.now();
    waveCompletionLockRef.current = false;
    appendAction(wave, 'START_WAVE', currentWaveConfigRef.current);
  }, [appendAction, campaignStats.totalPaintSpent, wave, waveInProgress]);

  const selectReward = useCallback((reward: Reward) => {
    setPlayerBuild((prev) => applyRewardToBuild(prev, reward));
    setTowers((prev) => applyRewardToTowers(prev, reward));
    if (reward.effect.coreHealthRestore) {
      setCoreHealth((prev) => clampHealth(prev + reward.effect.coreHealthRestore!));
    }

    setCampaignStats((prev) => ({
      ...prev,
      rewardRarityCount: {
        ...prev.rewardRarityCount,
        [reward.rarity]: prev.rewardRarityCount[reward.rarity] + 1,
      },
      strongestBuild: buildRef.current.buildTags,
    }));
    appendAction(wave + 1, 'SELECT_REWARD', {
      reward: reward.name,
      rarity: reward.rarity,
      tags: reward.tags,
    });
    setAvailableRewards([]);
    setWave((prev) => {
      const next = prev + 1;
      setCampaignStats((stats) => (stats.highestWave >= next ? stats : { ...stats, highestWave: next }));
      return next;
    });
    setGameState('playing');
  }, [appendAction, wave]);

  const continueSavedCampaign = useCallback(() => {
    const saveData = loadCampaignSave();
    if (saveData) {
      restoreCampaign(saveData);
    }
  }, [restoreCampaign]);

  const latestReplay = useMemo(() => replayData ?? historicalMeta.latestReplay, [historicalMeta.latestReplay, replayData]);

  const towerCounts = useMemo(
    () => ({
      red: towers.filter((tower) => tower.type === 'red').length,
      blue: towers.filter((tower) => tower.type === 'blue').length,
      yellow: towers.filter((tower) => tower.type === 'yellow').length,
    }),
    [towers],
  );

  useEffect(() => {
    if (coreHealth <= 0 && gameState !== 'gameOver' && gameState !== 'victory') {
      finalizeRun('gameOver');
    }
  }, [coreHealth, finalizeRun, gameState]);

  useEffect(() => {
    if (gameState === 'menu' || gameState === 'victory' || gameState === 'gameOver') return;

    const saveData: SaveData = {
      version: getSaveVersion(),
      savedAt: Date.now(),
      campaign: {
        gameState: gameState === 'paused' ? 'playing' : gameState,
        wave,
        coreHealth,
        paint,
        score,
        enemiesKilled,
        towers,
        selectedTowerType,
        selectedStyle,
        collectedTowers: Array.from(collectedTowers),
        availableRewards,
        activeEvent,
        difficultyDirector,
        currentWaveConfig,
        randomSeed: rngRef.current.getState(),
      },
      build: playerBuild,
      stats: campaignStats,
      replay: replayData ?? createReplay(rngRef.current.getState()),
      meta: historicalMeta,
    };

    saveCampaign(saveData);
    setHasActiveSave(true);
  }, [
    activeEvent,
    availableRewards,
    campaignStats,
    collectedTowers,
    coreHealth,
    currentWaveConfig,
    difficultyDirector,
    enemiesKilled,
    gameState,
    historicalMeta,
    paint,
    playerBuild,
    replayData,
    score,
    selectedStyle,
    selectedTowerType,
    towers,
    wave,
  ]);

  const gameLoop = useCallback(() => {
    const currentState = gameStateRef.current;

    if (currentState !== 'playing' && currentState !== 'paused') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (currentState === 'paused') {
      lastUpdateRef.current = Date.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    if (waveInProgress) {
      spawnTimerRef.current += delta;
      const spawnRate = currentWaveConfigRef.current.spawnRate;

      if (enemiesSpawnedRef.current < currentWaveConfigRef.current.enemyCount && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current += 1;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= currentWaveConfigRef.current.enemyCount && enemies.length === 0) {
        completeWave();
      }
    }

    setEnemies((prev) => {
      const updatedEnemies: Enemy[] = [];
      let leakedDamage = 0;
      let leakedEnemies = 0;

      prev.forEach((enemy) => {
        if (enemy.pathIndex >= PATH.length - 1) {
          leakedDamage += enemy.leakDamage;
          leakedEnemies += 1;
          return;
        }

        const target = {
          x: PATH[enemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
          y: PATH[enemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
        };

        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          updatedEnemies.push({ ...enemy, pathIndex: enemy.pathIndex + 1 });
        } else {
          updatedEnemies.push({
            ...enemy,
            x: enemy.x + (dx / dist) * enemy.speed * delta,
            y: enemy.y + (dy / dist) * enemy.speed * delta,
          });
        }
      });

      if (leakedDamage > 0) {
        waveLeakCountRef.current += leakedEnemies;
        waveLeakDamageRef.current += leakedDamage;
        setCoreHealth((prev) => clampHealth(prev - leakedDamage));
      }

      return updatedEnemies;
    });

    setTowers((prev) => {
      const currentTime = Date.now();
      const spawnedProjectiles: Projectile[] = [];

      const nextTowers = prev.map((tower) => {
        if (currentTime - tower.lastAttack < tower.attackSpeed) {
          return tower;
        }

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;
        const eventBuff = getTowerEventBuff(tower.id, activeEventRef.current);
        const effectiveRange = (tower.range + eventBuff.rangeBonus) * CELL_SIZE;
        const inRange = enemies.filter((enemy) => {
          const dx = enemy.x - towerCenterX;
          const dy = enemy.y - towerCenterY;
          return Math.sqrt(dx * dx + dy * dy) <= effectiveRange;
        });

        if (!inRange.length) {
          return tower;
        }

        const shotCount = 1 + Math.min(buildRef.current.modifiers.splitShots, 2);
        const targets = inRange.slice(0, shotCount);

        targets.forEach((target) => {
          spawnedProjectiles.push({
            id: projectileIdRef.current += 1,
            x: towerCenterX,
            y: towerCenterY,
            targetId: target.id,
            targetX: target.x,
            targetY: target.y,
            color: getColorValue(tower.type),
            speed: 350 * buildRef.current.modifiers.projectileSpeedMultiplier * getProjectileSpeedMultiplierFromEvent(activeEventRef.current),
            damage: Math.round(tower.damage * tower.level * eventBuff.damageMultiplier),
            type: tower.type === 'blue' ? 'slow' : tower.type === 'yellow' ? 'pierce' : 'normal',
            extraHits: buildRef.current.modifiers.chainHits,
          });
        });

        return { ...tower, lastAttack: currentTime };
      });

      if (spawnedProjectiles.length) {
        setProjectiles((prevProjectiles) => [...prevProjectiles, ...spawnedProjectiles]);
      }

      return nextTowers;
    });

    setProjectiles((prev) => {
      const remaining: Projectile[] = [];

      prev.forEach((projectile) => {
        const targetEnemy = enemies.find((enemy) => enemy.id === projectile.targetId);
        const targetX = targetEnemy?.x ?? projectile.targetX;
        const targetY = targetEnemy?.y ?? projectile.targetY;
        const dx = targetX - projectile.x;
        const dy = targetY - projectile.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 12) {
          setEnemies((currentEnemies) => {
            const impactedEnemies = [...currentEnemies];
            const hitCount = projectile.type === 'pierce' ? 99 : 1 + projectile.extraHits;
            const hitRange = projectile.type === 'pierce' ? 60 : 45;
            const candidates = impactedEnemies
              .filter((enemy) => {
                const enemyDx = enemy.x - projectile.x;
                const enemyDy = enemy.y - projectile.y;
                return Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy) <= hitRange;
              })
              .sort((left, right) => {
                const leftDistance = Math.hypot(left.x - projectile.x, left.y - projectile.y);
                const rightDistance = Math.hypot(right.x - projectile.x, right.y - projectile.y);
                return leftDistance - rightDistance;
              })
              .slice(0, hitCount);

            candidates.forEach((enemy) => {
              const index = impactedEnemies.findIndex((item) => item.id === enemy.id);
              if (index < 0) return;

              const nextHealth = impactedEnemies[index].health - projectile.damage;
              createParticles(enemy.x, enemy.y, projectile.color, 3);

              if (nextHealth <= 0) {
                handleEnemyDeath(impactedEnemies[index]);
                impactedEnemies.splice(index, 1);
                return;
              }

              impactedEnemies[index] = {
                ...impactedEnemies[index],
                health: nextHealth,
                speed: projectile.type === 'slow' ? Math.max(15, impactedEnemies[index].baseSpeed * 0.75) : impactedEnemies[index].baseSpeed,
              };
            });

            return impactedEnemies;
          });
        } else {
          remaining.push({
            ...projectile,
            targetX,
            targetY,
            x: projectile.x + (dx / dist) * projectile.speed * delta,
            y: projectile.y + (dy / dist) * projectile.speed * delta,
          });
        }
      });

      return remaining;
    });

    setParticles((prev) => prev
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.velocityX,
        y: particle.y + particle.velocityY,
        life: particle.life - 1,
        size: particle.size * 0.95,
      }))
      .filter((particle) => particle.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [completeWave, createParticles, enemies, handleEnemyDeath, spawnEnemy, waveInProgress]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
      style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}
    >
      {gameState === 'menu' && (
        <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.3fr_1fr] items-start">
          <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 transform rotate-1">
            <div className="transform -rotate-1">
              <h1 className="text-5xl font-bold text-amber-700 mb-2" style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
                🎨 绘世守护者
              </h1>
              <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender Roguelike Campaign</p>

              <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left space-y-3">
                <div className="text-amber-800 font-bold text-lg">战役内容</div>
                <div className="text-sm text-amber-700">每波结束可从 3 个随机奖励中选择 1 个，逐步塑造自己的 Roguelike 构筑。</div>
                <div className="text-sm text-amber-700">动态难度导演会根据防线表现平滑调整下一波敌人的数量、强度和精英概率。</div>
                <div className="text-sm text-amber-700">随机事件会真实修改子弹速度、敌人生命、可放置格子和颜料收益。</div>
                <div className="text-sm text-amber-700">战役自动存档，刷新页面后可继续，结算时还能查看轻量回放。</div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={startNewCampaign}
                  className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
                >
                  ✏️ 开始新战役
                </button>
                {hasActiveSave && (
                  <button
                    onClick={continueSavedCampaign}
                    className="px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl text-xl font-bold hover:from-sky-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
                  >
                    💾 继续战役
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-amber-300">
              <h3 className="text-xl font-bold text-amber-800 mb-4">历史记录</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-amber-50 px-4 py-3"><span>历史最高分</span><span className="font-bold text-amber-700">{historicalMeta.highestScore}</span></div>
                <div className="flex justify-between rounded-xl bg-rose-50 px-4 py-3"><span>历史最高波次</span><span className="font-bold text-rose-700">{historicalMeta.highestWave}</span></div>
                <div className="rounded-xl bg-indigo-50 px-4 py-3">
                  <div className="font-bold text-indigo-700 mb-1">最强 Build</div>
                  <div className="text-indigo-600">{historicalMeta.strongestBuild.join(' / ') || '暂无记录'}</div>
                </div>
              </div>
            </div>
            <ReplayViewer replay={historicalMeta.latestReplay} />
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused' || gameState === 'rewardSelection') && (
        <div className="w-full max-w-[1520px] flex flex-wrap gap-4 justify-center items-start">
          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-64">
            <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
              🎨 颜料精华
            </h3>

            <div className="space-y-3 mb-4">
              {(['red', 'blue', 'yellow'] as TowerType[]).map((type) => (
                <div key={type} className={`flex items-center gap-2 p-2 rounded-lg ${type === 'red' ? 'bg-red-50' : type === 'blue' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: getColorValue(type) }}></div>
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: getColorValue(type) }}>{type === 'red' ? '红色' : type === 'blue' ? '蓝色' : '黄色'}</div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${getColorValue(type)}33` }}>
                      <div className="h-full transition-all" style={{ width: `${Math.min(100, paint[type])}%`, backgroundColor: getColorValue(type) }}></div>
                    </div>
                  </div>
                  <span className="font-bold w-8 text-right" style={{ color: getColorValue(type) }}>{paint[type]}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 p-3 mb-4 text-sm text-slate-700">
              <div>导演威胁值：{difficultyDirector.threatLevel.toFixed(2)}</div>
              <div>下一波敌人数：{currentWaveConfig.enemyCount}</div>
              <div>精英概率：{Math.round(currentWaveConfig.eliteChance * 100)}%</div>
              <div>混合色概率：{Math.round(currentWaveConfig.mixedChance * 100)}%</div>
            </div>

            <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
              ✏️ 绘制防御塔
            </h3>

            <div className="space-y-2 mb-4">
              {(['red', 'blue', 'yellow'] as TowerType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedTowerType(selectedTowerType === type ? null : type)}
                  className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${selectedTowerType === type ? 'border-gray-800 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-400'} ${gameState === 'rewardSelection' ? 'opacity-50 pointer-events-none' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${getColorValue(type)}30, white)` }}
                >
                  <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl ${getStyleClass(selectedStyle)}`} style={{ backgroundColor: getColorValue(type) }}>
                    {selectedStyle === 'pencil' ? '✏️' : selectedStyle === 'watercolor' ? '💧' : '🖌️'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-bold" style={{ color: getColorValue(type) }}>
                      {type === 'red' ? '烈焰塔' : type === 'blue' ? '寒冰塔' : '雷电塔'}
                    </div>
                    <div className="text-xs text-gray-500">消耗 {TOWER_COSTS[type][type]} 精华</div>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
              🖌️ 笔触风格
            </h3>

            <div className="grid grid-cols-3 gap-1 mb-4">
              {(['pencil', 'watercolor', 'oil'] as TowerStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${selectedStyle === style ? 'bg-amber-400 text-amber-900 shadow-md' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} ${gameState === 'rewardSelection' ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {style === 'pencil' ? '✏️铅笔' : style === 'watercolor' ? '💧水彩' : '🖌️油画'}
                </button>
              ))}
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center mb-4">
              {gameState === 'rewardSelection' ? '奖励选择中，选择后进入下一波' : '点击画布空白处放置防御塔，点击已放置的塔进行升级'}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2"><span>消灭敌人</span><span className="font-bold text-red-600">{enemiesKilled}</span></div>
              <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2"><span>获得分数</span><span className="font-bold text-amber-600">{score}</span></div>
              <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2"><span>防御塔数</span><span className="font-bold text-blue-600">{towers.length}</span></div>
              <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2"><span>总获颜料</span><span className="font-bold text-emerald-600">{campaignStats.totalPaintEarned}</span></div>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-[640px]">
            <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300 flex-wrap justify-center">
              <div className="text-amber-800 font-bold flex items-center gap-1"><span className="text-xl">🌊</span><span>波次 {wave}/{TOTAL_WAVES}</span></div>
              <div className="text-red-600 font-bold flex items-center gap-1"><span className="text-xl">❤️</span><span>{coreHealth}</span></div>
              <div className="text-amber-600 font-bold flex items-center gap-1"><span className="text-xl">⭐</span><span>{score}</span></div>
              <div className="text-green-600 font-bold flex items-center gap-1"><span className="text-xl">💀</span><span>{enemiesKilled}</span></div>
              <div className="text-indigo-600 font-bold flex items-center gap-1"><span className="text-xl">🎯</span><span>{playerBuild.buildTags.join(' / ') || '未成型'}</span></div>
            </div>

            <div className="w-full max-w-[860px]">
              <EventBanner activeEvent={activeEvent} />
            </div>

            {gameState === 'rewardSelection' ? (
              <RewardSelection wave={wave} rewards={availableRewards} onSelect={selectReward} />
            ) : (
              <>
                <div
                  className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
                  style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)' }}
                >
                  <svg className="absolute inset-0 pointer-events-none" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                    {PATH_LINES.map((line, index) => (
                      <g key={index}>
                        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#8B4513" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#D2691E" strokeWidth="4" strokeDasharray="12,8" strokeLinecap="round" opacity="0.7" />
                      </g>
                    ))}
                  </svg>

                  {PATH.map((position, index) => (
                    <div
                      key={index}
                      className="absolute rounded-lg border-2 border-dashed border-amber-400"
                      style={{
                        left: position.x * CELL_SIZE + 3,
                        top: position.y * CELL_SIZE + 3,
                        width: CELL_SIZE - 6,
                        height: CELL_SIZE - 6,
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        opacity: 0.7,
                        boxShadow: 'inset 0 0 10px rgba(180, 83, 9, 0.1)',
                      }}
                    />
                  ))}

                  <div className="absolute flex items-center justify-center animate-pulse" style={{ left: CORE_POSITION.x * CELL_SIZE, top: CORE_POSITION.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-blue-400 shadow-lg flex items-center justify-center border-4 border-white">
                        <span className="text-xl">💎</span>
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full text-xs font-bold text-red-500 shadow">
                        {coreHealth}
                      </div>
                    </div>
                  </div>

                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                    const x = index % GRID_SIZE;
                    const y = Math.floor(index / GRID_SIZE);
                    const canPlace = canPlaceTower(x, y);
                    const blockedByEvent = eventBlocksPlacement(x, y, activeEvent);
                    return (
                      <div
                        key={index}
                        className={`absolute cursor-pointer transition-all ${selectedTowerType && canPlace ? 'hover:bg-green-300 hover:bg-opacity-40 hover:border-2 hover:border-green-500 hover:border-dashed' : ''}`}
                        style={{
                          left: x * CELL_SIZE,
                          top: y * CELL_SIZE,
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: blockedByEvent ? 'rgba(127, 29, 29, 0.25)' : 'transparent',
                        }}
                        onClick={() => placeTower(x, y)}
                      />
                    );
                  })}

                  {towers.map((tower) => {
                    const buff = getTowerEventBuff(tower.id, activeEvent);
                    return (
                      <div
                        key={tower.id}
                        className="absolute flex flex-col items-center justify-center cursor-pointer group"
                        style={{ left: tower.x * CELL_SIZE + 2, top: tower.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                        onClick={() => upgradeTower(tower.id)}
                      >
                        <div
                          className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                          style={{
                            width: (tower.range + buff.rangeBonus) * CELL_SIZE * 2,
                            height: (tower.range + buff.rangeBonus) * CELL_SIZE * 2,
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            borderColor: getColorValue(tower.type),
                            backgroundColor: getColorValue(tower.type),
                          }}
                        />
                        <div
                          className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
                          style={{
                            background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`,
                            borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : tower.style === 'watercolor' ? '50%' : '8px',
                            boxShadow: `0 4px 12px ${getColorValue(tower.type)}60, inset 0 0 10px rgba(255,255,255,0.3)`,
                            border: tower.style === 'pencil' ? '2px dashed #333' : `3px solid ${getColorValue(tower.type)}`,
                            outline: buff.damageMultiplier > 1 ? '3px solid rgba(255,255,255,0.8)' : 'none',
                          }}
                        >
                          <span className="text-lg text-white font-bold drop-shadow-lg">
                            {tower.style === 'pencil' ? '✏️' : tower.style === 'watercolor' ? '💧' : '🖌️'}
                            {tower.level}
                          </span>
                        </div>
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg border border-gray-600">
                          {tower.level < 5 ? `⬆️ 升级: ${tower.level * 25}精华` : '⭐ 已满级'}
                        </div>
                      </div>
                    );
                  })}

                  {enemies.map((enemy) => (
                    <div key={enemy.id} className="absolute flex flex-col items-center" style={{ left: enemy.x - 18, top: enemy.y - 24, transition: 'none' }}>
                      <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 border border-gray-300">
                        <div className="h-full transition-all" style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%`, background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)` }} />
                      </div>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`, boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`, border: enemy.isElite ? '2px solid #fff' : '2px dashed rgba(0,0,0,0.2)' }}>
                        <span className="text-base drop-shadow">{enemy.isElite ? '👑' : '🎨'}</span>
                      </div>
                    </div>
                  ))}

                  {projectiles.map((projectile) => (
                    <div
                      key={projectile.id}
                      className="absolute rounded-full"
                      style={{
                        left: projectile.x - 6,
                        top: projectile.y - 6,
                        width: projectile.type === 'pierce' ? 14 : 12,
                        height: projectile.type === 'pierce' ? 14 : 12,
                        background: `radial-gradient(circle, white, ${projectile.color})`,
                        boxShadow: `0 0 12px ${projectile.color}, 0 0 20px ${projectile.color}50`,
                        border: projectile.type === 'slow' ? '2px dashed white' : projectile.extraHits > 0 ? '2px solid white' : 'none',
                      }}
                    />
                  ))}

                  {particles.map((particle) => (
                    <div
                      key={particle.id}
                      className="absolute rounded-full pointer-events-none"
                      style={{ left: particle.x - particle.size / 2, top: particle.y - particle.size / 2, width: particle.size, height: particle.size, background: `radial-gradient(circle, ${particle.color}, ${particle.color}80)`, opacity: particle.life / 50, filter: 'blur(0.5px)' }}
                    />
                  ))}
                </div>

                <div className="flex gap-3 mt-3 flex-wrap justify-center">
                  {!waveInProgress ? (
                    <button onClick={startWave} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                      🚀 开始第 {wave} 波
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                      ⚔️ 战斗中... ({enemies.length} 只颜料怪)
                    </div>
                  )}

                  <button
                    onClick={() => setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'))}
                    className="px-4 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg"
                  >
                    {gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <BuildPanel build={playerBuild} activeEvent={activeEvent} />

            <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-72">
              <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
                📖 图鉴与战役统计
              </h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['red', 'blue', 'yellow'] as TowerType[]).flatMap((type) =>
                  (['pencil', 'watercolor', 'oil'] as TowerStyle[]).map((style) => {
                    const key = `${type}-${style}`;
                    const collected = collectedTowers.has(key);
                    return (
                      <div
                        key={key}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${collected ? `${getStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'}`}
                        style={{ backgroundColor: collected ? getColorValue(type) : '#f3f4f6' }}
                      >
                        <span className="text-lg">{collected ? (style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️') : '❓'}</span>
                      </div>
                    );
                  }),
                )}
              </div>

              <div className="text-center text-sm text-amber-600 bg-amber-50 py-2 rounded-lg mb-4">
                已收集: {collectedTowers.size} / 9
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2"><span>红塔</span><span className="font-bold text-red-600">{towerCounts.red}</span></div>
                <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2"><span>蓝塔</span><span className="font-bold text-blue-600">{towerCounts.blue}</span></div>
                <div className="flex justify-between rounded-lg bg-yellow-50 px-3 py-2"><span>黄塔</span><span className="font-bold text-yellow-600">{towerCounts.yellow}</span></div>
                <div className="flex justify-between rounded-lg bg-fuchsia-50 px-3 py-2"><span>奖励选择数</span><span className="font-bold text-fuchsia-700">{playerBuild.selectedRewards.length}</span></div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
                <div>历史最高分：{historicalMeta.highestScore}</div>
                <div>历史最高波次：{historicalMeta.highestWave}</div>
                <div>最强 Build：{historicalMeta.strongestBuild.join(' / ') || '暂无'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(gameState === 'gameOver' || gameState === 'victory') && (
        <div className="w-full max-w-6xl space-y-6">
          <CampaignSummary
            result={gameState}
            wave={wave}
            coreHealth={coreHealth}
            score={score}
            enemiesKilled={enemiesKilled}
            totalPaintEarned={campaignStats.totalPaintEarned}
            build={playerBuild}
            towers={towers}
            stats={campaignStats}
            historicalMeta={historicalMeta}
            isNewRecord={isNewRecord}
            onRestart={startNewCampaign}
          />
          <ReplayViewer replay={latestReplay} />
        </div>
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        🎨 绘世守护者 - 用画笔守护你的世界
      </div>
    </div>
  );
}
