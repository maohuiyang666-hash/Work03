import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_CORE_HEALTH, INITIAL_PAINT, MAX_WAVE } from '../config/gameConfig';
import { TOWER_BASE_STATS } from '../config/towerConfig';
import { moveEnemies, spawnEnemy } from '../logic/enemySystem';
import { advanceParticles } from '../logic/particleSystem';
import { fireProjectiles, resolveProjectileHits } from '../logic/projectileSystem';
import { canAfford, gainPaint, spendPaint } from '../logic/resourceSystem';
import {
  canPlaceTower,
  createTower,
  getTowerCollectionKey,
  getTowerCost,
  getTowerUpgradeCost,
  isTowerMaxLevel,
  upgradeTower,
} from '../logic/towerSystem';
import {
  calculateWaveReward,
  checkGameOver,
  checkVictory,
  getWaveEnemyCount,
  getWaveSpawnRate,
} from '../logic/waveSystem';
import type { GameLoopRefs, GameState } from '../types/state';
import type { TowerStyle, TowerType } from '../types/game';

const createInitialGameState = (gameStatus: GameState['gameStatus'] = 'menu'): GameState => ({
  gameStatus,
  wave: 1,
  coreHealth: INITIAL_CORE_HEALTH,
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

const createInitialLoopRefs = (): GameLoopRefs => ({
  enemyId: 0,
  towerId: 0,
  projectileId: 0,
  particleId: 0,
  lastUpdate: Date.now(),
  enemiesSpawned: 0,
  spawnTimer: 0,
});

const applyPaintRewards = (
  paint: GameState['paint'],
  rewards: Partial<Record<'red' | 'blue' | 'yellow', number>>,
): GameState['paint'] => ({
  red: paint.red + (rewards.red ?? 0),
  blue: paint.blue + (rewards.blue ?? 0),
  yellow: paint.yellow + (rewards.yellow ?? 0),
});

export const useGameController = () => {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const stateRef = useRef(state);
  const loopRefs = useRef<GameLoopRefs>(createInitialLoopRefs());
  const gameLoopRef = useRef<number | null>(null);

  const commitState = useCallback((nextState: GameState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const startGame = useCallback(() => {
    loopRefs.current = createInitialLoopRefs();
    commitState(createInitialGameState('playing'));
  }, [commitState]);

  const setSelectedTowerType = useCallback((towerType: TowerType) => {
    const currentState = stateRef.current;
    commitState({
      ...currentState,
      selectedTowerType: currentState.selectedTowerType === towerType ? null : towerType,
    });
  }, [commitState]);

  const setSelectedStyle = useCallback((style: TowerStyle) => {
    const currentState = stateRef.current;
    commitState({
      ...currentState,
      selectedStyle: style,
    });
  }, [commitState]);

  const placeTower = useCallback((x: number, y: number) => {
    const currentState = stateRef.current;
    if (!currentState.selectedTowerType || currentState.gameStatus !== 'playing') {
      return;
    }

    if (!canPlaceTower(x, y, currentState.towers)) {
      return;
    }

    const cost = getTowerCost(currentState.selectedTowerType);
    if (!canAfford(currentState.paint, cost)) {
      return;
    }

    const tower = createTower(
      loopRefs.current.towerId,
      x,
      y,
      currentState.selectedTowerType,
      currentState.selectedStyle,
    );
    loopRefs.current.towerId += 1;

    const towerKey = getTowerCollectionKey(currentState.selectedTowerType, currentState.selectedStyle);
    const collectedTowers = currentState.collectedTowers.has(towerKey)
      ? currentState.collectedTowers
      : new Set([...currentState.collectedTowers, towerKey]);

    commitState({
      ...currentState,
      towers: [...currentState.towers, tower],
      paint: spendPaint(currentState.paint, cost),
      collectedTowers,
    });
  }, [commitState]);

  const upgradeTowerById = useCallback((towerId: number) => {
    const currentState = stateRef.current;
    const tower = currentState.towers.find((item) => item.id === towerId);
    if (!tower || isTowerMaxLevel(tower)) {
      return;
    }

    const upgradeCost = getTowerUpgradeCost(tower);
    if (currentState.paint[tower.type] < upgradeCost) {
      return;
    }

    commitState({
      ...currentState,
      paint: {
        ...currentState.paint,
        [tower.type]: currentState.paint[tower.type] - upgradeCost,
      },
      towers: currentState.towers.map((item) => (item.id === towerId ? upgradeTower(item) : item)),
    });
  }, [commitState]);

  const startWave = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.waveInProgress) {
      return;
    }

    loopRefs.current.enemiesSpawned = 0;
    loopRefs.current.spawnTimer = 0;
    commitState({
      ...currentState,
      waveInProgress: true,
    });
  }, [commitState]);

  const togglePause = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.gameStatus !== 'playing' && currentState.gameStatus !== 'paused') {
      return;
    }

    commitState({
      ...currentState,
      gameStatus: currentState.gameStatus === 'paused' ? 'playing' : 'paused',
    });
  }, [commitState]);

  const skipWave = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.waveInProgress || currentState.wave >= MAX_WAVE || currentState.enemies.length > 0) {
      return;
    }

    commitState({
      ...currentState,
      wave: currentState.wave + 1,
    });
  }, [commitState]);

  useEffect(() => {
    const loop = () => {
      const currentState = stateRef.current;
      if (currentState.gameStatus !== 'playing') {
        loopRefs.current.lastUpdate = Date.now();
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      const delta = (now - loopRefs.current.lastUpdate) / 1000;
      loopRefs.current.lastUpdate = now;

      let nextState = currentState;

      if (nextState.waveInProgress) {
        const enemiesPerWave = getWaveEnemyCount(nextState.wave);
        const spawnRate = getWaveSpawnRate(nextState.wave);
        loopRefs.current.spawnTimer += delta;

        if (loopRefs.current.enemiesSpawned < enemiesPerWave && loopRefs.current.spawnTimer >= spawnRate) {
          const enemy = spawnEnemy(
            nextState.wave,
            loopRefs.current.enemyId,
            Math.random(),
            Math.random(),
          );
          loopRefs.current.enemyId += 1;
          loopRefs.current.enemiesSpawned += 1;
          loopRefs.current.spawnTimer = 0;
          nextState = {
            ...nextState,
            enemies: [...nextState.enemies, enemy],
          };
        }
      }

      const movedEnemies = moveEnemies(nextState.enemies, delta);
      const coreHealth = Math.max(0, nextState.coreHealth - movedEnemies.coreDamage);
      nextState = {
        ...nextState,
        enemies: movedEnemies.enemies,
        coreHealth,
      };

      const firedProjectiles = fireProjectiles(
        nextState.towers,
        nextState.enemies,
        now,
        loopRefs.current.projectileId,
      );
      loopRefs.current.projectileId = firedProjectiles.nextProjectileId;
      nextState = {
        ...nextState,
        towers: firedProjectiles.towers,
        projectiles: [...nextState.projectiles, ...firedProjectiles.projectiles],
      };

      const projectileResult = resolveProjectileHits(
        nextState.projectiles,
        nextState.enemies,
        delta,
        loopRefs.current.particleId,
      );
      loopRefs.current.particleId = projectileResult.nextParticleId;
      nextState = {
        ...nextState,
        enemies: projectileResult.enemies,
        projectiles: projectileResult.projectiles,
        particles: advanceParticles([...nextState.particles, ...projectileResult.particles]),
        paint: applyPaintRewards(nextState.paint, projectileResult.paintRewards),
        score: nextState.score + projectileResult.scoreGain,
        enemiesKilled: nextState.enemiesKilled + projectileResult.enemiesKilled,
      };

      if (nextState.waveInProgress) {
        const enemiesPerWave = getWaveEnemyCount(nextState.wave);
        if (loopRefs.current.enemiesSpawned >= enemiesPerWave && nextState.enemies.length === 0) {
          if (checkVictory(nextState.wave)) {
            nextState = {
              ...nextState,
              gameStatus: 'victory',
              waveInProgress: false,
            };
          } else {
            nextState = {
              ...nextState,
              waveInProgress: false,
              paint: gainPaint(nextState.paint, calculateWaveReward()),
            };
          }
        }
      }

      if (checkGameOver(nextState.coreHealth)) {
        nextState = {
          ...nextState,
          gameStatus: 'gameOver',
          waveInProgress: false,
        };
      }

      commitState(nextState);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    loopRefs.current.lastUpdate = Date.now();
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [commitState]);

  return {
    ...state,
    maxWave: MAX_WAVE,
    maxTowerLevel: TOWER_BASE_STATS.maxLevel,
    actions: {
      placeTower,
      setSelectedStyle,
      setSelectedTowerType,
      skipWave,
      startGame,
      startWave,
      togglePause,
      upgradeTowerById,
    },
  };
};
