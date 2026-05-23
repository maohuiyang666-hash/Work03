import { useState, useEffect, useCallback, useRef } from 'react';
import type { Enemy, Tower, Projectile, Particle } from '../types/entities';
import type { TowerType, TowerStyle, GameStatus, PaintEssence } from '../types/game';
import { GRID_SIZE, PATH, CORE_POSITION, WAVE_BONUS } from '../config/gameConfig';
import {
  canPlaceTower,
  canAffordTower,
  createTower,
  upgradeTower,
  getTowerColorValue,
  getTowerStyleClass,
  processTowerAttacks,
} from '../logic/towerSystem';
import {
  createEnemy,
  moveEnemies,
  updateParticles,
  getColorTypeForWave,
  resetEnemyIdCounter,
} from '../logic/enemySystem';
import { resolveProjectileHits, resetProjectileIdCounter } from '../logic/projectileSystem';
import { resetTowerIdCounter } from '../logic/towerSystem';
import { getWaveConfig, MAX_WAVES } from '../config/gameConfig';
import { getUpgradeCost } from '../logic/resourceSystem';

interface GameControllerState {
  gameState: GameStatus;
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

const INITIAL_PAINT: PaintEssence = { red: 50, blue: 50, yellow: 50 };
const TOWER_COST = 30;

export const useGameController = () => {
  const [state, setState] = useState<GameControllerState>({
    gameState: 'menu',
    wave: 1,
    coreHealth: 100,
    paint: { ...INITIAL_PAINT },
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    selectedTowerType: null,
    selectedStyle: 'pencil',
    score: 0,
    enemiesKilled: 0,
    waveInProgress: false,
    collectedTowers: new Set(),
  });

  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const enemiesSpawnedRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const projectileIdRef = useRef<number>(0);

  const getNextProjectileId = useCallback((): number => {
    return projectileIdRef.current++;
  }, []);

  const getNextParticleId = useCallback((): number => {
    return particleIdRef.current++;
  }, []);

  const startGame = useCallback(() => {
    resetEnemyIdCounter();
    resetTowerIdCounter();
    resetProjectileIdCounter();
    
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;

    setState({
      gameState: 'playing',
      wave: 1,
      coreHealth: 100,
      paint: { ...INITIAL_PAINT },
      enemies: [],
      towers: [],
      projectiles: [],
      particles: [],
      selectedTowerType: null,
      selectedStyle: 'pencil',
      score: 0,
      enemiesKilled: 0,
      waveInProgress: false,
      collectedTowers: new Set(),
    });
  }, []);

  const selectTowerType = useCallback((type: TowerType | null) => {
    setState((prev: GameControllerState) => ({ ...prev, selectedTowerType: type }));
  }, []);

  const selectStyle = useCallback((style: TowerStyle) => {
    setState((prev: GameControllerState) => ({ ...prev, selectedStyle: style }));
  }, []);

  const placeTower = useCallback((x: number, y: number) => {
    setState((prev: GameControllerState) => {
      if (prev.gameState !== 'playing' || !prev.selectedTowerType) {
        return prev;
      }

      if (!canPlaceTower(x, y, prev.towers)) {
        return prev;
      }

      if (!canAffordTower(prev.selectedTowerType, prev.paint)) {
        return prev;
      }

      const newTower = createTower(x, y, prev.selectedTowerType, prev.selectedStyle);

      const newPaint: PaintEssence = { ...prev.paint };
      newPaint[prev.selectedTowerType] = newPaint[prev.selectedTowerType] - TOWER_COST;

      const towerKey = `${prev.selectedTowerType}-${prev.selectedStyle}`;
      const newCollected = new Set(prev.collectedTowers);
      if (!newCollected.has(towerKey)) {
        newCollected.add(towerKey);
      }

      return {
        ...prev,
        towers: [...prev.towers, newTower],
        paint: newPaint,
        collectedTowers: newCollected,
      };
    });
  }, []);

  const handleUpgradeTower = useCallback((towerId: number) => {
    setState((prev: GameControllerState) => {
      const tower = prev.towers.find((t: Tower) => t.id === towerId);
      if (!tower || tower.level >= 5) return prev;

      const cost = getUpgradeCost(tower.level);
      if (prev.paint[tower.type] < cost) return prev;

      const result = upgradeTower(tower, prev.paint);
      if (!result) return prev;

      return {
        ...prev,
        towers: prev.towers.map((t: Tower) => t.id === towerId ? result.tower : t),
        paint: result.paint,
      };
    });
  }, []);

  const startWave = useCallback(() => {
    setState((prev: GameControllerState) => {
      if (prev.waveInProgress) return prev;
      enemiesSpawnedRef.current = 0;
      spawnTimerRef.current = 0;
      return { ...prev, waveInProgress: true };
    });
  }, []);

  const skipWave = useCallback(() => {
    setState((prev: GameControllerState) => {
      if (prev.waveInProgress || prev.enemies.length > 0 || prev.wave >= MAX_WAVES) {
        return prev;
      }
      return { ...prev, wave: prev.wave + 1 };
    });
  }, []);

  const togglePause = useCallback(() => {
    setState((prev: GameControllerState) => ({
      ...prev,
      gameState: prev.gameState === 'paused' ? 'playing' : 'paused',
    }));
  }, []);

  const gameLoop = useCallback(() => {
    setState((prev: GameControllerState) => {
      if (prev.gameState !== 'playing') {
        return prev;
      }

      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      let newState: GameControllerState = { ...prev };
      let newEnemies: Enemy[] = [...newState.enemies];
      let newTowers: Tower[] = [...newState.towers];
      let newProjectiles: Projectile[] = [...newState.projectiles];
      let newParticles: Particle[] = [...newState.particles];
      let paintGain: PaintEssence = { red: 0, blue: 0, yellow: 0 };
      let scoreGain = 0;
      let kills = 0;
      let damageToCore = 0;

      // 波次逻辑
      if (newState.waveInProgress) {
        spawnTimerRef.current += delta;
        const waveConfig = getWaveConfig(newState.wave);

        if (enemiesSpawnedRef.current < waveConfig.enemyCount && spawnTimerRef.current >= waveConfig.spawnRate) {
          const colorTypes = getColorTypeForWave(newState.wave);
          const enemy = createEnemy(newState.wave, colorTypes[Math.floor(Math.random() * colorTypes.length)]);
          newEnemies.push(enemy);
          enemiesSpawnedRef.current++;
          spawnTimerRef.current = 0;
        }

        if (enemiesSpawnedRef.current >= waveConfig.enemyCount && newEnemies.length === 0) {
          newState.waveInProgress = false;
          
          if (newState.wave >= MAX_WAVES) {
            newState.gameState = 'victory';
          } else {
            newState.paint = {
              red: newState.paint.red + WAVE_BONUS.red,
              blue: newState.paint.blue + WAVE_BONUS.blue,
              yellow: newState.paint.yellow + WAVE_BONUS.yellow,
            };
          }
        }
      }

      // 移动敌人
      const moveResult = moveEnemies(newEnemies, delta);
      newEnemies = moveResult.enemies;
      damageToCore = moveResult.damageToCore;

      // 核心受伤
      if (damageToCore > 0) {
        newState.coreHealth = Math.max(0, newState.coreHealth - damageToCore);
        if (newState.coreHealth <= 0) {
          newState.gameState = 'gameOver';
        }
      }

      // 防御塔攻击
      const attackResult = processTowerAttacks(
        newTowers,
        newEnemies,
        now,
        getNextProjectileId
      );
      newTowers = attackResult.towers;
      newProjectiles = [...newProjectiles, ...attackResult.newProjectiles];

      // 子弹命中
      const hitResult = resolveProjectileHits(
        newProjectiles,
        newEnemies,
        delta,
        getNextParticleId
      );
      newProjectiles = hitResult.projectiles;
      newEnemies = hitResult.enemies;
      newParticles = [...newParticles, ...hitResult.particles];
      paintGain = hitResult.paintGain;
      scoreGain = hitResult.scoreGain;
      kills = hitResult.kills;

      // 更新粒子
      newParticles = updateParticles(newParticles);

      // 应用奖励
      if (kills > 0 || paintGain.red > 0 || paintGain.blue > 0 || paintGain.yellow > 0) {
        newState.paint = {
          red: newState.paint.red + paintGain.red,
          blue: newState.paint.blue + paintGain.blue,
          yellow: newState.paint.yellow + paintGain.yellow,
        };
        newState.score = newState.score + scoreGain;
        newState.enemiesKilled = newState.enemiesKilled + kills;
      }

      return {
        ...newState,
        enemies: newEnemies,
        towers: newTowers,
        projectiles: newProjectiles,
        particles: newParticles,
      };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [getNextProjectileId, getNextParticleId]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  const canPlaceTowerAt = useCallback((x: number, y: number): boolean => {
    return canPlaceTower(x, y, state.towers);
  }, [state.towers]);

  return {
    ...state,
    startGame,
    selectTowerType,
    selectStyle,
    placeTower,
    upgradeTower: handleUpgradeTower,
    startWave,
    skipWave,
    togglePause,
    canPlaceTowerAt,
    getTowerColorValue,
    getTowerStyleClass,
    GRID_SIZE,
    CELL_SIZE,
    PATH,
    CORE_POSITION,
  };
};
