import { useState, useRef, useCallback, useEffect } from 'react';
import { GameEngineState, PaintEssence, Enemy, Tower, Projectile, Particle, TowerType, TowerStyle } from '../types';
import { WAVE_MAX, TOWER_COSTS } from '../config';
import {
  canPlaceTower,
  createTower,
  upgradeTower as upgradeTowerLogic,
  towersAttack,
  spawnEnemy as spawnEnemyLogic,
  moveEnemies,
  resolveProjectileHits,
  updateParticles,
  calculateWaveReward,
  checkGameOver,
  checkVictory,
} from '../logic';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameEngineState['gameState']>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(100);
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

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const spawnEnemy = useCallback(() => {
    const newEnemy = spawnEnemyLogic(enemyIdRef.current++, wave);
    setEnemies((prev: Enemy[]) => [...prev, newEnemy]);
  }, [wave]);

  const startGame = () => {
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
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  };

  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  };

  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!canPlaceTower(x, y, towers)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    if (paint.red < cost.red || paint.blue < cost.blue || paint.yellow < cost.yellow) return;

    const newTower = createTower(towerIdRef.current++, x, y, selectedTowerType, selectedStyle);

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
  };

  const upgradeTower = (towerId: number) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower) return;
    
    const result = upgradeTowerLogic(tower, paint);
    if (result.success) {
      setTowers((prev: Tower[]) => prev.map((t: Tower) => (t.id === towerId ? result.tower : t)));
      setPaint(result.paint);
    }
  };

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
      const enemiesPerWave = 5 + wave * 3;
      const spawnRate = 1.5 - Math.min(wave * 0.1, 0.8);
      
      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        if (checkVictory(wave, WAVE_MAX)) {
          setGameState('victory');
        } else {
          const bonus = calculateWaveReward();
          setPaint((prev: PaintEssence) => ({
            red: prev.red + bonus.red,
            blue: prev.blue + bonus.blue,
            yellow: prev.yellow + bonus.yellow,
          }));
          setWave((w: number) => w + 1);
        }
      }
    }

    setEnemies((prevEnemies: Enemy[]) => {
      const { updatedEnemies, damageToCore } = moveEnemies(prevEnemies, delta);
      if (damageToCore > 0) {
        setCoreHealth((h: number) => Math.max(0, h - damageToCore));
      }
      return updatedEnemies;
    });

    setCoreHealth((h: number) => {
      if (checkGameOver(h)) {
        setGameState('gameOver');
      }
      return h;
    });

    setTowers((prevTowers: Tower[]) => {
      const { updatedTowers, newProjectiles, nextProjectileId } = towersAttack(
        prevTowers,
        enemies,
        now,
        projectileIdRef.current
      );
      projectileIdRef.current = nextProjectileId;
      if (newProjectiles.length > 0) {
        setProjectiles((p: Projectile[]) => [...p, ...newProjectiles]);
      }
      return updatedTowers;
    });

    setProjectiles((prevProjectiles: Projectile[]) => {
      const {
        remainingProjectiles,
        updatedEnemies,
        newParticles,
        paintGain,
        scoreGain,
        enemiesKilled: killed,
        nextParticleId,
      } = resolveProjectileHits(prevProjectiles, enemies, delta, particleIdRef.current);

      particleIdRef.current = nextParticleId;

      if (scoreGain > 0 || paintGain.red > 0 || paintGain.blue > 0 || paintGain.yellow > 0) {
        setEnemies(updatedEnemies);
        setPaint((p: PaintEssence) => ({
          red: p.red + paintGain.red,
          blue: p.blue + paintGain.blue,
          yellow: p.yellow + paintGain.yellow,
        }));
        setScore((s: number) => s + scoreGain);
        setEnemiesKilled((k: number) => k + killed);
      }
      
      if (newParticles.length > 0) {
        setParticles((prev: Particle[]) => [...prev, ...newParticles]);
      }

      return remainingProjectiles;
    });

    setParticles((prev: Particle[]) => updateParticles(prev));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return {
    state: {
      gameState,
      wave,
      coreHealth,
      paint,
      enemies,
      towers,
      projectiles,
      particles,
      selectedTowerType,
      selectedStyle,
      score,
      enemiesKilled,
      waveInProgress,
      collectedTowers,
    },
    actions: {
      startGame,
      startWave,
      placeTower,
      upgradeTower,
      setSelectedTowerType,
      setSelectedStyle,
      setGameState,
    },
  };
};
