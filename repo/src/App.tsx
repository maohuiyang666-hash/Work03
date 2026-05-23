import { useState, useEffect, useCallback, useRef } from 'react';

// ===== 类型定义 =====

type ElementType = 'red' | 'blue' | 'yellow' | 'purple' | 'orange' | 'green' | 'white';
type StatusType = 'burning' | 'frozen' | 'shocked' | 'corroded' | 'bursting';
type ReactionType = 'steamBurst' | 'coolingBrittle' | 'chainConduct' | 'none';

interface Position {
  x: number;
  y: number;
}

interface ElementResistance {
  red: number;
  blue: number;
  yellow: number;
  purple: number;
  orange: number;
  green: number;
  white: number;
}

interface ElementWeakness {
  red: number;
  blue: number;
  yellow: number;
  purple: number;
  orange: number;
  green: number;
  white: number;
}

interface StatusEffect {
  id: number;
  type: StatusType;
  duration: number;
  maxDuration: number;
  stacks: number;
  maxStacks: number;
  damagePerSecond: number;
  lastTick: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  baseSpeed: number;
  speed: number;
  color: string;
  colorType: 'red' | 'blue' | 'yellow' | 'mixed';
  pathIndex: number;
  statuses: StatusEffect[];
  resistance: ElementResistance;
  weakness: ElementWeakness;
  immuneStatuses: StatusType[];
  originalSpeed: number;
}

interface Tower {
  id: number;
  x: number;
  y: number;
  type: ElementType;
  baseType: 'red' | 'blue' | 'yellow';
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: 'pencil' | 'watercolor' | 'oil';
  isFused: boolean;
  fusedFrom: { x: number; y: number }[];
  damageContribution: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: number;
  color: string;
  speed: number;
  damage: number;
  elementType: ElementType;
  type: 'normal' | 'slow' | 'pierce' | 'explosive' | 'bounce' | 'corrosive';
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
  type: 'normal' | 'status' | 'reaction' | 'fusion';
}

interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

interface BattleLogEntry {
  id: number;
  timestamp: number;
  type: 'reaction' | 'statusApplied' | 'statusRemoved' | 'enemyKilled' | 'damage' | 'fusion';
  message: string;
  color: string;
}

interface ReactionRecord {
  id: number;
  type: ReactionType;
  x: number;
  y: number;
  createdAt: number;
}

// ===== 游戏常量 =====

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

// ===== 辅助函数 =====

const getColorValue = (type: ElementType): string => {
  const colors: Record<ElementType, string> = {
    red: '#e74c3c',
    blue: '#3498db',
    yellow: '#f39c12',
    purple: '#9b59b6',
    orange: '#e67e22',
    green: '#27ae60',
    white: '#ecf0f1',
  };
  return colors[type];
};

const getStatusIcon = (type: StatusType): string => {
  const icons: Record<StatusType, string> = {
    burning: '🔥',
    frozen: '❄️',
    shocked: '⚡',
    corroded: '☠️',
    bursting: '💥',
  };
  return icons[type];
};

const getStatusName = (type: StatusType): string => {
  const names: Record<StatusType, string> = {
    burning: '灼烧',
    frozen: '冻结',
    shocked: '电击',
    corroded: '腐蚀',
    bursting: '爆裂',
  };
  return names[type];
};

const getReactionName = (type: ReactionType): string => {
  const names: Record<ReactionType, string> = {
    steamBurst: '蒸汽爆发',
    coolingBrittle: '冷却脆化',
    chainConduct: '连锁导电',
    none: '',
  };
  return names[type];
};

const getStyleClass = (style: string) => {
  switch (style) {
    case 'pencil': return 'border-2 border-dashed';
    case 'watercolor': return 'opacity-80';
    case 'oil': return 'border-4';
    default: return '';
  }
};

const getTowerName = (type: ElementType): string => {
  const names: Record<ElementType, string> = {
    red: '烈焰塔',
    blue: '寒冰塔',
    yellow: '雷电塔',
    purple: '腐蚀塔',
    orange: '爆裂塔',
    green: '弹射塔',
    white: '核心塔',
  };
  return names[type];
};

export default function CanvasDefender() {
  // ===== 状态管理 =====
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'victory'>('menu');
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
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([]);
  const [reactions, setReactions] = useState<ReactionRecord[]>([]);
  const [maxChainCount, setMaxChainCount] = useState(0);
  const [currentChainCount, setCurrentChainCount] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // ===== 引用 =====
  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const statusIdRef = useRef(0);
  const logIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  // ===== 游戏核心功能 =====

  const addBattleLog = useCallback((entry: Omit<BattleLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: BattleLogEntry = {
      ...entry,
      id: logIdRef.current++,
      timestamp: Date.now(),
    };
    setBattleLogs(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5, type: Particle['type'] = 'normal') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        color,
        size: 4 + Math.random() * (type === 'reaction' ? 8 : 4),
        life: type === 'reaction' ? 40 + Math.random() * 20 : 30 + Math.random() * 20,
        velocityX: (Math.random() - 0.5) * (type === 'reaction' ? 8 : 4),
        velocityY: (Math.random() - 0.5) * (type === 'reaction' ? 8 : 4),
        type,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createStatusEffect = useCallback((type: StatusType): StatusEffect => {
    const configs: Record<StatusType, Partial<StatusEffect>> = {
      burning: { duration: 5, maxDuration: 8, maxStacks: 3, damagePerSecond: 8 },
      frozen: { duration: 2, maxDuration: 3, maxStacks: 1, damagePerSecond: 0 },
      shocked: { duration: 4, maxDuration: 6, maxStacks: 2, damagePerSecond: 3 },
      corroded: { duration: 6, maxDuration: 8, maxStacks: 3, damagePerSecond: 5 },
      bursting: { duration: 3, maxDuration: 5, maxStacks: 1, damagePerSecond: 0 },
    };
    const config = configs[type];
    return {
      id: statusIdRef.current++,
      type,
      duration: config.duration || 5,
      maxDuration: config.maxDuration || 8,
      stacks: 1,
      maxStacks: config.maxStacks || 3,
      damagePerSecond: config.damagePerSecond || 0,
      lastTick: Date.now(),
    };
  }, []);

  const applyStatusToEnemy = useCallback((enemy: Enemy, statusType: StatusType): Enemy => {
    if (enemy.immuneStatuses.includes(statusType)) return enemy;

    const existingStatus = enemy.statuses.find(s => s.type === statusType);
    let newStatuses: StatusEffect[];

    if (existingStatus) {
      newStatuses = enemy.statuses.map(s => {
        if (s.type === statusType) {
          return {
            ...s,
            duration: Math.min(s.maxDuration, s.duration + 2),
            stacks: Math.min(s.maxStacks, s.stacks + 1),
            lastTick: Date.now(),
          };
        }
        return s;
      });
    } else {
      newStatuses = [...enemy.statuses, createStatusEffect(statusType)];
      addBattleLog({
        type: 'statusApplied',
        message: `${getStatusName(statusType)} 已施加`,
        color: getColorValue(statusType === 'burning' ? 'red' : statusType === 'frozen' ? 'blue' : statusType === 'shocked' ? 'yellow' : 'purple'),
      });
    }

    return { ...enemy, statuses: newStatuses };
  }, [createStatusEffect, addBattleLog]);

  const calculateDamage = useCallback((baseDamage: number, elementType: ElementType, enemy: Enemy): number => {
    const resistance = enemy.resistance[elementType] || 0;
    const weakness = enemy.weakness[elementType] || 0;
    const corrosionStacks = enemy.statuses.find(s => s.type === 'corroded')?.stacks || 0;
    
    let damage = baseDamage * (1 - resistance * 0.15);
    damage *= (1 + weakness * 0.25);
    damage *= (1 + corrosionStacks * 0.1);
    
    return Math.max(1, Math.floor(damage));
  }, []);

  const checkAndTriggerReaction = useCallback((enemy: Enemy, attackingElement: ElementType, x: number, y: number): { triggered: boolean; reaction: ReactionType; bonusDamage: number } => {
    let reaction: ReactionType = 'none';
    let bonusDamage = 0;

    const hasBurning = enemy.statuses.some(s => s.type === 'burning');
    const hasFrozen = enemy.statuses.some(s => s.type === 'frozen');
    const hasShocked = enemy.statuses.some(s => s.type === 'shocked');

    if (hasFrozen && attackingElement === 'red') {
      reaction = 'steamBurst';
      bonusDamage = 25;
    } else if (hasBurning && attackingElement === 'blue') {
      reaction = 'coolingBrittle';
      bonusDamage = 15;
    } else if (hasShocked && attackingElement === 'yellow') {
      reaction = 'chainConduct';
      bonusDamage = 20;
    }

    if (reaction !== 'none') {
      addBattleLog({
        type: 'reaction',
        message: `元素反应: ${getReactionName(reaction)}!`,
        color: getColorValue(reaction === 'steamBurst' ? 'purple' : reaction === 'coolingBrittle' ? 'green' : 'orange'),
      });
      createParticles(x, y, reaction === 'steamBurst' ? '#9b59b6' : reaction === 'coolingBrittle' ? '#27ae60' : '#f39c12', 15, 'reaction');
      setReactions(prev => [...prev, { id: Date.now(), type: reaction, x, y, createdAt: Date.now() }]);
      setCurrentChainCount(prev => {
        const newCount = prev + 1;
        setMaxChainCount(max => Math.max(max, newCount));
        return newCount;
      });
    }

    return { triggered: reaction !== 'none', reaction, bonusDamage };
  }, [addBattleLog, createParticles]);

  const checkFusionTowers = useCallback((currentTowers: Tower[]): Tower[] => {
    const newTowers = [...currentTowers];
    const towerMap = new Map<string, Tower>();
    newTowers.forEach(t => towerMap.set(`${t.x},${t.y}`, t));

    const directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
    
    for (let i = newTowers.length - 1; i >= 0; i--) {
      const tower = newTowers[i];
      if (tower.isFused) continue;

      const neighbors: Tower[] = [];
      directions.forEach(dir => {
        const neighbor = towerMap.get(`${tower.x + dir.x},${tower.y + dir.y}`);
        if (neighbor && !neighbor.isFused && neighbor.baseType !== tower.baseType) {
          neighbors.push(neighbor);
        }
      });

      if (neighbors.length >= 2) {
        const types = new Set([tower.baseType, ...neighbors.slice(0, 2).map(n => n.baseType)]);
        if (types.size === 3) {
          const avgLevel = Math.floor((tower.level + neighbors[0].level + neighbors[1].level) / 3);
          const newTower: Tower = {
            id: towerIdRef.current++,
            x: tower.x,
            y: tower.y,
            type: 'white',
            baseType: tower.baseType,
            level: avgLevel,
            range: 3.5,
            damage: Math.floor((tower.damage + neighbors[0].damage + neighbors[1].damage) * 1.5),
            attackSpeed: Math.floor((tower.attackSpeed + neighbors[0].attackSpeed + neighbors[1].attackSpeed) / 3),
            lastAttack: 0,
            style: tower.style,
            isFused: true,
            fusedFrom: [{ x: tower.x, y: tower.y }, { x: neighbors[0].x, y: neighbors[0].y }, { x: neighbors[1].x, y: neighbors[1].y }],
            damageContribution: 0,
          };

          const removePositions = new Set([`${tower.x},${tower.y}`, `${neighbors[0].x},${neighbors[0].y}`, `${neighbors[1].x},${neighbors[1].y}`]);
          const filteredTowers = newTowers.filter(t => !removePositions.has(`${t.x},${t.y}`));
          filteredTowers.push(newTower);
          
          addBattleLog({
            type: 'fusion',
            message: '三原色融合: 核心塔觉醒!',
            color: '#ecf0f1',
          });
          createParticles(tower.x * CELL_SIZE + CELL_SIZE / 2, tower.y * CELL_SIZE + CELL_SIZE / 2, '#ecf0f1', 20, 'fusion');
          
          return checkFusionTowers(filteredTowers);
        }
      }

      if (neighbors.length >= 1) {
        const neighbor = neighbors[0];
        const types = [tower.baseType, neighbor.baseType].sort();
        let fusedType: ElementType = 'red';
        
        if ((types[0] === 'blue' && types[1] === 'red') || (types[0] === 'red' && types[1] === 'blue')) {
          fusedType = 'purple';
        } else if ((types[0] === 'yellow' && types[1] === 'red') || (types[0] === 'red' && types[1] === 'yellow')) {
          fusedType = 'orange';
        } else if ((types[0] === 'blue' && types[1] === 'yellow') || (types[0] === 'yellow' && types[1] === 'blue')) {
          fusedType = 'green';
        }

        if (fusedType !== 'red') {
          const avgLevel = Math.floor((tower.level + neighbor.level) / 2);
          const newTower: Tower = {
            id: towerIdRef.current++,
            x: tower.x,
            y: tower.y,
            type: fusedType,
            baseType: tower.baseType,
            level: avgLevel,
            range: fusedType === 'orange' ? 3 : 2.5,
            damage: Math.floor((tower.damage + neighbor.damage) * 1.2),
            attackSpeed: Math.floor((tower.attackSpeed + neighbor.attackSpeed) / 2),
            lastAttack: 0,
            style: tower.style,
            isFused: true,
            fusedFrom: [{ x: tower.x, y: tower.y }, { x: neighbor.x, y: neighbor.y }],
            damageContribution: 0,
          };

          const removePositions = new Set([`${tower.x},${tower.y}`, `${neighbor.x},${neighbor.y}`]);
          const filteredTowers = newTowers.filter(t => !removePositions.has(`${t.x},${t.y}`));
          filteredTowers.push(newTower);
          
          addBattleLog({
            type: 'fusion',
            message: `融合成功: ${getTowerName(fusedType)}!`,
            color: getColorValue(fusedType),
          });
          createParticles(tower.x * CELL_SIZE + CELL_SIZE / 2, tower.y * CELL_SIZE + CELL_SIZE / 2, getColorValue(fusedType), 15, 'fusion');
          
          return checkFusionTowers(filteredTowers);
        }
      }
    }

    return newTowers;
  }, [addBattleLog, createParticles]);

  const canPlaceTower = useCallback((x: number, y: number): boolean => {
    const isOnPath = PATH.some(p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    const hasTower = towers.some(t => t.x === x && t.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  }, [towers]);

  const placeTower = useCallback((x: number, y: number) => {
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
      baseType: selectedTowerType,
      level: 1,
      range: 2.5,
      damage: Math.floor(15 * styleMultiplier),
      attackSpeed: selectedStyle === 'watercolor' ? 1200 : selectedStyle === 'pencil' ? 800 : 1500,
      lastAttack: 0,
      style: selectedStyle,
      isFused: false,
      fusedFrom: [],
      damageContribution: 0,
    };

    setTowers(prev => {
      const updated = [...prev, newTower];
      return checkFusionTowers(updated);
    });
    setPaint(prev => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers(prev => new Set(prev).add(towerKey));
    }
  }, [selectedTowerType, gameState, canPlaceTower, paint, selectedStyle, checkFusionTowers, collectedTowers]);

  const spawnEnemy = useCallback(() => {
    const colorTypes: Array<'red' | 'blue' | 'yellow' | 'mixed'> = ['red', 'blue', 'yellow'];
    if (wave >= 3) colorTypes.push('mixed');
    const type = colorTypes[Math.floor(Math.random() * colorTypes.length)];
    
    const colors = {
      red: '#c0392b',
      blue: '#2980b9',
      yellow: '#d68910',
      mixed: ['#8e44ad', '#16a085', '#d35400'][Math.floor(Math.random() * 3)],
    };

    const baseResistance: ElementResistance = {
      red: 0, blue: 0, yellow: 0, purple: 0, orange: 0, green: 0, white: 0,
    };
    const baseWeakness: ElementWeakness = {
      red: 0, blue: 0, yellow: 0, purple: 0, orange: 0, green: 0, white: 0,
    };
    const immuneStatuses: StatusType[] = [];

    if (type === 'red') {
      baseResistance.red = 2;
      baseWeakness.blue = 2;
      immuneStatuses.push('burning');
    } else if (type === 'blue') {
      baseResistance.blue = 2;
      baseWeakness.yellow = 2;
      immuneStatuses.push('frozen');
    } else if (type === 'yellow') {
      baseResistance.yellow = 2;
      baseWeakness.red = 2;
      immuneStatuses.push('shocked');
    } else if (type === 'mixed') {
      baseResistance.red = 1;
      baseResistance.blue = 1;
      baseResistance.yellow = 1;
      baseResistance.purple = 1;
      baseResistance.orange = 1;
      baseResistance.green = 1;
    }

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: 40 + wave * 15,
      maxHealth: 40 + wave * 15,
      baseSpeed: 35 + Math.min(wave * 3, 25),
      speed: 35 + Math.min(wave * 3, 25),
      originalSpeed: 35 + Math.min(wave * 3, 25),
      color: colors[type],
      colorType: type,
      pathIndex: 0,
      statuses: [],
      resistance: baseResistance,
      weakness: baseWeakness,
      immuneStatuses,
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [wave]);

  const startWave = useCallback(() => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    setCurrentChainCount(0);
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
      const enemiesPerWave = 5 + wave * 3;
      const spawnRate = 1.5 - Math.min(wave * 0.1, 0.8);
      
      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      if (enemiesSpawnedRef.current >= enemiesPerWave && enemies.length === 0) {
        setWaveInProgress(false);
        if (wave >= 10) {
          setGameState('victory');
        } else {
          const bonus: PaintEssence = { red: 10, blue: 10, yellow: 10 };
          setPaint(prev => ({
            red: prev.red + bonus.red,
            blue: prev.blue + bonus.blue,
            yellow: prev.yellow + bonus.yellow,
          }));
        }
      }
    }

    setEnemies(prev => {
      const updatedEnemies: Enemy[] = [];
      let damage = 0;
      const enemiesToRemove: number[] = [];

      prev.forEach(enemy => {
        if (enemy.pathIndex >= PATH.length - 1) {
          damage += 10;
          return;
        }

        let updatedEnemy = { ...enemy };
        
        const newStatuses: StatusEffect[] = [];
        let tickDamage = 0;
        let shouldFreeze = false;

        updatedEnemy.statuses.forEach(status => {
          const updatedStatus = { ...status };
          updatedStatus.duration -= delta;
          
          if (updatedStatus.type === 'frozen') {
            shouldFreeze = true;
          }

          if (updatedStatus.damagePerSecond > 0) {
            const timeSinceLastTick = now - updatedStatus.lastTick;
            if (timeSinceLastTick >= 1000) {
              tickDamage += updatedStatus.damagePerSecond * updatedStatus.stacks;
              updatedStatus.lastTick = now;
              createParticles(updatedEnemy.x, updatedEnemy.y, status.type === 'burning' ? '#e74c3c' : status.type === 'corroded' ? '#9b59b6' : '#f39c12', 3, 'status');
            }
          }

          if (updatedStatus.duration > 0) {
            newStatuses.push(updatedStatus);
          } else {
            addBattleLog({
              type: 'statusRemoved',
              message: `${getStatusName(status.type)} 已消散`,
              color: getColorValue(status.type === 'burning' ? 'red' : status.type === 'frozen' ? 'blue' : status.type === 'shocked' ? 'yellow' : 'purple'),
            });
          }
        });

        if (shouldFreeze) {
          updatedEnemy.speed = 0;
        } else {
          const slowStacks = newStatuses.filter(s => s.type === 'corroded').reduce((acc, s) => acc + s.stacks, 0);
          updatedEnemy.speed = Math.max(updatedEnemy.originalSpeed * (1 - slowStacks * 0.15), 10);
        }

        if (tickDamage > 0) {
          updatedEnemy.health -= tickDamage;
        }

        updatedEnemy.statuses = newStatuses;

        if (updatedEnemy.health <= 0) {
          const paintGain = 8 + Math.floor(updatedEnemy.maxHealth / 15);
          const colorType = updatedEnemy.colorType === 'mixed' ? 
            (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)] : 
            updatedEnemy.colorType;
          
          setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + paintGain }));
          setScore(s => s + 15 + Math.floor(updatedEnemy.maxHealth / 10));
          setEnemiesKilled(k => k + 1);
          
          addBattleLog({
            type: 'enemyKilled',
            message: '敌人被消灭!',
            color: updatedEnemy.color,
          });

          if (updatedEnemy.statuses.some(s => s.type === 'bursting') || updatedEnemy.statuses.some(s => s.type === 'shocked')) {
            createParticles(updatedEnemy.x, updatedEnemy.y, '#f39c12', 20, 'reaction');
            
            if (updatedEnemy.statuses.some(s => s.type === 'shocked')) {
              prev.forEach(otherEnemy => {
                if (otherEnemy.id !== updatedEnemy.id) {
                  const dist = Math.sqrt(Math.pow(otherEnemy.x - updatedEnemy.x, 2) + Math.pow(otherEnemy.y - updatedEnemy.y, 2));
                  if (dist < 100) {
                    otherEnemy.health -= 15;
                    otherEnemy = applyStatusToEnemy(otherEnemy, 'shocked');
                  }
                }
              });
            }
          } else {
            createParticles(updatedEnemy.x, updatedEnemy.y, updatedEnemy.color, 8);
          }
          
          enemiesToRemove.push(updatedEnemy.id);
          return;
        }

        const target = {
          x: PATH[updatedEnemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
          y: PATH[updatedEnemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
        };

        const dx = target.x - updatedEnemy.x;
        const dy = target.y - updatedEnemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          updatedEnemy.pathIndex++;
        } else if (!shouldFreeze) {
          updatedEnemy.x += (dx / dist) * updatedEnemy.speed * delta;
          updatedEnemy.y += (dy / dist) * updatedEnemy.speed * delta;
        }

        updatedEnemies.push(updatedEnemy);
      });

      if (damage > 0) {
        setCoreHealth(h => Math.max(0, h - damage));
      }

      return updatedEnemies.filter(e => !enemiesToRemove.includes(e.id));
    });

    setCoreHealth(h => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    setTowers(prev => {
      const currentTime = Date.now();
      const updatedTowers = prev.map(tower => {
        const updatedTower = { ...tower };
        
        if (currentTime - updatedTower.lastAttack < updatedTower.attackSpeed) return updatedTower;

        const towerCenterX = updatedTower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = updatedTower.y * CELL_SIZE + CELL_SIZE / 2;

        const inRange = enemies.filter(e => {
          const dist = Math.sqrt(Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2));
          return dist <= updatedTower.range * CELL_SIZE;
        });

        if (inRange.length > 0) {
          const target = inRange[0];
          updatedTower.lastAttack = currentTime;

          let projectileType: Projectile['type'] = 'normal';
          if (updatedTower.type === 'blue') projectileType = 'slow';
          if (updatedTower.type === 'yellow') projectileType = 'pierce';
          if (updatedTower.type === 'orange') projectileType = 'explosive';
          if (updatedTower.type === 'green') projectileType = 'bounce';
          if (updatedTower.type === 'purple') projectileType = 'corrosive';

          const projectile: Projectile = {
            id: projectileIdRef.current++,
            x: towerCenterX,
            y: towerCenterY,
            targetX: target.x,
            targetY: target.y,
            targetEnemyId: target.id,
            color: getColorValue(updatedTower.type),
            speed: 350,
            damage: updatedTower.damage * updatedTower.level,
            elementType: updatedTower.type,
            type: projectileType,
          };

          setProjectiles(p => [...p, projectile]);
        }
        
        return updatedTower;
      });
      
      return updatedTowers;
    });

    setProjectiles(prev => {
      const remaining: Projectile[] = [];
      
      prev.forEach(proj => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          setEnemies(currentEnemies => {
            const updatedEnemies = currentEnemies.map(enemy => {
              let hitEnemy = { ...enemy };
              
              const hitDist = Math.sqrt(Math.pow(enemy.x - proj.x, 2) + Math.pow(enemy.y - proj.y, 2));
              const hitRange = proj.type === 'pierce' || proj.type === 'explosive' ? 60 : 25;
              
              if (hitDist < hitRange) {
                createParticles(enemy.x, enemy.y, proj.color, 3);
                
                const reactionResult = checkAndTriggerReaction(hitEnemy, proj.elementType, enemy.x, enemy.y);
                let finalDamage = calculateDamage(proj.damage, proj.elementType, hitEnemy);
                finalDamage += reactionResult.bonusDamage;
                
                hitEnemy.health -= finalDamage;
                
                setTowers(t => t.map(tower => {
                  const towerDist = Math.sqrt(Math.pow(tower.x * CELL_SIZE + CELL_SIZE / 2 - proj.x, 2) + Math.pow(tower.y * CELL_SIZE + CELL_SIZE / 2 - proj.y, 2));
                  if (towerDist < 80) {
                    return { ...tower, damageContribution: tower.damageContribution + finalDamage };
                  }
                  return tower;
                }));
                
                addBattleLog({
                  type: 'damage',
                  message: `造成 ${finalDamage} 点${getTowerName(proj.elementType)}伤害`,
                  color: getColorValue(proj.elementType),
                });

                if (proj.elementType === 'red') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'burning');
                } else if (proj.elementType === 'blue') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'frozen');
                } else if (proj.elementType === 'yellow') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'shocked');
                } else if (proj.elementType === 'purple') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'corroded');
                } else if (proj.elementType === 'orange') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'bursting');
                } else if (proj.elementType === 'green') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'shocked');
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'corroded');
                } else if (proj.elementType === 'white') {
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'burning');
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'frozen');
                  hitEnemy = applyStatusToEnemy(hitEnemy, 'shocked');
                }

                if (proj.type === 'slow') {
                  hitEnemy.speed = Math.max(15, hitEnemy.speed * 0.7);
                }
              }
              
              return hitEnemy;
            });
            
            return updatedEnemies;
          });
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

    setReactions(prev => prev.filter(r => now - r.createdAt < 1500));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy, createParticles, addBattleLog, applyStatusToEnemy, checkAndTriggerReaction, calculateDamage]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  const startGame = useCallback(() => {
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
    setBattleLogs([]);
    setReactions([]);
    setMaxChainCount(0);
    setCurrentChainCount(0);
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  }, []);

  const upgradeTower = useCallback((towerId: number) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level * 25;
    const baseType = tower.baseType;
    if (paint[baseType] >= cost) {
      setPaint(prev => ({ ...prev, [baseType]: prev[baseType] - cost }));
      setTowers(prev => prev.map(t =>
        t.id === towerId
          ? { ...t, level: t.level + 1, damage: Math.floor(t.damage * 1.4), range: t.range + 0.2 }
          : t
      ));
    }
  }, [towers, paint]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
      
      {gameState === 'menu' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
          <div className="transform -rotate-1">
            <h1 className="text-4xl font-bold text-amber-700 mb-2" style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
              🎨 绘世守护者
            </h1>
            <p className="text-amber-600 mb-4 text-lg italic">Canvas Defender - 元素觉醒版</p>
            
            <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
              <h3 className="font-bold text-amber-800 mb-2 text-lg flex items-center">
                ✨ 新特性
              </h3>
              <div className="text-amber-700 space-y-1 text-sm">
                <p>🔥 红色: 灼烧持续伤害</p>
                <p>❄️ 蓝色: 冻结停止移动</p>
                <p>⚡ 黄色: 电击连锁传导</p>
                <p>💜 红+蓝融合: 腐蚀降低抗性</p>
                <p>🧡 红+黄融合: 爆裂范围爆炸</p>
                <p>💚 蓝+黄融合: 弹射+减速</p>
                <p>⚪ 三色融合: 终极核心塔</p>
              </div>
            </div>
            
            <div className="mb-6 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 text-left">
              <h3 className="font-bold text-blue-800 mb-2 text-lg flex items-center">
                ⚡ 元素反应
              </h3>
              <div className="text-blue-700 space-y-1 text-sm">
                <p>💨 冻结+红色 = 蒸汽爆发</p>
                <p>💎 灼烧+蓝色 = 冷却脆化</p>
                <p>🔗 电击+黄色 = 连锁导电</p>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95">
              ✏️ 开始绘制冒险!
            </button>
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-amber-300 w-52">
            <h3 className="font-bold text-amber-800 mb-2 text-center text-lg border-b-2 border-dashed border-amber-200 pb-1">
              🎨 颜料精华
            </h3>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-red-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-red-600 font-medium">红色</div>
                  <div className="h-1.5 bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.min(100, paint.red)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-red-600 w-7 text-right text-sm">{paint.red}</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-blue-50 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-blue-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-blue-600 font-medium">蓝色</div>
                  <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, paint.blue)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-blue-600 w-7 text-right text-sm">{paint.blue}</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-yellow-50 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-yellow-500 shadow-inner"></div>
                <div className="flex-1">
                  <div className="text-xs text-yellow-600 font-medium">黄色</div>
                  <div className="h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, paint.yellow)}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-yellow-600 w-7 text-right text-sm">{paint.yellow}</span>
              </div>
            </div>

            <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-1">
              ✏️ 绘制防御塔
            </h3>
            
            <div className="space-y-1.5 mb-3">
              {(['red', 'blue', 'yellow'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedTowerType(selectedTowerType === type ? null : type)}
                  className={`w-full p-1.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    selectedTowerType === type
                      ? 'border-gray-800 shadow-md scale-105'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${getColorValue(type)}30, white)` }}>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm ${getStyleClass(selectedStyle)}`}
                       style={{ backgroundColor: getColorValue(type) }}>
                    {selectedStyle === 'pencil' ? '✏️' : selectedStyle === 'watercolor' ? '💧' : '🖌️'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs font-bold" style={{ color: getColorValue(type) }}>
                      {getTowerName(type)}
                    </div>
                    <div className="text-xs text-gray-500">消耗 {TOWER_COSTS[type][type]} 精华</div>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="font-bold text-amber-800 mb-1.5 text-center border-b-2 border-dashed border-amber-200 pb-1">
              🖌️ 笔触风格
            </h3>
            
            <div className="grid grid-cols-3 gap-1 mb-3">
              {(['pencil', 'watercolor', 'oil'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style
                      ? 'bg-amber-400 text-amber-900 shadow-md'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}>
                  {style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️'}
                </button>
              ))}
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 p-1.5 rounded-lg text-center">
              💡 相邻异色塔自动融合!
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-2 bg-white px-5 py-1.5 rounded-full shadow-lg border-2 border-amber-300">
              <div className="text-amber-800 font-bold flex items-center gap-1">
                <span className="text-lg">🌊</span>
                <span className="text-sm">波次 {wave}/10</span>
              </div>
              <div className="text-red-600 font-bold flex items-center gap-1">
                <span className="text-lg">❤️</span>
                <span className="text-sm">{coreHealth}</span>
              </div>
              <div className="text-amber-600 font-bold flex items-center gap-1">
                <span className="text-lg">⭐</span>
                <span className="text-sm">{score}</span>
              </div>
              <div className="text-green-600 font-bold flex items-center gap-1">
                <span className="text-lg">💀</span>
                <span className="text-sm">{enemiesKilled}</span>
              </div>
              {currentChainCount > 0 && (
                <div className="text-purple-600 font-bold flex items-center gap-1 animate-pulse">
                  <span className="text-lg">🔗</span>
                  <span className="text-sm">x{currentChainCount}</span>
                </div>
              )}
            </div>

            <div className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
                 style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE,
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)' }}>
              
              <svg className="absolute inset-0 pointer-events-none" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                {PATH_LINES.map((line, i) => (
                  <g key={i}>
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#8B4513"
                      strokeWidth="8"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#D2691E"
                      strokeWidth="4"
                      strokeDasharray="12,8"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </g>
                ))}
              </svg>

              {PATH.map((pos, i) => (
                <div key={i}
                     className="absolute rounded-lg border-2 border-dashed border-amber-400"
                     style={{
                       left: pos.x * CELL_SIZE + 3,
                       top: pos.y * CELL_SIZE + 3,
                       width: CELL_SIZE - 6,
                       height: CELL_SIZE - 6,
                       background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                       opacity: 0.7,
                       boxShadow: 'inset 0 0 10px rgba(180, 83, 9, 0.1)',
                     }} />
              ))}

              <div className="absolute flex items-center justify-center animate-pulse"
                   style={{
                     left: CORE_POSITION.x * CELL_SIZE,
                     top: CORE_POSITION.y * CELL_SIZE,
                     width: CELL_SIZE,
                     height: CELL_SIZE,
                   }}>
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
                       style={{
                         left: x * CELL_SIZE,
                         top: y * CELL_SIZE,
                         width: CELL_SIZE,
                         height: CELL_SIZE,
                       }}
                       onClick={() => placeTower(x, y)}>
                  </div>
                );
              })}

              {towers.map(tower => (
                <div key={tower.id}
                     className="absolute flex flex-col items-center justify-center cursor-pointer group tower-brush"
                     style={{
                       left: tower.x * CELL_SIZE + 2,
                       top: tower.y * CELL_SIZE + 2,
                       width: CELL_SIZE - 4,
                       height: CELL_SIZE - 4,
                     }}
                     onClick={() => upgradeTower(tower.id)}>
                  <div className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                       style={{
                         width: tower.range * CELL_SIZE * 2,
                         height: tower.range * CELL_SIZE * 2,
                         left: '50%',
                         top: '50%',
                         transform: 'translate(-50%, -50%)',
                         borderColor: getColorValue(tower.type),
                         backgroundColor: getColorValue(tower.type),
                       }} />
                  
                  <div className={`w-9 h-9 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)} ${tower.isFused ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                       style={{ 
                         background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`,
                         borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : 
                                      tower.style === 'watercolor' ? '50% 50% 50% 50%' : '8px',
                         boxShadow: `0 4px 12px ${getColorValue(tower.type)}60, inset 0 0 10px rgba(255,255,255,0.3)`,
                         border: tower.style === 'pencil' ? '2px dashed #333' : `3px solid ${getColorValue(tower.type)}`,
                       }}>
                    <span className="text-sm text-white font-bold drop-shadow-lg">
                      {tower.isFused ? '✨' : tower.style === 'pencil' ? '✏️' : tower.style === 'watercolor' ? '💧' : '🖌️'}
                      {tower.level}
                    </span>
                  </div>
                  
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg border border-gray-600">
                    {tower.level < 5 ? `⬆️ 升级: ${tower.level * 25}精华` : '⭐ 已满级'}
                  </div>
                </div>
              ))}

              {enemies.map(enemy => (
                <div key={enemy.id}
                     className="absolute flex flex-col items-center"
                     style={{
                       left: enemy.x - 18,
                       top: enemy.y - 28,
                       transition: 'none',
                     }}>
                  <div className="flex gap-0.5 mb-0.5">
                    {enemy.statuses.slice(0, 3).map(status => (
                      <span key={status.id} className="text-xs animate-pulse">
                        {getStatusIcon(status.type)}
                      </span>
                    ))}
                  </div>
                  <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-0.5 border border-gray-300">
                    <div className="h-full transition-all"
                         style={{
                           width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                           background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)`,
                         }} />
                  </div>
                  
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${enemy.statuses.some(s => s.type === 'frozen') ? 'opacity-70' : ''}`}
                       style={{
                         background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
                         boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`,
                         border: enemy.statuses.some(s => s.type === 'frozen') ? '3px solid #3498db' : '2px dashed rgba(0,0,0,0.2)',
                         animation: enemy.statuses.some(s => s.type === 'frozen') ? 'none' : 'wobble 0.6s ease-in-out infinite',
                       }}>
                    <span className="text-base drop-shadow">🎨</span>
                  </div>
                </div>
              ))}

              {reactions.map(reaction => (
                <div key={reaction.id}
                     className="absolute pointer-events-none animate-ping"
                     style={{
                       left: reaction.x - 25,
                       top: reaction.y - 25,
                       width: 50,
                       height: 50,
                       fontSize: '24px',
                       textAlign: 'center',
                       lineHeight: '50px',
                     }}>
                  {reaction.type === 'steamBurst' ? '💨' : reaction.type === 'coolingBrittle' ? '💎' : '🔗'}
                </div>
              ))}

              {projectiles.map(proj => (
                <div key={proj.id}
                     className="absolute rounded-full"
                     style={{
                       left: proj.x - 6,
                       top: proj.y - 6,
                       width: proj.type === 'pierce' || proj.type === 'explosive' ? 14 : 12,
                       height: proj.type === 'pierce' || proj.type === 'explosive' ? 14 : 12,
                       background: `radial-gradient(circle, white, ${proj.color})`,
                       boxShadow: `0 0 12px ${proj.color}, 0 0 20px ${proj.color}50`,
                       border: proj.type === 'slow' ? '2px dashed white' : 'none',
                     }} />
              ))}

              {particles.map(p => (
                <div key={p.id}
                     className="absolute rounded-full pointer-events-none"
                     style={{
                       left: p.x - p.size / 2,
                       top: p.y - p.size / 2,
                       width: p.size,
                       height: p.size,
                       background: `radial-gradient(circle, ${p.color}, ${p.color}80)`,
                       opacity: p.life / 50,
                       filter: p.type === 'reaction' ? 'blur(1px)' : 'blur(0.5px)',
                     }} />
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              {!waveInProgress ? (
                <button onClick={startWave}
                        className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg text-sm">
                  🚀 开始第 {wave} 波 {wave > 1 && `(+10全部精华)`}
                </button>
              ) : (
                <div className="px-5 py-2 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse text-sm">
                  ⚔️ 战斗中... ({enemies.length}只颜料怪)
                </div>
              )}
              
              {!waveInProgress && wave < 10 && enemies.length === 0 && (
                <button onClick={() => setWave(w => w + 1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg text-sm">
                  ⏩ 跳过
                </button>
              )}
              
              <button onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                      className="px-4 py-2 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg text-sm">
                {gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-amber-300 w-56">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-amber-800 text-sm">📖 图鉴收集</h3>
                <button 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-xs bg-gray-200 px-2 py-0.5 rounded hover:bg-gray-300">
                  {showDebugPanel ? '隐藏' : '显示'}调试
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(['red', 'blue', 'yellow'] as const).map(type =>
                  (['pencil', 'watercolor', 'oil'] as const).map(style => {
                    const key = `${type}-${style}`;
                    const collected = collectedTowers.has(key);
                    return (
                      <div key={key}
                           className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                             collected ? `${getStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'
                           }`}
                           style={{ backgroundColor: collected ? getColorValue(type) : '#f3f4f6' }}
                           title={collected ? `${type}-${style}` : '未收集'}>
                        <span className="text-sm">
                          {collected ? (
                            style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️'
                          ) : '❓'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="text-center text-xs text-amber-600 bg-amber-50 py-1 rounded mb-2">
                已收集: {collectedTowers.size} / 9
              </div>

              {showDebugPanel && (
                <>
                  <h4 className="font-bold text-amber-800 mb-1 text-sm border-b border-dashed border-amber-200 pb-1">
                    📊 战斗统计
                  </h4>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex justify-between items-center p-1 bg-red-50 rounded">
                      <span className="text-gray-600">消灭敌人</span>
                      <span className="font-bold text-red-600">{enemiesKilled}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 bg-amber-50 rounded">
                      <span className="text-gray-600">获得分数</span>
                      <span className="font-bold text-amber-600">{score}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 bg-green-50 rounded">
                      <span className="text-gray-600">最高连锁</span>
                      <span className="font-bold text-green-600">{maxChainCount}</span>
                    </div>
                  </div>

                  {towers.length > 0 && (
                    <>
                      <h4 className="font-bold text-amber-800 mb-1 text-sm border-b border-dashed border-amber-200 pb-1">
                        💥 塔伤害贡献
                      </h4>
                      <div className="space-y-1 text-xs mb-2 max-h-24 overflow-y-auto">
                        {towers.map(tower => (
                          <div key={tower.id} className="flex justify-between items-center p-1 rounded"
                               style={{ backgroundColor: `${getColorValue(tower.type)}15` }}>
                            <span className="flex items-center gap-1">
                              {tower.isFused ? '✨' : '🏗️'} {getTowerName(tower.type)} Lv.{tower.level}
                            </span>
                            <span className="font-bold" style={{ color: getColorValue(tower.type) }}>
                              {tower.damageContribution}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <h4 className="font-bold text-amber-800 mb-1 text-sm border-b border-dashed border-amber-200 pb-1">
                    📜 战斗日志
                  </h4>
                  <div className="space-y-0.5 text-xs max-h-40 overflow-y-auto bg-gray-50 rounded p-1">
                    {battleLogs.length === 0 ? (
                      <div className="text-gray-400 text-center py-2">暂无日志...</div>
                    ) : (
                      battleLogs.map(log => (
                        <div key={log.id} className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-gray-100"
                             style={{ color: log.color }}>
                          <span className="opacity-70">•</span>
                          <span className="truncate">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {enemies.length > 0 && showDebugPanel && (
              <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-purple-300 w-56">
                <h3 className="font-bold text-purple-800 mb-2 text-center text-sm border-b-2 border-dashed border-purple-200 pb-1">
                  🎯 敌人状态
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {enemies.map(enemy => (
                    <div key={enemy.id} className="bg-gray-50 rounded p-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold" style={{ color: enemy.color }}>
                          敌人 #{enemy.id}
                        </span>
                        <span className="text-xs text-gray-600">
                          {Math.round(enemy.health)}/{enemy.maxHealth}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                        <div className="h-full transition-all"
                             style={{
                               width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                               background: enemy.color,
                             }} />
                      </div>
                      {enemy.statuses.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {enemy.statuses.map(status => (
                            <div key={status.id} className="flex items-center gap-0.5 bg-gray-100 rounded px-1 text-xs">
                              <span>{getStatusIcon(status.type)}</span>
                              <span>{status.stacks}x</span>
                              <span className="text-gray-500">{Math.ceil(status.duration)}s</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-300 max-w-md transform -rotate-1">
          <div className="transform rotate-1">
            <h2 className="text-4xl font-bold text-red-600 mb-4" style={{ fontFamily: 'cursive' }}>
              💔 画布被污染了...
            </h2>
            <p className="text-red-400 mb-6">颜料怪占领了你的画布核心</p>
            
            <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-red-800">
                <span>🌊 坚持波次</span>
                <span className="font-bold">{wave}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>💀 消灭敌人</span>
                <span className="font-bold">{enemiesKilled}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>⭐ 最终分数</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>🔗 最高连锁</span>
                <span className="font-bold">{maxChainCount}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>📖 收集图鉴</span>
                <span className="font-bold">{collectedTowers.size}/9</span>
              </div>
            </div>
            
            <button onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg">
              🎨 重新开始
            </button>
          </div>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-300 max-w-md transform rotate-1">
          <div className="transform -rotate-1">
            <h2 className="text-4xl font-bold text-green-600 mb-4" style={{ fontFamily: 'cursive' }}>
              🎉 画布已守护成功!
            </h2>
            <p className="text-green-400 mb-6">你成功击退了所有颜料怪的入侵!</p>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-green-800">
                <span>🏆 完成波次</span>
                <span className="font-bold">10/10</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>💀 消灭敌人</span>
                <span className="font-bold">{enemiesKilled}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>⭐ 最终分数</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>🔗 最高连锁</span>
                <span className="font-bold">{maxChainCount}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>📖 收集图鉴</span>
                <span className="font-bold">{collectedTowers.size}/9</span>
              </div>
            </div>
            
            <button onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg">
              🎨 再来一局!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}