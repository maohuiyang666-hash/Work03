import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, TowerType, StyleType, PaintEssence } from '../types/game';
import type { Enemy, Tower, Projectile, Particle } from '../types/entities';
import { TOWER_COLOR_MAP } from '../types/game';
import {
  GRID_SIZE,
  CELL_SIZE,
  PATH,
  PATH_LINES,
  CORE_POSITION,
  INITIAL_CORE_HEALTH,
  INITIAL_PAINT,
} from '../config/gameConfig';
import { TOWER_COSTS } from '../config/towerConfig';
import { canPlaceTower as checkCanPlace, createTower, getUpgradeCost, upgradeTower as doUpgrade } from '../logic/towerSystem';
import { spawnEnemy as spawnOneEnemy, getEnemiesPerWave, getSpawnRate, moveEnemies } from '../logic/enemySystem';
import { attackEnemies, resolveProjectileHits, createParticles as makeParticles, updateParticles } from '../logic/projectileSystem';
import { calculateWaveReward } from '../logic/waveSystem';
import { canAfford, deductPaint } from '../logic/resourceSystem';

export function useGameEngine() {
  // ---- Reactive State ----
  const [gameState, setGameState] = useState<GameState>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(INITIAL_CORE_HEALTH);
  const [paint, setPaint] = useState<PaintEssence>(INITIAL_PAINT);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());

  // ---- Mutable Refs ----
  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  // ---- Helpers ----
  const getColorValue = useCallback((type: TowerType): string => TOWER_COLOR_MAP[type], []);

  const getStyleClass = useCallback((style: string): string => {
    switch (style) {
      case 'pencil': return 'border-2 border-dashed';
      case 'watercolor': return 'opacity-80';
      case 'oil': return 'border-4';
      default: return '';
    }
  }, []);

  // ---- Core Actions ----

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
    setCollectedTowers(new Set());
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  }, []);

  const startWave = useCallback(() => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  }, [waveInProgress]);

  const placeTower = useCallback((x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!checkCanPlace(x, y, towers)) return;

    const { tower, cost } = createTower(x, y, selectedTowerType, selectedStyle, towerIdRef.current++);
    if (!canAfford(paint, cost)) return;

    setTowers((prev: Tower[]) => [...prev, tower]);
    setPaint((prev: PaintEssence) => deductPaint(prev, cost));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers((prev: Set<string>) => new Set(prev).add(towerKey));
    }
  }, [selectedTowerType, selectedStyle, gameState, towers, paint, collectedTowers]);

  const upgradeTower = useCallback((towerId: number) => {
    const tower = towers.find((t: Tower) => t.id === towerId);
    if (!tower) return;

    const { canUpgrade, cost } = getUpgradeCost(tower, paint);
    if (!canUpgrade) return;

    setPaint((prev: PaintEssence) => ({
      ...prev,
      [tower.type]: prev[tower.type] - cost,
    }));
    setTowers((prev: Tower[]) => prev.map((t: Tower) =>
      t.id === towerId ? doUpgrade(t) : t,
    ));
  }, [towers, paint]);

  const canPlaceTowerAt = useCallback((x: number, y: number): boolean => {
    return checkCanPlace(x, y, towers);
  }, [towers]);

  // ---- Game Loop ----
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    // 波次刷怪
    if (waveInProgress) {
      spawnTimerRef.current += delta;
      const enemiesPerWave = getEnemiesPerWave(wave);
      const spawnRate = getSpawnRate(wave);

      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        const newEnemy = spawnOneEnemy(wave, enemyIdRef.current++);
        setEnemies((prev: Enemy[]) => [...prev, newEnemy]);
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        if (wave >= 10) {
          setGameState('victory');
        } else {
          const bonus = calculateWaveReward();
          setPaint((prev: PaintEssence) => ({
            red: prev.red + bonus.red,
            blue: prev.blue + bonus.blue,
            yellow: prev.yellow + bonus.yellow,
          }));
        }
      }
    }

    // 敌人移动
    if (enemies.length > 0) {
      const { survivors, coreDamage } = moveEnemies(enemies, delta);
      if (coreDamage > 0) {
        setCoreHealth((h: number) => Math.max(0, h - coreDamage));
      }
      if (survivors.length !== enemies.length) {
        setEnemies(survivors);
      }
    }

    // 塔攻击
    if (enemies.length > 0 && towers.length > 0) {
      const attackResult = attackEnemies(towers, enemies, Date.now(), projectileIdRef.current, getColorValue);
      if (attackResult.projectiles.length > 0) {
        projectileIdRef.current = attackResult.nextId;
        setProjectiles((prev: Projectile[]) => [...prev, ...attackResult.projectiles]);
      }
    }

    // 弹丸移动与命中
    if (projectiles.length > 0) {
      const hitResult = resolveProjectileHits(projectiles, enemies, delta);

      if (hitResult.remainingProjectiles.length !== projectiles.length ||
          hitResult.hitParticles.length > 0) {
        setProjectiles(hitResult.remainingProjectiles);

        if (hitResult.enemies.length !== enemies.length || hitResult.killedEnemies.length > 0) {
          setEnemies(hitResult.enemies);
        }

        for (const hp of hitResult.hitParticles) {
          const { particles: newParts, nextId } = makeParticles(hp.x, hp.y, hp.color, hp.count, particleIdRef.current);
          particleIdRef.current = nextId;
          setParticles((prev: Particle[]) => [...prev, ...newParts]);
        }

        if (hitResult.paintGains.length > 0) {
          setPaint((prev: PaintEssence) => {
            let p = { ...prev };
            for (const gain of hitResult.paintGains) {
              if (gain.colorType === 'red') p.red += gain.amount;
              else if (gain.colorType === 'blue') p.blue += gain.amount;
              else p.yellow += gain.amount;
            }
            return p;
          });
        }
        if (hitResult.scoreGain > 0) setScore((s: number) => s + hitResult.scoreGain);
        if (hitResult.kills > 0) setEnemiesKilled((k: number) => k + hitResult.kills);
      }
    }

    // 粒子衰减
    if (particles.length > 0) {
      setParticles((prev: Particle[]) => updateParticles(prev));
    }

    // 检查失败
    setCoreHealth((h: number) => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, towers, projectiles, particles, getColorValue]);

  // 启动/重启 game loop
  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // ---- 暴露给外部 ----
  return {
    // 状态
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

    // 操作
    setGameState,
    setWave,
    setSelectedTowerType,
    setSelectedStyle,
    startGame,
    startWave,
    placeTower,
    upgradeTower,
    canPlaceTowerAt,

    // 工具 & 常量
    getColorValue,
    getStyleClass,
    TOWER_COSTS,
    GRID_SIZE,
    CELL_SIZE,
    PATH,
    PATH_LINES,
    CORE_POSITION,
  };
}