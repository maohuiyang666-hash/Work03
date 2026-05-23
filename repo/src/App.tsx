import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Enemy, Tower, Projectile, Particle, PaintEssence, TowerType } from './types/game';
import { CampaignState, PlayerBuild, CampaignStats, DifficultyState } from './types/campaign';
import { Reward } from './types/reward';
import { ReplayData } from './types/replay';
import { ActiveEventState, updateEventState } from './logic/campaignEventSystem';
import { INITIAL_DIFFICULTY, updateDifficulty } from './logic/difficultyDirector';
import { updateBuild } from './logic/buildSystem';
import { getRandomRewards } from './logic/rewardSystem';
import { saveCampaign, loadCampaign, clearCampaign } from './logic/saveSystem';
import { ReplayRecorder } from './logic/replaySystem';

import { RewardSelection } from './components/RewardSelection';
import { BuildPanel } from './components/BuildPanel';
import { CampaignSummary } from './components/CampaignSummary';
import { ReplayViewer } from './components/ReplayViewer';
import { EventBanner } from './components/EventBanner';

// 游戏常量
const GRID_SIZE = 10;
const CELL_SIZE = 50;

const PATH: Position[] = [
  { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 2 }, { x: 5, y: 2 },
  { x: 5, y: 6 }, { x: 7, y: 6 }, { x: 7, y: 4 }, { x: 9, y: 4 },
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

export default function CanvasDefender() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(100);
  const [paint, setPaint] = useState<PaintEssence>({ red: 50, blue: 50, yellow: 50 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'pencil' | 'watercolor' | 'oil'>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());

  // Campaign State
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({ highestScore: 0, highestWave: 0, bestBuild: [] });
  const [playerBuild, setPlayerBuild] = useState<PlayerBuild>({ selectedRewards: [], buildTags: [], buildStats: { redPower: 0, blueControl: 0, yellowSpeed: 0, economy: 0, defense: 0 } });
  const [difficulty, setDifficulty] = useState<DifficultyState>(INITIAL_DIFFICULTY);
  const [activeEvent, setActiveEvent] = useState<ActiveEventState>({ event: null, wavesRemaining: 0 });
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([]);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [randomSeed, setRandomSeed] = useState(Date.now());

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const replayRecorderRef = useRef<ReplayRecorder | null>(null);
  const waveStartTimeRef = useRef(0);
  const enemiesReachedCoreRef = useRef(false);

  useEffect(() => {
    const saved = loadCampaign();
    if (saved) {
      setCampaignStats(saved.stats);
    }
  }, []);

  const saveCurrentCampaign = useCallback(() => {
    saveCampaign({
      version: 1,
      savedAt: Date.now(),
      campaign: {
        currentWave: wave,
        coreHealth,
        paint,
        score,
        enemiesKilled,
        randomSeed,
        difficulty
      },
      build: playerBuild,
      stats: campaignStats
    });
  }, [wave, coreHealth, paint, score, enemiesKilled, randomSeed, difficulty, playerBuild, campaignStats]);

  const getColorValue = (type: TowerType): string => {
    const colors = { red: '#e74c3c', blue: '#3498db', yellow: '#f39c12' };
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
    if (activeEvent.event?.id === 'map_crack') {
      const isCrack = Math.sin(x * 13.37 + y * 42.1) > 0.7;
      if (isCrack) return false;
    }
    const isOnPath = PATH.some(p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    const hasTower = towers.some(t => t.x === x && t.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  };

  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!canPlaceTower(x, y)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    if (paint.red < cost.red || paint.blue < cost.blue || paint.yellow < cost.yellow) return;

    const styleMultiplier = selectedStyle === 'pencil' ? 0.8 : selectedStyle === 'watercolor' ? 1.0 : 1.2;
    const newTower: Tower = {
      id: towerIdRef.current++,
      x,
      y,
      type: selectedTowerType,
      level: 1,
      range: 2.5,
      damage: Math.floor(15 * styleMultiplier),
      attackSpeed: selectedStyle === 'watercolor' ? 1200 : selectedStyle === 'pencil' ? 800 : 1500,
      lastAttack: 0,
      style: selectedStyle,
    };

    setTowers(prev => [...prev, newTower]);
    setPaint(prev => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers(prev => new Set(prev).add(towerKey));
    }

    replayRecorderRef.current?.record(wave, 'PLACE_TOWER', { x, y, type: selectedTowerType, style: selectedStyle });
  };

  const spawnEnemy = useCallback(() => {
    const isElite = Math.random() < difficulty.eliteProb;
    const isMixed = Math.random() < difficulty.mixedProb;
    
    const colorTypes: Array<'red' | 'blue' | 'yellow' | 'mixed'> = ['red', 'blue', 'yellow'];
    if (isMixed) colorTypes.push('mixed');
    const type = isMixed ? 'mixed' : colorTypes[Math.floor(Math.random() * 3)];
    
    const colors = {
      red: '#c0392b',
      blue: '#2980b9',
      yellow: '#d68910',
      mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(Math.random() * 3)],
    };

    let hpMult = difficulty.healthMultiplier;
    if (activeEvent.event?.id === 'dark_erosion') hpMult *= 1.3;
    if (isElite) hpMult *= 2;

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: Math.floor((40 + wave * 15) * hpMult),
      maxHealth: Math.floor((40 + wave * 15) * hpMult),
      speed: (35 + Math.min(wave * 3, 25)) * difficulty.speedMultiplier * (isElite ? 1.2 : 1),
      color: colors[type],
      colorType: type,
      pathIndex: 0,
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [wave, difficulty, activeEvent]);

  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    waveStartTimeRef.current = Date.now();
    enemiesReachedCoreRef.current = false;
    
    const newEventState = updateEventState(activeEvent, wave, randomSeed);
    setActiveEvent(newEventState);
    
    if (newEventState.event) {
      replayRecorderRef.current?.record(wave, 'EVENT_TRIGGER', newEventState.event.id);
    }
    replayRecorderRef.current?.record(wave, 'START_WAVE', null);
    
    saveCurrentCampaign();
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
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleGameOver = useCallback((victory: boolean) => {
    setGameState(victory ? 'victory' : 'gameOver');
    
    const newStats = {
      highestScore: Math.max(campaignStats.highestScore, score),
      highestWave: Math.max(campaignStats.highestWave, wave),
      bestBuild: score > campaignStats.highestScore ? playerBuild.buildTags : campaignStats.bestBuild
    };
    setCampaignStats(newStats);
    
    if (replayRecorderRef.current) {
      const finalStats = { wave, score, coreHealth, enemiesKilled, playerBuild };
      setReplayData(replayRecorderRef.current.getReplay(finalStats));
    }
    
    saveCampaign({
      version: 1,
      savedAt: Date.now(),
      campaign: { currentWave: wave, coreHealth, paint, score, enemiesKilled, randomSeed, difficulty },
      build: playerBuild,
      stats: newStats
    });
  }, [campaignStats, score, wave, playerBuild, coreHealth, enemiesKilled, paint, randomSeed, difficulty]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    if (waveInProgress) {
      spawnTimerRef.current += delta;
      const enemiesPerWave = Math.floor((5 + wave * 3) * difficulty.countMultiplier);
      const spawnRate = Math.max(0.2, (1.5 - Math.min(wave * 0.1, 0.8)) / difficulty.speedMultiplier);
      
      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        const duration = (Date.now() - waveStartTimeRef.current) / 1000;
        
        const newDiff = updateDifficulty(
          difficulty,
          wave,
          coreHealth,
          duration,
          enemiesReachedCoreRef.current,
          playerBuild.selectedRewards.length
        );
        setDifficulty(newDiff);
        replayRecorderRef.current?.record(wave, 'DIFFICULTY_CHANGE', newDiff);

        if (wave >= 10) {
          handleGameOver(true);
        } else {
          const rewards = getRandomRewards(3, playerBuild.selectedRewards, randomSeed + wave);
          setCurrentRewards(rewards);
          setGameState('rewardSelection');
        }
      }
    }

    setEnemies(prev => {
      const updatedEnemies: Enemy[] = [];
      let damage = 0;

      prev.forEach(enemy => {
        if (enemy.pathIndex >= PATH.length - 1) {
          damage += 10;
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
        setCoreHealth(h => {
          const newH = Math.max(0, h - damage);
          if (newH === 0) handleGameOver(false);
          return newH;
        });
      }

      return updatedEnemies;
    });

    setTowers(prev => {
      const currentTime = Date.now();
      prev.forEach(tower => {
        let speed = tower.attackSpeed;
        playerBuild.selectedRewards.forEach(r => {
          if (r.effect?.attackSpeedMultiplier) speed *= r.effect.attackSpeedMultiplier;
        });

        if (currentTime - tower.lastAttack < speed) return;

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

        let range = tower.range;
        playerBuild.selectedRewards.forEach(r => {
          if (r.effect?.rangeMultiplier) range *= r.effect.rangeMultiplier;
        });

        const inRange = enemies.filter(e => {
          const dist = Math.sqrt(
            Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
          );
          return dist <= range * CELL_SIZE;
        });

        if (inRange.length > 0) {
          const target = inRange[0];
          tower.lastAttack = currentTime;

          let dmg = tower.damage * tower.level;
          if (playerBuild.buildStats.redPower && tower.type === 'red') dmg *= 1 + (playerBuild.buildStats.redPower * 0.4);
          playerBuild.selectedRewards.forEach(r => {
            if (r.effect?.damageMultiplier) dmg *= r.effect.damageMultiplier;
            if (tower.type === 'red' && r.effect?.redDamageMultiplier) dmg *= r.effect.redDamageMultiplier;
          });
          if (activeEvent.event?.id === 'inspiration_burst' && Math.random() < 0.2) dmg *= 2; 

          let pSpeed = 350;
          if (activeEvent.event?.id === 'paint_storm') pSpeed *= 1.5;
          playerBuild.selectedRewards.forEach(r => {
            if (r.effect?.projSpeedMultiplier) pSpeed *= r.effect.projSpeedMultiplier;
          });

          const projectile: Projectile = {
            id: projectileIdRef.current++,
            x: towerCenterX,
            y: towerCenterY,
            targetX: target.x,
            targetY: target.y,
            color: getColorValue(tower.type),
            speed: pSpeed,
            damage: dmg,
            type: tower.type === 'blue' ? 'slow' : tower.type === 'yellow' ? 'pierce' : 'normal',
          };

          setProjectiles(p => [...p, projectile]);
        }
      });
      return [...prev];
    });

    setProjectiles(prev => {
      const remaining: Projectile[] = [];
      
      prev.forEach(proj => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          setEnemies(enemies => {
            const updated = enemies.map(e => {
              const eDist = Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2));
              let hitRange = proj.type === 'pierce' ? 60 : 25;
              
              if (proj.type === 'pierce' && playerBuild.buildStats.yellowSpeed) {
                hitRange *= 1.5;
              }

              if (eDist < hitRange) {
                createParticles(e.x, e.y, proj.color, 3);
                const newHealth = e.health - proj.damage;
                
                if (newHealth <= 0) {
                  let paintGain = 8 + Math.floor(e.maxHealth / 15);
                  playerBuild.selectedRewards.forEach(r => {
                    if (r.effect?.paintDropMultiplier) paintGain *= r.effect.paintDropMultiplier;
                  });
                  if (activeEvent.event?.id === 'paint_drought') paintGain *= 0.5;

                  const colorType = e.colorType === 'mixed' ? 
                    (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)] : 
                    e.colorType;
                  
                  setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + Math.floor(paintGain) }));
                  setScore(s => s + 15 + Math.floor(e.maxHealth / 10));
                  setEnemiesKilled(k => k + 1);
                  createParticles(e.x, e.y, e.color, 8);
                  return { ...e, health: 0 };
                }

                if (proj.type === 'slow') {
                  let slowMult = 0.7;
                  if (playerBuild.buildStats.blueControl) slowMult = 0.5;
                  return { ...e, health: newHealth, speed: Math.max(15, e.speed * slowMult) };
                }
                
                return { ...e, health: newHealth };
              }
              return e;
            }).filter(e => e.health > 0);
            
            return updated;
          });
          
          let splitChance = 0;
          playerBuild.selectedRewards.forEach(r => {
            if (r.effect?.splitChance) splitChance += r.effect.splitChance;
          });
          if (Math.random() < splitChance && proj.damage > 5) {
             setProjectiles(p => [...p, {
                ...proj,
                id: projectileIdRef.current++,
                targetX: proj.targetX + (Math.random() - 0.5) * 100,
                targetY: proj.targetY + (Math.random() - 0.5) * 100,
                damage: proj.damage * 0.5
             }]);
          }
        } else {
          proj.x += (dx / dist) * proj.speed * delta;
          proj.y += (dy / dist) * proj.speed * delta;
          remaining.push(proj);
        }
      });

      return remaining;
    });

    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    })).filter(p => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy, difficulty, activeEvent, playerBuild, randomSeed, coreHealth, handleGameOver]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  const handleSelectReward = (reward: Reward) => {
    const newBuild = updateBuild(playerBuild, reward);
    setPlayerBuild(newBuild);
    
    if (reward.effect?.heal) {
      setCoreHealth(h => Math.min(100 + (reward.effect?.maxHealthUp || 0), h + reward.effect.heal));
    }

    replayRecorderRef.current?.record(wave, 'SELECT_REWARD', reward.id);
    
    setWave(w => w + 1);
    setGameState('playing');
    saveCurrentCampaign();
  };

  const startGame = () => {
    const seed = Date.now();
    setRandomSeed(seed);
    replayRecorderRef.current = new ReplayRecorder(seed);
    
    const saved = loadCampaign();
    if (saved && saved.campaign.currentWave > 1 && saved.campaign.currentWave < 10 && saved.campaign.coreHealth > 0) {
       if (window.confirm("发现存在未完成的战役存档，是否继续？")) {
         setWave(saved.campaign.currentWave);
         setCoreHealth(saved.campaign.coreHealth);
         setPaint(saved.campaign.paint);
         setScore(saved.campaign.score);
         setEnemiesKilled(saved.campaign.enemiesKilled);
         setDifficulty(saved.campaign.difficulty);
         setPlayerBuild(saved.build);
         setCampaignStats(saved.stats);
         setRandomSeed(saved.campaign.randomSeed);
         
         setGameState('playing');
         return;
       }
    }

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
    setDifficulty(INITIAL_DIFFICULTY);
    setPlayerBuild({ selectedRewards: [], buildTags: [], buildStats: { redPower: 0, blueControl: 0, yellowSpeed: 0, economy: 0, defense: 0 } });
    setActiveEvent({ event: null, wavesRemaining: 0 });
    
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    clearCampaign();
  };

  const upgradeTower = (towerId: number) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level * 25;
    if (paint[tower.type] >= cost) {
      setPaint(prev => ({ ...prev, [tower.type]: prev[tower.type] - cost }));
      setTowers(prev => prev.map(t =>
        t.id === towerId
          ? { ...t, level: t.level + 1, damage: Math.floor(t.damage * 1.4), range: t.range + 0.2 }
          : t
      ));
      replayRecorderRef.current?.record(wave, 'UPGRADE_TOWER', { id: towerId, level: tower.level + 1 });
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4 relative overflow-hidden"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
      
      <EventBanner eventState={activeEvent} />

      {gameState === 'menu' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1 z-10">
          <div className="transform -rotate-1">
            <h1 className="text-5xl font-bold text-amber-700 mb-2" 
                style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
              🎨 绘世守护者
            </h1>
            <p className="text-amber-600 mb-6 text-lg italic">Roguelike 战役版</p>
            
            <button
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              ✏️ 开始绘制冒险！
            </button>
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused' || gameState === 'rewardSelection') && (
        <div className="flex flex-wrap gap-4 justify-center relative z-10">
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
              <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
                🎨 颜料精华
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
                ✏️ 绘制防御塔
              </h3>
              
              <div className="space-y-2 mb-4">
                {(['red', 'blue', 'yellow'] as const).map(type => (
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
                {(['pencil', 'watercolor', 'oil'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      selectedStyle === style
                        ? 'bg-amber-400 text-amber-900 shadow-md'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {style === 'pencil' ? '✏️铅笔' : style === 'watercolor' ? '💧水彩' : '🖌️油画'}
                  </button>
                ))}
              </div>
            </div>
            
            <BuildPanel build={playerBuild} />
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300">
              <div className="text-amber-800 font-bold flex items-center gap-1">
                <span className="text-xl">🌊</span>
                <span>波次 {wave}/10</span>
              </div>
              <div className="text-red-600 font-bold flex items-center gap-1">
                <span className="text-xl">❤️</span>
                <span>{coreHealth}</span>
              </div>
              <div className="text-amber-600 font-bold flex items-center gap-1">
                <span className="text-xl">⭐</span>
                <span>{score}</span>
              </div>
              <div className="text-green-600 font-bold flex items-center gap-1">
                <span className="text-xl">💀</span>
                <span>{enemiesKilled}</span>
              </div>
            </div>

            <div className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
                 style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE,
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)' }}>
              
              <svg className="absolute inset-0 pointer-events-none" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                {PATH_LINES.map((line, i) => (
                  <g key={i}>
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#8B4513" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#D2691E" strokeWidth="4" strokeDasharray="12,8" strokeLinecap="round" opacity="0.7" />
                  </g>
                ))}
              </svg>

              {PATH.map((pos, i) => (
                <div key={i}
                     className="absolute rounded-lg border-2 border-dashed border-amber-400"
                     style={{ left: pos.x * CELL_SIZE + 3, top: pos.y * CELL_SIZE + 3, width: CELL_SIZE - 6, height: CELL_SIZE - 6, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', opacity: 0.7 }} />
              ))}

              <div className="absolute flex items-center justify-center animate-pulse"
                   style={{ left: CORE_POSITION.x * CELL_SIZE, top: CORE_POSITION.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-blue-400 shadow-lg flex items-center justify-center border-4 border-white">
                    <span className="text-xl">💎</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full text-xs font-bold text-red-500 shadow">
                    {coreHealth}
                  </div>
                </div>
              </div>

              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const canPlace = canPlaceTower(x, y);
                
                return (
                  <div key={i}
                       className={`absolute cursor-pointer transition-all ${
                         selectedTowerType && canPlace
                           ? 'hover:bg-green-300 hover:bg-opacity-40 hover:border-2 hover:border-green-500 hover:border-dashed'
                           : ''
                       }`}
                       style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                       onClick={() => placeTower(x, y)}>
                  </div>
                );
              })}

              {towers.map(tower => (
                <div key={tower.id} className="absolute flex flex-col items-center justify-center cursor-pointer group tower-brush"
                     style={{ left: tower.x * CELL_SIZE + 2, top: tower.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                     onClick={() => upgradeTower(tower.id)}>
                  <div className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                       style={{ width: tower.range * CELL_SIZE * 2, height: tower.range * CELL_SIZE * 2, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', borderColor: getColorValue(tower.type), backgroundColor: getColorValue(tower.type) }} />
                  
                  <div className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
                       style={{ background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`, borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : tower.style === 'watercolor' ? '50% 50% 50% 50%' : '8px', border: `3px solid ${getColorValue(tower.type)}` }}>
                    <span className="text-lg text-white font-bold drop-shadow-lg">{tower.level}</span>
                  </div>
                </div>
              ))}

              {enemies.map(enemy => (
                <div key={enemy.id} className="absolute flex flex-col items-center" style={{ left: enemy.x - 18, top: enemy.y - 24 }}>
                  <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 border border-gray-300">
                    <div className="h-full transition-all" style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%`, background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)` }} />
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`, border: '2px dashed rgba(0,0,0,0.2)' }}>
                    <span className="text-base drop-shadow">🎨</span>
                  </div>
                </div>
              ))}

              {projectiles.map(proj => (
                <div key={proj.id} className="absolute rounded-full" style={{ left: proj.x - 6, top: proj.y - 6, width: 12, height: 12, background: `radial-gradient(circle, white, ${proj.color})` }} />
              ))}

              {particles.map(p => (
                <div key={p.id} className="absolute rounded-full pointer-events-none" style={{ left: p.x - p.size / 2, top: p.y - p.size / 2, width: p.size, height: p.size, background: p.color, opacity: p.life / 50 }} />
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              {!waveInProgress ? (
                <button onClick={startWave}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg">
                  🚀 开始第 {wave} 波
                </button>
              ) : (
                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                  ⚔️ 战斗中... ({enemies.length}只颜料怪)
                </div>
              )}
              
              <button onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                      className="px-4 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg">
                {gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'rewardSelection' && (
        <RewardSelection rewards={currentRewards} onSelect={handleSelectReward} />
      )}

      {(gameState === 'gameOver' || gameState === 'victory') && (
        <CampaignSummary 
          state={{ currentWave: wave, coreHealth, paint, score, enemiesKilled, randomSeed, difficulty }}
          build={playerBuild}
          stats={campaignStats}
          isVictory={gameState === 'victory'}
          onRestart={startGame}
          onViewReplay={replayData ? () => setGameState('replay') : undefined}
        />
      )}

      {gameState === 'replay' && replayData && (
        <ReplayViewer replay={replayData} onClose={() => setGameState('gameOver')} />
      )}
    </div>
  );
}