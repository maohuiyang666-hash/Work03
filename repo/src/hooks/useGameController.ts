import { useState, useEffect, useCallback, useRef } from 'react';
import type { Enemy, Tower, Projectile, Particle, TowerType, TowerStyle } from '../types/entities';
import type { GameState, PaintEssence } from '../types/game';
import { INITIAL_PAINT, INITIAL_CORE_HEALTH, WAVE_BONUS, MAX_WAVES, CELL_SIZE, COLOR_VALUES } from '../config/gameConfig';
import { TOWER_COSTS, STYLE_MULTIPLIERS } from '../config/towerConfig';
import { canPlaceTower, createTower, upgradeTower, canAffordTower, deductTowerCost } from '../logic/towerSystem';
import { spawnEnemy, moveEnemies } from '../logic/enemySystem';
import { createProjectile, processProjectiles, updateParticles } from '../logic/projectileSystem';
import { calculateWaveReward, isVictory, isGameOver, getEnemiesPerWave, getSpawnRate } from '../logic/waveSystem';

export const useGameController = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(INITIAL_CORE_HEALTH);
  const [paint, setPaint] = useState<PaintEssence>(INITIAL_PAINT);
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

  const startGame = useCallback(() => {
    setGameState('playing');
    setWave(1);
    setCoreHealth(INITIAL_CORE_HEALTH);
    setPaint(INITIAL_PAINT);
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
  }, []);

  const placeTower = useCallback((x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!canPlaceTower(x, y, towers)) return;

    if (!canAffordTower(selectedTowerType, paint)) return;

    const newTower = createTower(x, y, selectedTowerType, selectedStyle, towerIdRef);
    setTowers(prev => [...prev, newTower]);
    setPaint(prev => deductTowerCost(selectedTowerType, prev));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers(prev => new Set(prev).add(towerKey));
    }
  }, [selectedTowerType, gameState, towers, paint, selectedStyle, collectedTowers]);

  const handleUpgradeTower = useCallback((towerId: number) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower) return;
    const result = upgradeTower(tower, paint);
    if (result) {
      setTowers(prev => prev.map(t => t.id === towerId ? result.tower : t));
      setPaint(result.paint);
    }
  }, [towers, paint]);

  const startWave = useCallback(() => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  }, [waveInProgress]);

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
      const enemiesPerWave = getEnemiesPerWave(wave);
      const spawnRate = getSpawnRate(wave);

      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        const newEnemy = spawnEnemy(wave, enemyIdRef);
        setEnemies(prev => [...prev, newEnemy]);
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        if (wave >= MAX_WAVES) {
          setGameState('victory');
        } else {
          setPaint(prev => ({
            red: prev.red + WAVE_BONUS.red,
            blue: prev.blue + WAVE_BONUS.blue,
            yellow: prev.yellow + WAVE_BONUS.yellow,
          }));
        }
      }
    }

    setEnemies(prev => {
      const { enemies: moved, damage } = moveEnemies(prev, delta);
      if (damage > 0) {
        setCoreHealth(h => Math.max(0, h - damage));
      }
      return moved;
    });

    setCoreHealth(h => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    setTowers(prev => {
      const currentTime = Date.now();
      const newProjectiles: Projectile[] = [];

      prev.forEach(tower => {
        if (currentTime - tower.lastAttack < tower.attackSpeed) return;

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

        const inRange = enemies.filter(e => {
          const dist = Math.sqrt(
            Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
          );
          return dist <= tower.range * CELL_SIZE;
        });

        if (inRange.length > 0) {
          const target = inRange[0];
          tower.lastAttack = currentTime;
          newProjectiles.push(createProjectile(tower, target, projectileIdRef));
        }
      });

      if (newProjectiles.length > 0) {
        setProjectiles(p => [...p, ...newProjectiles]);
      }

      return [...prev];
    });

    setProjectiles(prev => {
      const result = processProjectiles(prev, enemies, delta, particleIdRef);
      setEnemies(result.enemies);
      setPaint(p => ({
        red: p.red + result.paintGain.red,
        blue: p.blue + result.paintGain.blue,
        yellow: p.yellow + result.paintGain.yellow,
      }));
      setScore(s => s + result.scoreGain);
      setEnemiesKilled(k => k + result.killCount);
      setParticles(p => [...p, ...result.particles]);
      return result.projectiles;
    });

    setParticles(prev => updateParticles(prev));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, waveInProgress, wave, enemies]);

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
    gameState,
    setGameState,
    wave,
    setWave,
    coreHealth,
    paint,
    enemies,
    towers,
    projectiles,
    particles,
    selectedTowerType,
    setSelectedTowerType,
    selectedStyle,
    setSelectedStyle,
    score,
    enemiesKilled,
    waveInProgress,
    collectedTowers,
    startGame,
    placeTower,
    upgradeTower: handleUpgradeTower,
    startWave,
  };
};
