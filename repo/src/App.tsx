import { useState, useEffect, useCallback, useRef } from 'react';
import { Reward, ActiveRewardModifiers } from './types/reward';
import { CampaignState, PlayerBuild, CampaignStats, DifficultyState } from './types/campaign';
import { ReplayData } from './types/replay';
import { generateRewardChoices, applyRewardEffect, getDefaultModifiers } from './logic/rewardSystem';
import { updateBuildAfterReward, createInitialBuild } from './logic/buildSystem';
import { createInitialDifficulty, calculateDifficulty } from './logic/difficultyDirector';
import { shouldTriggerEvent, generateEvent, updateEventRemaining, isEventExpired, getEventBlockedCells } from './logic/campaignEventSystem';
import { saveCampaign, loadCampaign, deleteCampaign, getDefaultStats, updateStatsAfterGame, hasCampaignSave } from './logic/saveSystem';
import { createReplay, recordAction, finalizeReplay } from './logic/replaySystem';
import RewardSelection from './components/RewardSelection';
import BuildPanel from './components/BuildPanel';
import CampaignSummary from './components/CampaignSummary';
import ReplayViewer from './components/ReplayViewer';
import EventBanner from './components/EventBanner';

type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory' | 'rewardSelection';

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  color: string;
  colorType: 'red' | 'blue' | 'yellow' | 'mixed';
  pathIndex: number;
  isElite: boolean;
}

interface Tower {
  id: number;
  x: number;
  y: number;
  type: 'red' | 'blue' | 'yellow';
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: 'pencil' | 'watercolor' | 'oil';
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
  damage: number;
  type: 'normal' | 'slow' | 'pierce';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  velocityX: number;
  velocityY: number;
}

interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

type PaintColor = 'red' | 'blue' | 'yellow';

const GRID_SIZE = 10;
const CELL_SIZE = 50;

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

const generatePathLines = () => {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
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

const PATH_LINES = generatePathLines();

const CORE_POSITION = { x: 9, y: 4 };

const TOWER_COSTS: Record<string, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

const MAX_WAVES = 20;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function addPaint(paint: PaintEssence, color: PaintColor, amount: number): PaintEssence {
  return { ...paint, [color]: paint[color] + amount };
}

export default function CanvasDefender() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(100);
  const [paint, setPaint] = useState<PaintEssence>({ red: 50, blue: 50, yellow: 50 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<'red' | 'blue' | 'yellow' | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'pencil' | 'watercolor' | 'oil'>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());

  const [rewardChoices, setRewardChoices] = useState<Reward[]>([]);
  const [activeModifiers, setActiveModifiers] = useState<ActiveRewardModifiers>(getDefaultModifiers());
  const [playerBuild, setPlayerBuild] = useState<PlayerBuild>(createInitialBuild());
  const [difficultyDirector, setDifficultyDirector] = useState<DifficultyState>(createInitialDifficulty());
  const [campaignEvents, setCampaignEvents] = useState<import('./types/campaign').CampaignEvent[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>(getDefaultStats());
  const [seed] = useState(() => Math.floor(Math.random() * 1000000));
  const [replay, setReplay] = useState<ReplayData | null>(null);

  useEffect(() => {
    let projectileSpeedMult = 0;
    let enemyHealthMult = 0;
    let paintReductionMult = 0;
    let paintReductionColor: string | null = null;

    for (const e of campaignEvents) {
      if (e.remainingWaves <= 0) continue;
      switch (e.effect.type) {
        case 'projectileSpeed':
          projectileSpeedMult = Math.max(projectileSpeedMult, e.effect.value);
          break;
        case 'enemyHealth':
          enemyHealthMult = Math.max(enemyHealthMult, e.effect.value);
          break;
        case 'paintReduction':
          paintReductionMult = Math.max(paintReductionMult, e.effect.value);
          if (e.effect.targetColor) paintReductionColor = e.effect.targetColor;
          break;
      }
    }
    activeEventEffectsRef.current = { projectileSpeedMult, enemyHealthMult, paintReductionMult, paintReductionColor };
  }, [campaignEvents]);

  const [showReplay, setShowReplay] = useState(false);
  const [currentReplay, setCurrentReplay] = useState<ReplayData | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [waveStartTime, setWaveStartTime] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const rngRef = useRef<() => number>(seededRandom(seed));
  const gameTimeRef = useRef(0);
  const eventBlockedCellsRef = useRef<Set<string>>(new Set());
  const buffedTowerIdRef = useRef<number | null>(null);
  const activeEventEffectsRef = useRef<{
    projectileSpeedMult: number;
    enemyHealthMult: number;
    paintReductionMult: number;
    paintReductionColor: string | null;
  }>({
    projectileSpeedMult: 0,
    enemyHealthMult: 0,
    paintReductionMult: 0,
    paintReductionColor: null,
  });
  const enemiesReachedCoreRef = useRef(false);
  const difficultyHistoryRef = useRef<{ wave: number; enemyCount: number; enemyHealth: number; enemySpeed: number }[]>([]);

  const getColorValue = (type: 'red' | 'blue' | 'yellow'): string => {
    const colors: Record<PaintColor, string> = {
      red: '#e74c3c',
      blue: '#3498db',
      yellow: '#f39c12',
    };
    return colors[type];
  };

  const getStyleClass = (style: string) => {
    switch (style) {
      case 'pencil': return 'border-2 border-dashed';
      case 'watercolor': return 'opacity-80';
      case 'oil': return 'border-4';
      default: return '';
    }
  };

  const canPlaceTower = (x: number, y: number): boolean => {
    const key = `${x},${y}`;
    if (eventBlockedCellsRef.current.has(key)) return false;
    const isOnPath = PATH.some((p: Position) => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    const hasTower = towers.some((t: Tower) => t.x === x && t.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  };

  const addReplayAction = useCallback((type: import('./types/replay').ReplayActionType, payload: unknown) => {
    setReplay((prev: ReplayData | null) => {
      if (!prev) return prev;
      return recordAction(prev, {
        time: gameTimeRef.current,
        wave,
        type,
        payload,
      });
    });
  }, [wave]);

  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!canPlaceTower(x, y)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    if (paint.red < cost.red || paint.blue < cost.blue || paint.yellow < cost.yellow) return;

    const styleMultiplier = selectedStyle === 'pencil' ? 0.8 : selectedStyle === 'watercolor' ? 1.0 : 1.2;
    const rangeMult = 1 + activeModifiers.towerRangeMult;
    const atkSpdMult = activeModifiers.towerAttackSpeedMult > 0 ? (1 / (1 + activeModifiers.towerAttackSpeedMult)) : 1;

    const newTower: Tower = {
      id: towerIdRef.current++,
      x,
      y,
      type: selectedTowerType,
      level: 1,
      range: 2.5 * rangeMult,
      damage: Math.floor(15 * styleMultiplier),
      attackSpeed: (selectedStyle === 'watercolor' ? 1200 : selectedStyle === 'pencil' ? 800 : 1500) * atkSpdMult,
      lastAttack: 0,
      style: selectedStyle,
    };

    setTowers((prev: Tower[]) => [...prev, newTower]);
    setPaint((prev: PaintEssence) => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers((prev: Set<string>) => new Set(prev).add(towerKey));
    }

    addReplayAction('PLACE_TOWER', { x, y, type: selectedTowerType, style: selectedStyle });
  };

  const spawnEnemy = useCallback(() => {
    const colorTypes: Array<'red' | 'blue' | 'yellow' | 'mixed'> = ['red', 'blue', 'yellow'];
    if (rngRef.current() < difficultyDirector.mixedColorChance) colorTypes.push('mixed');
    const type = colorTypes[Math.floor(rngRef.current() * colorTypes.length)];

    const isElite = rngRef.current() < difficultyDirector.eliteChance;
    const eliteMult = isElite ? 2 : 1;

    const colors: Record<string, string> = {
      red: '#c0392b',
      blue: '#2980b9',
      yellow: '#d68910',
      mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(rngRef.current() * 3)],
    };

    const baseHealth = 40 + wave * 15;
    const healthMod = 1 + difficultyDirector.enemyHealthMod + activeEventEffectsRef.current.enemyHealthMult;
    const baseSpeed = 35 + Math.min(wave * 3, 25);
    const speedMod = 1 + difficultyDirector.enemySpeedMod;

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: Math.floor(baseHealth * healthMod * eliteMult),
      maxHealth: Math.floor(baseHealth * healthMod * eliteMult),
      speed: Math.min(80, baseSpeed * speedMod * (isElite ? 1.3 : 1)),
      color: isElite ? '#ff6b35' : colors[type],
      colorType: type,
      pathIndex: 0,
      isElite,
    };

    setEnemies((prev: Enemy[]) => [...prev, newEnemy]);
  }, [wave, difficultyDirector]);

  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    enemiesReachedCoreRef.current = false;
    setWaveStartTime(Date.now());
    addReplayAction('START_WAVE', { wave });
  };

  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        color,
        size: 4 + Math.random() * 4,
        life: 30 + Math.random() * 20,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4,
      });
    }
    setParticles((prev: Particle[]) => [...prev, ...newParticles]);
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;
    gameTimeRef.current += delta * 1000;

    if (waveInProgress) {
      spawnTimerRef.current += delta;
      const enemiesPerWave = 5 + wave * 3 + difficultyDirector.enemyCountMod;
      const spawnRate = 1.5 - Math.min(wave * 0.1, 0.8);

      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        addReplayAction('END_WAVE', { wave });

        if (wave >= MAX_WAVES) {
          setGameState('victory');
        } else {
          const bonus: PaintEssence = { red: 10, blue: 10, yellow: 10 };
          setPaint((prev: PaintEssence) => ({
            red: prev.red + bonus.red,
            blue: prev.blue + bonus.blue,
            yellow: prev.yellow + bonus.yellow,
          }));

          const choices = generateRewardChoices(wave);
          setRewardChoices(choices);
          setGameState('rewardSelection');
        }
      }
    }

    setEnemies((prev: Enemy[]) => {
      const updatedEnemies: Enemy[] = [];
      let damage = 0;

      prev.forEach((enemy: Enemy) => {
        if (enemy.pathIndex >= PATH.length - 1) {
          damage += enemy.isElite ? 15 : 10;
          enemiesReachedCoreRef.current = true;
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
          enemy.pathIndex++;
        } else {
          enemy.x += (dx / dist) * enemy.speed * delta;
          enemy.y += (dy / dist) * enemy.speed * delta;
        }

        updatedEnemies.push(enemy);
      });

      if (damage > 0) {
        setCoreHealth((h: number) => Math.max(0, h - damage));
      }

      return updatedEnemies;
    });

    setCoreHealth((h: number) => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    const currentModifiers = activeModifiers;

    setTowers((prev: Tower[]) => {
      const currentTime = Date.now();
      prev.forEach((tower: Tower) => {
        if (currentTime - tower.lastAttack < tower.attackSpeed) return;

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

        const inRange = enemies.filter((e: Enemy) => {
          const dist = Math.sqrt(
            Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
          );
          return dist <= tower.range * CELL_SIZE;
        });

        if (inRange.length > 0) {
          const target = inRange[0];
          tower.lastAttack = currentTime;

          let dmg = tower.damage * tower.level * (1 + currentModifiers.towerDamageMult);
          if (buffedTowerIdRef.current === tower.id) {
            dmg *= 1.8;
          }

          const projSpeed = 350 * (1 + currentModifiers.projectileSpeedMult + activeEventEffectsRef.current.projectileSpeedMult);

          const projectile: Projectile = {
            id: projectileIdRef.current++,
            x: towerCenterX,
            y: towerCenterY,
            targetX: target.x,
            targetY: target.y,
            color: getColorValue(tower.type),
            speed: projSpeed,
            damage: dmg,
            type: tower.type === 'blue' ? 'slow' : tower.type === 'yellow' ? 'pierce' : 'normal',
          };

          setProjectiles((p: Projectile[]) => [...p, projectile]);
        }
      });
      return [...prev];
    });

    setProjectiles((prev: Projectile[]) => {
      const remaining: Projectile[] = [];

      prev.forEach((proj: Projectile) => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          setEnemies((enemies: Enemy[]) => {
            const updated = enemies.map((e: Enemy) => {
              const eDist = Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2));
              const hitRange = proj.type === 'pierce' ? 60 : 25;

              if (eDist < hitRange) {
                createParticles(e.x, e.y, proj.color, 3);
                const newHealth = e.health - proj.damage;

                if (newHealth <= 0) {
                  const colorType: PaintColor = e.colorType === 'mixed' ?
                    (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)] :
                    e.colorType;
                  const baseGain = 8 + Math.floor(e.maxHealth / 15);
                  const bonusMult = 1 + (currentModifiers.bonusPaintMult || 0);
                  const paintReduction = (activeEventEffectsRef.current.paintReductionColor === colorType ||
                                          !activeEventEffectsRef.current.paintReductionColor)
                    ? activeEventEffectsRef.current.paintReductionMult : 0;
                  const paintGain = Math.floor(baseGain * bonusMult * (1 - paintReduction));

                  setPaint((p: PaintEssence) => addPaint(p, colorType, paintGain));
                  setScore((s: number) => s + 15 + Math.floor(e.maxHealth / 10) + (e.isElite ? 25 : 0));
                  setEnemiesKilled((k: number) => k + 1);
                  createParticles(e.x, e.y, e.color, e.isElite ? 12 : 8);
                  return { ...e, health: 0 };
                }

                if (proj.type === 'slow') {
                  return { ...e, health: newHealth, speed: Math.max(15, e.speed * 0.7) };
                }

                if (currentModifiers.splitProjectile && Math.random() < 0.5) {
                  const splitCount = currentModifiers.splitCount;
                  for (let i = 0; i < splitCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const splitTargetX = e.x + Math.cos(angle) * 80;
                    const splitTargetY = e.y + Math.sin(angle) * 80;
                    const splitProj: Projectile = {
                      id: projectileIdRef.current++,
                      x: e.x,
                      y: e.y,
                      targetX: splitTargetX,
                      targetY: splitTargetY,
                      color: proj.color,
                      speed: proj.speed * 0.7,
                      damage: proj.damage * 0.5,
                      type: 'normal',
                    };
                    setProjectiles((p: Projectile[]) => [...p, splitProj]);
                  }
                }

                return { ...e, health: newHealth };
              }
              return e;
            }).filter((e: Enemy) => e.health > 0);

            return updated;
          });
        } else {
          proj.x += (dx / dist) * proj.speed * delta;
          proj.y += (dy / dist) * proj.speed * delta;
          remaining.push(proj);
        }
      });

      return remaining;
    });

    setParticles((prev: Particle[]) => prev.map((p: Particle) => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    })).filter((p: Particle) => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy, activeModifiers, difficultyDirector, waveStartTime, addReplayAction]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    setHasSave(hasCampaignSave());
  }, []);

  useEffect(() => {
    eventBlockedCellsRef.current = getEventBlockedCells(campaignEvents, GRID_SIZE, rngRef.current);
  }, [campaignEvents]);

  useEffect(() => {
    if (campaignEvents.length > 0) {
      const hasTowerBuff = campaignEvents.some((e: import('./types/campaign').CampaignEvent) => e.effect.type === 'towerBuff' && e.remainingWaves > 0);
      if (hasTowerBuff && buffedTowerIdRef.current === null && towers.length > 0) {
        const randomIdx = Math.floor(Math.random() * towers.length);
        buffedTowerIdRef.current = towers[randomIdx].id;
      }
      if (!hasTowerBuff) {
        buffedTowerIdRef.current = null;
      }
    }
  }, [campaignEvents, towers]);

  const handleSelectReward = (reward: Reward) => {
    if (reward.effect.type === 'coreHeal') {
      const healAmount = Math.min(reward.effect.value, 999);
      if (healAmount >= 999) {
        setCoreHealth(200);
      } else {
        setCoreHealth((h: number) => Math.min(h + healAmount, 100));
      }
    }

    const newModifiers = applyRewardEffect(reward, activeModifiers);
    setActiveModifiers(newModifiers);

    const newBuild = updateBuildAfterReward(playerBuild, reward);
    setPlayerBuild(newBuild);

    addReplayAction('SELECT_REWARD', { rewardId: reward.id, rewardName: reward.name, rarity: reward.rarity });

    const newDiff = calculateDifficulty({
      wave: wave,
      coreHealth,
      score,
      enemiesKilled,
      paintTotal: paint.red + paint.blue + paint.yellow,
      towerCount: towers.length,
      lastWaveDurationMs: Date.now() - waveStartTime,
      enemiesReachedCore: enemiesReachedCoreRef.current,
      buildStrengthScore: newBuild.buildTags.length * 0.15,
      previousDifficulty: difficultyDirector,
    });
    setDifficultyDirector(newDiff);

    difficultyHistoryRef.current.push({
      wave: wave + 1,
      enemyCount: 5 + (wave + 1) * 3 + newDiff.enemyCountMod,
      enemyHealth: newDiff.enemyHealthMod,
      enemySpeed: newDiff.enemySpeedMod,
    });

    addReplayAction('DIFFICULTY_CHANGE', {
      enemyCountMod: newDiff.enemyCountMod,
      enemyHealthMod: newDiff.enemyHealthMod,
      enemySpeedMod: newDiff.enemySpeedMod,
    });

    if (shouldTriggerEvent(wave)) {
      const evt = generateEvent(wave);
      if (evt) {
        setCampaignEvents((prev: import('./types/campaign').CampaignEvent[]) => [...prev, evt]);
        addReplayAction('TRIGGER_EVENT', { eventId: evt.id, eventName: evt.name });
      }
    }

    const nextWave = wave + 1;
    setWave(nextWave);

    const campaignState: CampaignState = {
      wave: nextWave,
      coreHealth,
      paint: { ...paint },
      score,
      enemiesKilled,
      seed,
      selectedRewards: newBuild.selectedRewards,
      buildTags: newBuild.buildTags,
      difficultyDirector: newDiff,
      activeEvents: campaignEvents.filter((e: import('./types/campaign').CampaignEvent) => e.remainingWaves > 0),
      eventHistory: campaignEvents,
      difficultyHistory: difficultyHistoryRef.current,
    };
    saveCampaign(campaignState, newBuild, campaignStats);
    setHasSave(true);

    setCampaignEvents((prev: import('./types/campaign').CampaignEvent[]) =>
      prev.map(updateEventRemaining).filter((e: import('./types/campaign').CampaignEvent) => !isEventExpired(e))
    );

    setGameState('playing');
  };

  const startGame = () => {
    rngRef.current = seededRandom(seed);
    gameTimeRef.current = 0;
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    buffedTowerIdRef.current = null;
    enemiesReachedCoreRef.current = false;
    difficultyHistoryRef.current = [];

    setGameState('playing');
    setWave(1);
    setCoreHealth(100);
    setPaint({ red: 50, blue: 50, yellow: 50 });
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setParticles([]);
    setScore(0);
    setEnemiesKilled(0);
    setWaveInProgress(false);
    setSelectedTowerType(null);
    setActiveModifiers(getDefaultModifiers());
    setPlayerBuild(createInitialBuild());
    setDifficultyDirector(createInitialDifficulty());
    setCampaignEvents([]);
    setRewardChoices([]);
    setShowReplay(false);
    setCurrentReplay(null);
    setIsHighScore(false);
    setWaveStartTime(0);

    const newReplay = createReplay(seed);
    setReplay(newReplay);
    const updatedReplay = recordAction(newReplay, {
      time: 0, wave: 1, type: 'GAME_START', payload: { seed },
    });
    setReplay(updatedReplay);
  };

  const loadSavedGame = () => {
    const data = loadCampaign();
    if (!data) return;
    const { campaign, build, stats } = data;
    rngRef.current = seededRandom(campaign.seed);
    gameTimeRef.current = 0;

    setGameState('playing');
    setWave(campaign.wave);
    setCoreHealth(campaign.coreHealth);
    setPaint(campaign.paint);
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setParticles([]);
    setScore(campaign.score);
    setEnemiesKilled(campaign.enemiesKilled);
    setWaveInProgress(false);
    setSelectedTowerType(null);
    setActiveModifiers(getDefaultModifiers());
    setPlayerBuild(build);
    setDifficultyDirector(campaign.difficultyDirector || createInitialDifficulty());
    setCampaignEvents(campaign.activeEvents || []);
    setCampaignStats(stats);
    setRewardChoices([]);
    setShowReplay(false);
    setCurrentReplay(null);
    setIsHighScore(false);
    setWaveStartTime(0);
    difficultyHistoryRef.current = campaign.difficultyHistory || [];

    const newReplay = createReplay(campaign.seed);
    setReplay(newReplay);

    for (const reward of build.selectedRewards) {
      setActiveModifiers((prev: ActiveRewardModifiers) => applyRewardEffect(reward, prev));
    }

    deleteCampaign();
    setHasSave(false);
  };

  const getCampaignState = (): CampaignState => ({
    wave,
    coreHealth,
    paint: { ...paint },
    score,
    enemiesKilled,
    seed,
    selectedRewards: playerBuild.selectedRewards,
    buildTags: playerBuild.buildTags,
    difficultyDirector,
    activeEvents: campaignEvents.filter((e: import('./types/campaign').CampaignEvent) => e.remainingWaves > 0),
    eventHistory: campaignEvents,
    difficultyHistory: difficultyHistoryRef.current,
  });

  const handleGameEnd = (isVictory: boolean) => {
    if (!replay) return;
    addReplayAction('GAME_END', { victory: isVictory, score, wave, coreHealth, enemiesKilled });

    const updatedReplay = finalizeReplay(replay, {
      score,
      wave,
      coreHealth,
      enemiesKilled,
      buildTags: playerBuild.buildTags,
      selectedRewards: playerBuild.selectedRewards.map((r: Reward) => ({ name: r.name, rarity: r.rarity })),
    });
    setCurrentReplay(updatedReplay);

    const newStats = updateStatsAfterGame(
      campaignStats,
      score,
      wave,
      enemiesKilled,
      playerBuild.buildTags,
      playerBuild.buildStats
    );
    setCampaignStats(newStats);
    const newHighScore = score > campaignStats.highScore;
    setIsHighScore(newHighScore);

    deleteCampaign();
    setHasSave(false);
  };

  useEffect(() => {
    if (gameState === 'victory' || gameState === 'gameOver') {
      handleGameEnd(gameState === 'victory');
    }
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const upgradeTower = (towerId: number) => {
    const tower = towers.find((t: Tower) => t.id === towerId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level * 25;
    if (paint[tower.type] >= cost) {
      setPaint((prev: PaintEssence) => ({ ...prev, [tower.type]: prev[tower.type] - cost }));
      setTowers((prev: Tower[]) => prev.map((t: Tower) =>
        t.id === towerId
          ? { ...t, level: t.level + 1, damage: Math.floor(t.damage * 1.4), range: t.range + 0.2 }
          : t
      ));
      addReplayAction('UPGRADE_TOWER', { towerId, newLevel: tower.level + 1 });
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>

      <EventBanner events={campaignEvents} />

      {gameState === 'menu' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
          <div className="transform -rotate-1">
            <h1 className="text-5xl font-bold text-amber-700 mb-2"
                style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
              绘世守护者
            </h1>
            <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender</p>

            <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
              <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center">
                游戏说明
              </h3>
              <ul className="text-amber-700 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">红</span>
                  <span><strong>红色颜料塔</strong>：高伤害单体攻击</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">蓝</span>
                  <span><strong>蓝色颜料塔</strong>：范围减速效果</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">黄</span>
                  <span><strong>黄色颜料塔</strong>：穿透攻击多个敌人</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-amber-200">
                <p className="text-amber-600 text-xs">每波结束后选择奖励，构筑你的流派！</p>
              </div>
            </div>

            <button onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95 mb-3">
              开始绘制冒险！
            </button>

            {hasSave && (
              <div>
                <button onClick={loadSavedGame}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg">
                  继续上次冒险
                </button>
              </div>
            )}

            <div className="mt-4 text-xs text-amber-400">
              历史最高分: {campaignStats.highScore} | 最高波次: {campaignStats.maxWave} | 总场次: {campaignStats.totalGames}
            </div>
          </div>
        </div>
      )}

      {gameState === 'rewardSelection' && (
        <RewardSelection
          rewards={rewardChoices}
          onSelect={handleSelectReward}
          wave={wave}
        />
      )}

      {gameState === 'victory' && currentReplay && (
        <CampaignSummary
          gameOver={false}
          campaign={getCampaignState()}
          build={playerBuild}
          replay={currentReplay}
          isHighScore={isHighScore}
          towerColorCounts={{
            red: towers.filter((t: Tower) => t.type === 'red').length,
            blue: towers.filter((t: Tower) => t.type === 'blue').length,
            yellow: towers.filter((t: Tower) => t.type === 'yellow').length,
          }}
          onRestart={startGame}
          onViewReplay={() => setShowReplay(true)}
          onLoadPrevious={() => { loadSavedGame(); }}
        />
      )}

      {gameState === 'gameOver' && currentReplay && (
        <CampaignSummary
          gameOver={true}
          campaign={getCampaignState()}
          build={playerBuild}
          replay={currentReplay}
          isHighScore={isHighScore}
          towerColorCounts={{
            red: towers.filter((t: Tower) => t.type === 'red').length,
            blue: towers.filter((t: Tower) => t.type === 'blue').length,
            yellow: towers.filter((t: Tower) => t.type === 'yellow').length,
          }}
          onRestart={startGame}
          onViewReplay={() => setShowReplay(true)}
          onLoadPrevious={() => { loadSavedGame(); }}
        />
      )}

      {showReplay && currentReplay && (
        <ReplayViewer
          replay={currentReplay}
          onClose={() => setShowReplay(false)}
        />
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
            <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
              颜料精华
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-red-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-red-600 font-medium">红色</div>
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.min(100, paint.red)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-red-600 w-8 text-right">{paint.red}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-blue-600 font-medium">蓝色</div>
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, paint.blue)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-blue-600 w-8 text-right">{paint.blue}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-yellow-600 font-medium">黄色</div>
                  <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, paint.yellow)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-yellow-600 w-8 text-right">{paint.yellow}</span>
              </div>
            </div>

            <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
              绘制防御塔
            </h3>

            <div className="space-y-2 mb-4">
              {(['red', 'blue', 'yellow'] as const).map((type: PaintColor) => (
                <button
                  key={type}
                  onClick={() => setSelectedTowerType(selectedTowerType === type ? null : type)}
                  className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    selectedTowerType === type
                      ? 'border-gray-800 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${getColorValue(type)}30, white)`,
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl ${getStyleClass(selectedStyle)}`}
                       style={{ backgroundColor: getColorValue(type) }}>
                    {selectedStyle === 'pencil' ? 'P' : selectedStyle === 'watercolor' ? 'W' : 'O'}
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
              笔触风格
            </h3>

            <div className="grid grid-cols-3 gap-1 mb-4">
              {(['pencil', 'watercolor', 'oil'] as const).map((style: 'pencil' | 'watercolor' | 'oil') => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style
                      ? 'bg-amber-400 text-amber-900 shadow-md'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {style === 'pencil' ? '铅笔' : style === 'watercolor' ? '水彩' : '油画'}
                </button>
              ))}
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
              点击画布空白处放置防御塔
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300">
              <div className="text-amber-800 font-bold flex items-center gap-1">
                <span className="text-xl">W</span>
                <span>波次 {wave}/{MAX_WAVES}</span>
              </div>
              <div className="text-red-600 font-bold flex items-center gap-1">
                <span className="text-xl">H</span>
                <span>{coreHealth}</span>
              </div>
              <div className="text-amber-600 font-bold flex items-center gap-1">
                <span className="text-xl">S</span>
                <span>{score}</span>
              </div>
              <div className="text-green-600 font-bold flex items-center gap-1">
                <span className="text-xl">K</span>
                <span>{enemiesKilled}</span>
              </div>
            </div>

            <div className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
                 style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE,
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)' }}>

              <svg className="absolute inset-0 pointer-events-none" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                {PATH_LINES.map((line, i) => (
                  <g key={i}>
                    <line
                      x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                      stroke="#8B4513" strokeWidth="8" strokeLinecap="round" opacity="0.3"
                    />
                    <line
                      x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                      stroke="#D2691E" strokeWidth="4" strokeDasharray="12,8" strokeLinecap="round" opacity="0.7"
                    />
                  </g>
                ))}
              </svg>

              {PATH.map((pos, i) => (
                <div key={i}
                     className="absolute rounded-lg border-2 border-dashed border-amber-400"
                     style={{
                       left: pos.x * CELL_SIZE + 3, top: pos.y * CELL_SIZE + 3,
                       width: CELL_SIZE - 6, height: CELL_SIZE - 6,
                       background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                       opacity: 0.7, boxShadow: 'inset 0 0 10px rgba(180, 83, 9, 0.1)',
                     }} />
              ))}

              <div className="absolute flex items-center justify-center animate-pulse"
                   style={{ left: CORE_POSITION.x * CELL_SIZE, top: CORE_POSITION.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-blue-400 shadow-lg flex items-center justify-center border-4 border-white">
                    <span className="text-xl">C</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full text-xs font-bold text-red-500 shadow">
                    {coreHealth}
                  </div>
                </div>
              </div>

              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: -10, top: PATH[0].y * CELL_SIZE - 5, width: CELL_SIZE + 20, height: CELL_SIZE + 10 }}>
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                  Start
                </div>
              </div>

              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: CORE_POSITION.x * CELL_SIZE - 10, top: CORE_POSITION.y * CELL_SIZE - 25, width: CELL_SIZE + 20 }}>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Core
                </div>
              </div>

              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const canPlace = canPlaceTower(x, y);
                const isBlocked = eventBlockedCellsRef.current.has(`${x},${y}`);

                return (
                  <div key={i}
                       className={`absolute cursor-pointer transition-all ${
                         selectedTowerType && canPlace && !isBlocked
                           ? 'hover:bg-green-300 hover:bg-opacity-40 hover:border-2 hover:border-green-500 hover:border-dashed'
                           : isBlocked ? 'bg-red-500/20 cursor-not-allowed' : ''
                       }`}
                       style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                       onClick={() => placeTower(x, y)}>
                    {isBlocked && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xl">X</div>}
                  </div>
                );
              })}

              {towers.map((tower: Tower) => (
                <div key={tower.id}
                     className="absolute flex flex-col items-center justify-center cursor-pointer group tower-brush"
                     style={{ left: tower.x * CELL_SIZE + 2, top: tower.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                     onClick={() => upgradeTower(tower.id)}>
                  <div className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                       style={{
                         width: tower.range * CELL_SIZE * 2, height: tower.range * CELL_SIZE * 2,
                         left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                         borderColor: getColorValue(tower.type), backgroundColor: getColorValue(tower.type),
                       }} />

                  <div className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
                       style={{
                         background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`,
                         borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' :
                                      tower.style === 'watercolor' ? '50% 50% 50% 50%' : '8px',
                         boxShadow: buffedTowerIdRef.current === tower.id
                           ? `0 0 20px ${getColorValue(tower.type)}, 0 4px 12px ${getColorValue(tower.type)}60`
                           : `0 4px 12px ${getColorValue(tower.type)}60`,
                         border: tower.style === 'pencil' ? '2px dashed #333' : `3px solid ${getColorValue(tower.type)}`,
                       }}>
                    <span className="text-lg text-white font-bold drop-shadow-lg">
                      {buffedTowerIdRef.current === tower.id ? '*' : ''}{tower.level}
                    </span>
                  </div>

                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg border border-gray-600">
                    {tower.level < 5 ? `Up: ${tower.level * 25}` : 'MAX'}
                  </div>
                </div>
              ))}

              {enemies.map((enemy: Enemy) => (
                <div key={enemy.id}
                     className="absolute flex flex-col items-center"
                     style={{ left: enemy.x - 18, top: enemy.y - 24, transition: 'none' }}>
                  <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 border border-gray-300">
                    <div className="h-full transition-all"
                         style={{
                           width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                           background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)`,
                         }} />
                  </div>

                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${enemy.isElite ? 'ring-2 ring-yellow-400' : ''}`}
                       style={{
                         background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
                         boxShadow: enemy.isElite ? `0 0 18px ${enemy.color}80, 0 0 24px gold` : `0 0 12px ${enemy.color}80`,
                         border: '2px dashed rgba(0,0,0,0.2)',
                         animation: 'wobble 0.6s ease-in-out infinite',
                       }}>
                    <span className="text-base drop-shadow">{enemy.isElite ? 'E' : 'M'}</span>
                  </div>
                </div>
              ))}

              {projectiles.map((proj: Projectile) => (
                <div key={proj.id}
                     className="absolute rounded-full"
                     style={{
                       left: proj.x - 6, top: proj.y - 6,
                       width: proj.type === 'pierce' ? 14 : 12, height: proj.type === 'pierce' ? 14 : 12,
                       background: `radial-gradient(circle, white, ${proj.color})`,
                       boxShadow: `0 0 12px ${proj.color}, 0 0 20px ${proj.color}50`,
                       border: proj.type === 'slow' ? '2px dashed white' : 'none',
                     }} />
              ))}

              {particles.map((p: Particle) => (
                <div key={p.id}
                     className="absolute rounded-full pointer-events-none"
                     style={{
                       left: p.x - p.size / 2, top: p.y - p.size / 2,
                       width: p.size, height: p.size,
                       background: `radial-gradient(circle, ${p.color}, ${p.color}80)`,
                       opacity: p.life / 50, filter: 'blur(0.5px)',
                     }} />
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              {!waveInProgress ? (
                <button onClick={startWave}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                  Start Wave {wave}
                </button>
              ) : (
                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                  Fighting... ({enemies.length})
                </div>
              )}

              <button onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                      className="px-4 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg">
                {gameState === 'paused' ? 'Play' : 'Pause'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <BuildPanel build={playerBuild} />

            <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-52">
              <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
                Collection
              </h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['red', 'blue', 'yellow'] as const).map((type: PaintColor) =>
                  (['pencil', 'watercolor', 'oil'] as const).map((style: 'pencil' | 'watercolor' | 'oil') => {
                    const key = `${type}-${style}`;
                    const collected = collectedTowers.has(key);
                    return (
                      <div key={key}
                           className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                             collected ? `${getStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'
                           }`}
                           style={{ backgroundColor: collected ? getColorValue(type) : '#f3f4f6' }}>
                        <span className="text-lg">{collected ? 'C' : '?'}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="text-center text-sm text-amber-600 bg-amber-50 py-2 rounded-lg mb-4">
                {collectedTowers.size} / 9
              </div>

              <h4 className="font-bold text-amber-800 mb-2 text-sm border-b border-dashed border-amber-200 pb-1">
                Stats
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-1.5 bg-red-50 rounded-lg">
                  <span className="text-gray-600">Kills</span>
                  <span className="font-bold text-red-600">{enemiesKilled}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-amber-50 rounded-lg">
                  <span className="text-gray-600">Score</span>
                  <span className="font-bold text-amber-600">{score}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Towers</span>
                  <span className="font-bold text-blue-600">{towers.length}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Difficulty</span>
                  <span className="font-bold text-purple-600">{(difficultyDirector.enemyHealthMod * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        Canvas Defender
      </div>
    </div>
  );
}
