import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// 类型定义
// ============================================================

type ElementColor = 'red' | 'blue' | 'yellow';
type FusionColor = 'purple' | 'orange' | 'green' | 'white';
type TowerColor = ElementColor | FusionColor;
type StatusType = 'burn' | 'freeze' | 'shock' | 'corrode' | 'explosive';
type ReactionType = 'steam_burst' | 'cold_brittle' | 'chain_conduct';

interface Position {
  x: number;
  y: number;
}

interface StatusInstance {
  type: StatusType;
  remaining: number;
  maxDuration: number;
  stacks: number;
  maxStacks: number;
  damagePerTick: number;
  sourceColor: TowerColor;
}

interface EnemyElementInfo {
  resistances: Record<ElementColor, number>;
  weaknesses: Record<ElementColor, number>;
  immunities: StatusType[];
  colorType: 'red' | 'blue' | 'yellow' | 'mixed';
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
  elementInfo: EnemyElementInfo;
  pathIndex: number;
  statuses: StatusInstance[];
  freezeImmuneUntil: number;
  shockCooldownUntil: number;
  shockJumped: boolean;
  lastAttackColor: TowerColor | null;
}

interface Tower {
  id: number;
  x: number;
  y: number;
  type: ElementColor;
  fusionType: FusionColor | null;
  fusionPartners: number[];
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: 'pencil' | 'watercolor' | 'oil';
  totalDamageDealt: number;
  stage: number;
  stageTimer: number;
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
  type: 'normal' | 'slow' | 'pierce' | 'corrode' | 'explosive' | 'bounce';
  element: TowerColor;
  bounceCount: number;
  bounceTargets: number[];
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
  effect: 'normal' | 'burn' | 'freeze' | 'shock' | 'corrode' | 'explosive' | 'reaction';
}

interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

interface BattleLogEntry {
  id: number;
  message: string;
  type: 'reaction' | 'fusion' | 'status' | 'kill' | 'chain';
  color: string;
  timestamp: number;
}

// ============================================================
// 游戏常量
// ============================================================

const GRID_SIZE = 10;
const CELL_SIZE = 50;

const STATUS_CONFIG: Record<StatusType, {
  maxStacks: number;
  baseDuration: number;
  damagePerStack: number;
  color: string;
  icon: string;
  priority: number;
}> = {
  burn: { maxStacks: 3, baseDuration: 180, damagePerStack: 0.15, color: '#ff6b35', icon: '🔥', priority: 3 },
  freeze: { maxStacks: 1, baseDuration: 90, damagePerStack: 0, color: '#5dade2', icon: '❄️', priority: 1 },
  shock: { maxStacks: 5, baseDuration: 120, damagePerStack: 0.1, color: '#f4d03f', icon: '⚡', priority: 2 },
  corrode: { maxStacks: 3, baseDuration: 240, damagePerStack: 0.2, color: '#8e44ad', icon: '☠️', priority: 4 },
  explosive: { maxStacks: 1, baseDuration: 9999, damagePerStack: 0, color: '#e67e22', icon: '💥', priority: 5 },
};

const FUSION_RULES: Record<string, { type: FusionColor; name: string; color: string; icon: string; desc: string }> = {
  'red,blue': { type: 'purple', name: '腐蚀紫塔', color: '#8e44ad', icon: '☠️', desc: '持续腐蚀伤害' },
  'blue,red': { type: 'purple', name: '腐蚀紫塔', color: '#8e44ad', icon: '☠️', desc: '持续腐蚀伤害' },
  'red,yellow': { type: 'orange', name: '爆裂橙塔', color: '#e67e22', icon: '💥', desc: '范围爆炸伤害' },
  'yellow,red': { type: 'orange', name: '爆裂橙塔', color: '#e67e22', icon: '💥', desc: '范围爆炸伤害' },
  'blue,yellow': { type: 'green', name: '弹射绿塔', color: '#27ae60', icon: '🎯', desc: '减速和连锁弹射' },
  'yellow,blue': { type: 'green', name: '弹射绿塔', color: '#27ae60', icon: '🎯', desc: '减速和连锁弹射' },
};

const REACTION_CONFIG: Record<ReactionType, { name: string; color: string; icon: string }> = {
  steam_burst: { name: '蒸汽爆发', color: '#aed6f1', icon: '💨' },
  cold_brittle: { name: '冷却脆化', color: '#85c1e9', icon: '❄️' },
  chain_conduct: { name: '连锁导电', color: '#f9e79f', icon: '⚡🔗' },
};

const PATH: Position[] = [
  { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 2 },
  { x: 5, y: 2 }, { x: 5, y: 6 }, { x: 7, y: 6 },
  { x: 7, y: 4 }, { x: 9, y: 4 },
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

const TOWER_COSTS: Record<ElementColor, PaintEssence> = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
};

// ============================================================
// 辅助函数
// ============================================================

const sortKey = (a: string, b: string): string => [a, b].sort().join(',');

const isAdjacent = (a: Position, b: Position): boolean =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

const getFusionType = (a: ElementColor, b: ElementColor): FusionColor | null => {
  const key = sortKey(a, b);
  return (FUSION_RULES[key]?.type as FusionColor) ?? null;
};

const getElementInfo = (colorType: 'red' | 'blue' | 'yellow' | 'mixed'): EnemyElementInfo => {
  const base: EnemyElementInfo = {
    resistances: { red: 0, blue: 0, yellow: 0 },
    weaknesses: { red: 1, blue: 1, yellow: 1 },
    immunities: [],
    colorType,
  };
  switch (colorType) {
    case 'red':
      base.resistances.red = 0.4;
      base.weaknesses.blue = 1.5;
      return base;
    case 'blue':
      base.resistances.blue = 0.4;
      base.weaknesses.yellow = 1.5;
      return base;
    case 'yellow':
      base.resistances.yellow = 0.4;
      base.weaknesses.red = 1.5;
      return base;
    case 'mixed':
      base.resistances = { red: 0.25, blue: 0.25, yellow: 0.25 };
      base.weaknesses = { red: 1, blue: 1, yellow: 1 };
      base.immunities = ['freeze'];
      return base;
  }
};

const FUSION_PROJECTILE_CONFIG: Record<FusionColor, { damageMultiplier: number; range: number; extra: string }> = {
  purple: { damageMultiplier: 1.3, range: 3, extra: 'corrode' },
  orange: { damageMultiplier: 1.8, range: 2.5, extra: 'explosive' },
  green: { damageMultiplier: 0.9, range: 3.5, extra: 'bounce' },
  white: { damageMultiplier: 2.0, range: 4, extra: 'all' },
};

// ============================================================
// 主组件
// ============================================================

export default function CanvasDefender() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'victory'>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(100);
  const [paint, setPaint] = useState<PaintEssence>({ red: 50, blue: 50, yellow: 50 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<ElementColor | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'pencil' | 'watercolor' | 'oil'>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [maxChainCount, setMaxChainCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const logIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const reactionCooldownsRef = useRef<Map<string, number>>(new Map());

  const getColorValue = (type: TowerColor): string => {
    const colors: Record<TowerColor, string> = {
      red: '#e74c3c', blue: '#3498db', yellow: '#f39c12',
      purple: '#8e44ad', orange: '#e67e22', green: '#27ae60', white: '#ecf0f1',
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

  // ---- 战斗日志 ----
  const addLog = useCallback((message: string, type: BattleLogEntry['type'], color: string = '#8B4513') => {
    const entry: BattleLogEntry = {
      id: logIdRef.current++,
      message,
      type,
      color,
      timestamp: Date.now(),
    };
    setBattleLog(prev => {
      const next = [entry, ...prev];
      return next.slice(0, 60);
    });
  }, []);

  // ---- 粒子效果 ----
  const createParticles = useCallback((
    x: number, y: number, color: string, count: number = 5,
    effect: Particle['effect'] = 'normal'
  ) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x, y, color, effect,
        size: 4 + Math.random() * 4,
        life: 30 + Math.random() * 20,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createReactionParticles = useCallback((x: number, y: number, reactionType: ReactionType) => {
    const config = REACTION_CONFIG[reactionType];
    const count = 15;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: particleIdRef.current++,
        x, y,
        color: config.color,
        size: 5 + Math.random() * 5,
        life: 25 + Math.random() * 30,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        effect: 'reaction',
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // ---- 状态效果操作 ----
  const applyStatus = useCallback((
    enemy: Enemy,
    statusType: StatusType,
    sourceColor: TowerColor,
    currentTime: number
  ): Enemy => {
    const config = STATUS_CONFIG[statusType];
    const immunity = enemy.elementInfo.immunities.includes(statusType);

    // 冻结免疫检查
    if (statusType === 'freeze' && currentTime < enemy.freezeImmuneUntil) return enemy;
    if (immunity) return enemy;

    const existing = enemy.statuses.find(s => s.type === statusType);
    const newStatuses = [...enemy.statuses];

    if (existing) {
      // 刷新持续时间，叠加层数
      const newStacks = Math.min(existing.stacks + 1, config.maxStacks);
      existing.remaining = config.baseDuration;
      existing.maxDuration = config.baseDuration;
      existing.stacks = newStacks;
      existing.damagePerTick = config.damagePerStack * newStacks;
    } else {
      newStatuses.push({
        type: statusType,
        remaining: config.baseDuration,
        maxDuration: config.baseDuration,
        stacks: 1,
        maxStacks: config.maxStacks,
        damagePerTick: config.damagePerStack,
        sourceColor,
      });
    }

    // 冻结: 降低速度
    let speed = enemy.speed;
    if (statusType === 'freeze') {
      speed = enemy.baseSpeed * 0.05;
    } else if (statusType === 'shock') {
      speed = enemy.baseSpeed * 0.7;
    }

    return {
      ...enemy,
      statuses: newStatuses,
      speed,
      lastAttackColor: sourceColor,
    };
  }, []);

  // ---- 元素反应检查 ----
  const checkReactions = useCallback((
    enemy: Enemy,
    attackerColor: TowerColor,
    currentTime: number
  ): { enemy: Enemy; triggerReaction: ReactionType | null; bonusDamage: number } => {
    let updatedEnemy = { ...enemy, statuses: [...enemy.statuses] };
    let triggerReaction: ReactionType | null = null;
    let bonusDamage = 0;

    const hasStatus = (type: StatusType) => updatedEnemy.statuses.some(s => s.type === type);
    const removeStatus = (type: StatusType) => {
      updatedEnemy.statuses = updatedEnemy.statuses.filter(s => s.type !== type);
    };

    // 冷却检查 (每个反应有独立冷却，避免重复触发)
    const cooldownKey = `${enemy.id}-reaction`;
    const lastTrigger = reactionCooldownsRef.current.get(cooldownKey) ?? 0;
    if (currentTime - lastTrigger < 500) return { enemy: updatedEnemy, triggerReaction: null, bonusDamage: 0 };

    // 蒸汽爆发: 冻结敌人 + 红色攻击
    if (hasStatus('freeze') && (attackerColor === 'red' || attackerColor === 'orange')) {
      triggerReaction = 'steam_burst';
      bonusDamage = 12 + updatedEnemy.maxHealth * 0.15;
      removeStatus('freeze');
      updatedEnemy.speed = updatedEnemy.baseSpeed;
      updatedEnemy.freezeImmuneUntil = currentTime + 3000;
    }
    // 冷却脆化: 灼烧敌人 + 蓝色攻击
    else if (hasStatus('burn') && (attackerColor === 'blue' || attackerColor === 'green')) {
      triggerReaction = 'cold_brittle';
      bonusDamage = 10 + updatedEnemy.maxHealth * 0.2;
      removeStatus('burn');
    }

    if (triggerReaction) {
      reactionCooldownsRef.current.set(cooldownKey, currentTime);
    }

    return { enemy: updatedEnemy, triggerReaction, bonusDamage };
  }, []);

  // ---- 连锁导电 (shocked enemy dies) ----
  const triggerChainConduct = useCallback((
    deadEnemy: Enemy,
    allEnemies: Enemy[],
    currentTime: number
  ): { updatedEnemies: Enemy[]; chainCount: number } => {
    if (deadEnemy.shockJumped) return { updatedEnemies: allEnemies, chainCount: 0 };

    const shocked = deadEnemy.statuses.find(s => s.type === 'shock');
    if (!shocked) return { updatedEnemies: allEnemies, chainCount: 0 };

    // 找到范围内的其他敌人
    const jumpRange = 120;
    const targets = allEnemies
      .filter(e => e.id !== deadEnemy.id)
      .filter(e => {
        const dist = Math.sqrt((e.x - deadEnemy.x) ** 2 + (e.y - deadEnemy.y) ** 2);
        return dist <= jumpRange;
      })
      .sort((a, b) => {
        const dA = Math.sqrt((a.x - deadEnemy.x) ** 2 + (a.y - deadEnemy.y) ** 2);
        const dB = Math.sqrt((b.x - deadEnemy.x) ** 2 + (b.y - deadEnemy.y) ** 2);
        return dA - dB;
      });

    if (targets.length === 0) return { updatedEnemies: allEnemies, chainCount: 0 };

    const jumpDamage = 8 + shocked.stacks * 4;
    let chainCount = 0;
    let updatedEnemies = allEnemies.map(e => e);

    // 弹射到最多3个敌人
    for (let i = 0; i < Math.min(targets.length, 3); i++) {
      const target = targets[i];
      chainCount++;
      const idx = updatedEnemies.findIndex(e => e.id === target.id);
      if (idx === -1) continue;

      let targetEnemy = { ...updatedEnemies[idx] };
      targetEnemy.health = Math.max(0, targetEnemy.health - jumpDamage);
      targetEnemy = applyStatus(targetEnemy, 'shock', 'yellow', currentTime);
      targetEnemy.shockJumped = true;
      updatedEnemies[idx] = targetEnemy;

      createParticles(targetEnemy.x, targetEnemy.y, '#f4d03f', 6, 'shock');
      createParticles(deadEnemy.x, deadEnemy.y, '#f9e79f', 3, 'reaction');

      if (targetEnemy.health <= 0) {
        // 递归连锁
        const subResult = triggerChainConduct(targetEnemy, updatedEnemies, currentTime);
        updatedEnemies = subResult.updatedEnemies;
        chainCount += subResult.chainCount;
      }
    }

    return { updatedEnemies, chainCount };
  }, [applyStatus, createParticles]);

  // ---- 塔邻接与融合 ----
  const checkAndFuseTowers = useCallback((existingTowers: Tower[]): Tower[] => {
    if (existingTowers.length < 2) return existingTowers;

    const result = [...existingTowers];
    const fusedIds = new Set<number>();

    // 检查 white 融合 (红+蓝+黄 三角邻接)
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        for (let k = j + 1; k < result.length; k++) {
          const a = result[i], b = result[j], c = result[k];
          if (a.fusionType || b.fusionType || c.fusionType) continue;
          const types = new Set([a.type, b.type, c.type]);
          if (types.size !== 3) continue;
          const adjAB = isAdjacent(a, b);
          const adjBC = isAdjacent(b, c);
          const adjCA = isAdjacent(c, a);
          if (!adjAB || !adjBC || !adjCA) continue;

          // 三塔融合为白色核心
          fusedIds.add(a.id); fusedIds.add(b.id); fusedIds.add(c.id);
          const avgX = Math.round((a.x + b.x + c.x) / 3);
          const avgY = Math.round((a.y + b.y + c.y) / 3);
          const maxLvl = Math.max(a.level, b.level, c.level);
          const fusion: Tower = {
            id: towerIdRef.current++,
            x: avgX, y: avgY,
            type: 'red' as ElementColor,
            fusionType: 'white',
            fusionPartners: [a.id, b.id, c.id],
            level: maxLvl + 1,
            range: 4,
            damage: Math.floor((a.damage + b.damage + c.damage) * 0.8),
            attackSpeed: 1000,
            lastAttack: 0,
            style: a.style,
            totalDamageDealt: 0,
            stage: 1,
            stageTimer: 0,
          };
          result.push(fusion);
          addLog('⚪ 白色核心塔融合完成！（红+蓝+黄）', 'fusion', '#ecf0f1');
          createParticles(avgX * CELL_SIZE + CELL_SIZE / 2, avgY * CELL_SIZE + CELL_SIZE / 2, '#ffffff', 20, 'reaction');
          break;
        }
      }
    }

    // 检查两两融合
    const excluded = new Set(fusedIds);
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (excluded.has(result[i].id) || excluded.has(result[j].id)) continue;
        const a = result[i], b = result[j];
        if (a.fusionType || b.fusionType) continue;
        if (a.type === b.type) continue; // 同色不融合
        if (!isAdjacent(a, b)) continue;

        const fusionType = getFusionType(a.type, b.type);
        if (!fusionType) continue;

        excluded.add(a.id); excluded.add(b.id);
        const avgX = Math.round((a.x + b.x) / 2);
        const avgY = Math.round((a.y + b.y) / 2);
        const maxLvl = Math.max(a.level, b.level);
        const config = FUSION_RULES[`${a.type},${b.type}`];
        const projConfig = FUSION_PROJECTILE_CONFIG[fusionType];

        const fusion: Tower = {
          id: towerIdRef.current++,
          x: avgX, y: avgY,
          type: a.type,
          fusionType,
          fusionPartners: [a.id, b.id],
          level: maxLvl + 1,
          range: projConfig.range,
          damage: Math.floor((a.damage + b.damage) * projConfig.damageMultiplier / 2),
          attackSpeed: Math.floor((a.attackSpeed + b.attackSpeed) / 2),
          lastAttack: 0,
          style: a.style,
          totalDamageDealt: 0,
          stage: 1,
          stageTimer: 0,
        };

        result.push(fusion);
        addLog(`${config.icon} ${config.name}融合完成！（${config.desc}）`, 'fusion', config.color);
        createParticles(avgX * CELL_SIZE + CELL_SIZE / 2, avgY * CELL_SIZE + CELL_SIZE / 2, config.color, 15, 'reaction');
      }
    }

    return result.filter(t => !excluded.has(t.id));
  }, [addLog, createParticles]);

  // ---- 能否放置塔 ----
  const canPlaceTower = (x: number, y: number): boolean => {
    const isOnPath = PATH.some(p => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    const hasTower = towers.some(t => t.x === x && t.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  };

  // ---- 放置塔 ----
  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (!canPlaceTower(x, y)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    if (paint.red < cost.red || paint.blue < cost.blue || paint.yellow < cost.yellow) return;

    const styleMultiplier = selectedStyle === 'pencil' ? 0.8 : selectedStyle === 'watercolor' ? 1.0 : 1.2;
    const newTower: Tower = {
      id: towerIdRef.current++,
      x, y,
      type: selectedTowerType,
      fusionType: null,
      fusionPartners: [],
      level: 1,
      range: 2.5,
      damage: Math.floor(15 * styleMultiplier),
      attackSpeed: selectedStyle === 'watercolor' ? 1200 : selectedStyle === 'pencil' ? 800 : 1500,
      lastAttack: 0,
      style: selectedStyle,
      totalDamageDealt: 0,
      stage: 1,
      stageTimer: 0,
    };

    setPaint(prev => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));

    const towerKey = `${selectedTowerType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers(prev => new Set(prev).add(towerKey));
    }

    // 放置后检查融合
    setTowers(prev => {
      const allTowers = [...prev, newTower];
      return checkAndFuseTowers(allTowers);
    });
  };

  // ---- 生成敌人 ----
  const spawnEnemy = useCallback(() => {
    const colorTypes: Array<'red' | 'blue' | 'yellow' | 'mixed'> = ['red', 'blue', 'yellow'];
    if (wave >= 3) colorTypes.push('mixed');
    const type = colorTypes[Math.floor(Math.random() * colorTypes.length)];

    const colors: Record<string, string[]> = {
      red: ['#c0392b'],
      blue: ['#2980b9'],
      yellow: ['#d68910'],
      mixed: ['#8e44ad', '#16a085', '#d35400'],
    };

    const colorArr = colors[type];
    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: 40 + wave * 15,
      maxHealth: 40 + wave * 15,
      baseSpeed: 35 + Math.min(wave * 3, 25),
      speed: 35 + Math.min(wave * 3, 25),
      color: colorArr[Math.floor(Math.random() * colorArr.length)],
      elementInfo: getElementInfo(type),
      pathIndex: 0,
      statuses: [],
      freezeImmuneUntil: 0,
      shockCooldownUntil: 0,
      shockJumped: false,
      lastAttackColor: null,
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [wave]);

  // ---- 开始波次 ----
  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  };

  // ---- 获取弹射目标 ----
  const getBounceTargets = (from: Position, enemies: Enemy[], excludeId: number, maxCount: number): Enemy[] => {
    const range = 130;
    return enemies
      .filter(e => e.id !== excludeId)
      .filter(e => {
        const dist = Math.sqrt((e.x - from.x) ** 2 + (e.y - from.y) ** 2);
        return dist <= range;
      })
      .sort((a, b) => {
        const dA = Math.sqrt((a.x - from.x) ** 2 + (a.y - from.y) ** 2);
        const dB = Math.sqrt((b.x - from.x) ** 2 + (b.y - from.y) ** 2);
        return dA - dB;
      })
      .slice(0, maxCount);
  };

  // ---- 主游戏循环 ----
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    const delta = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    // ---- 波次管理 ----
    if (waveInProgress) {
      spawnTimerRef.current += delta;
      const enemiesPerWave = 5 + wave * 3;
      const spawnRate = 1.5 - Math.min(wave * 0.1, 0.8);

      if (enemiesSpawnedRef.current < enemiesPerWave && spawnTimerRef.current >= spawnRate) {
        spawnEnemy();
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      setEnemies(prev => {
        if (enemiesSpawnedRef.current >= enemiesPerWave && prev.length === 0) {
          setWaveInProgress(false);
          if (wave >= 10) {
            setGameState('victory');
          } else {
            const bonus: PaintEssence = { red: 10, blue: 10, yellow: 10 };
            setPaint(p => ({ red: p.red + bonus.red, blue: p.blue + bonus.blue, yellow: p.yellow + bonus.yellow }));
          }
        }
        return prev;
      });
    }

    // ---- 敌人移动 & 状态tick ----
    setEnemies(prev => {
      const updatedEnemies: Enemy[] = [];
      let damage = 0;

      prev.forEach(enemy => {
        if (enemy.pathIndex >= PATH.length - 1) {
          damage += 10;
          return;
        }

        // 状态效果 tick
        let mutated = { ...enemy, statuses: [...enemy.statuses] };
        let statusDamage = 0;
        const newStatuses: StatusInstance[] = [];

        mutated.statuses.forEach(status => {
          status.remaining--;

          // 灼烧：持续掉血
          if (status.type === 'burn' && status.stacks > 0) {
            statusDamage += status.damagePerTick;
          }
          // 腐蚀：持续掉血
          if (status.type === 'corrode' && status.stacks > 0) {
            statusDamage += status.damagePerTick;
          }
          // 电击：持续掉血
          if (status.type === 'shock' && status.stacks > 0) {
            statusDamage += status.damagePerTick;
          }

          if (status.remaining > 0) {
            newStatuses.push(status);
          } else {
            // 状态过期：恢复效果
            if (status.type === 'freeze') {
              mutated.freezeImmuneUntil = now + 2500;
              mutated.speed = mutated.baseSpeed;
            }
            if (status.type === 'shock') {
              mutated.speed = mutated.baseSpeed;
            }
          }
        });

        mutated.statuses = newStatuses;
        mutated.health -= statusDamage;

        // 状态优先级结算：冻结 > 电击 > 灼烧 > 腐蚀 > 爆裂
        const hasFreeze = mutated.statuses.some(s => s.type === 'freeze');
        const hasShock = mutated.statuses.some(s => s.type === 'shock');

        if (hasFreeze) {
          mutated.speed = mutated.baseSpeed * 0.05;
        } else if (hasShock) {
          mutated.speed = mutated.baseSpeed * 0.7;
        } else if (mutated.statuses.length === 0) {
          mutated.speed = mutated.baseSpeed;
        }

        // 冻结免疫超时
        if (now > mutated.freezeImmuneUntil && mutated.freezeImmuneUntil > 0) {
          mutated.freezeImmuneUntil = 0;
        }

        // 电击冷却超时
        if (now > mutated.shockCooldownUntil && mutated.shockCooldownUntil > 0) {
          mutated.shockCooldownUntil = 0;
          mutated.shockJumped = false;
        }

        // 移动
        const target = {
          x: PATH[enemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
          y: PATH[enemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
        };
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          mutated.pathIndex++;
        } else {
          mutated.x += (dx / dist) * mutated.speed * delta;
          mutated.y += (dy / dist) * mutated.speed * delta;
        }

        // 死亡处理
        if (mutated.health <= 0) {
          // 爆裂效果：死亡时爆炸
          const hasExplosive = mutated.statuses.some(s => s.type === 'explosive');
          if (hasExplosive) {
            createParticles(mutated.x, mutated.y, '#e67e22', 15, 'explosive');
            // 对周围敌人造成伤害（在下面的setEnemies中处理）
          }

          // 连锁导电
          if (mutated.statuses.some(s => s.type === 'shock')) {
            // 将在处理完爆炸后再处理
          }

          const paintGain = 8 + Math.floor(mutated.maxHealth / 15);
          const colorType = mutated.elementInfo.colorType === 'mixed'
            ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
            : mutated.elementInfo.colorType;

          setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + paintGain }));
          setScore(s => s + 15 + Math.floor(mutated.maxHealth / 10));
          setEnemiesKilled(k => k + 1);
          createParticles(mutated.x, mutated.y, mutated.color, 8, 'normal');
          addLog(`💀 消灭 ${mutated.elementInfo.colorType} 颜料怪`, 'kill', mutated.color);
        } else {
          updatedEnemies.push(mutated);
        }
      });

      if (damage > 0) {
        setCoreHealth(h => Math.max(0, h - damage));
      }

      return updatedEnemies;
    });

    // 处理连锁导电和爆裂（在敌人状态更新后）
    setEnemies(prevEnemies => {
      let result = [...prevEnemies];

      // 先检查所有带 shock 且即将死亡的（在上一帧中已标记）
      // 实际上我们在上一帧已经处理了死亡，这里做连锁检查
      const shockedIds = new Set<number>();
      result.forEach(e => {
        if (e.health > 0 && e.statuses.some(s => s.type === 'shock')) {
          shockedIds.add(e.id);
        }
      });

      // 对每个带 shock 的敌人检查是否有已死亡需要触发连锁的
      // 这在实际游戏中是由死亡事件驱动的，我们这里处理帧间的逻辑
      
      return result;
    });

    // ---- 核心生命检查 ----
    setCoreHealth(h => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    // ---- 塔攻击 ----
    setTowers(prevTowers => {
      const currentTime = now;
      let chainThisWave = 0;

      prevTowers.forEach(tower => {
        if (currentTime - tower.lastAttack < tower.attackSpeed) return;

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

        const effectiveRange = tower.range * CELL_SIZE;
        const inRange = enemies.filter(e => {
          const dist = Math.sqrt((e.x - towerCenterX) ** 2 + (e.y - towerCenterY) ** 2);
          return dist <= effectiveRange;
        });

        if (inRange.length === 0) return;

        tower.lastAttack = currentTime;

        const fusionType = tower.fusionType;
        const baseDamage = tower.damage * tower.level;
        let elementColor: TowerColor = tower.type;

        if (fusionType) {
          elementColor = fusionType;
        }

        // 白色核心多阶段技能
        if (fusionType === 'white') {
          tower.stageTimer++;
          if (tower.stageTimer >= 600) { // ~10 seconds per stage
            tower.stage = tower.stage >= 3 ? 1 : tower.stage + 1;
            tower.stageTimer = 0;
            addLog(`⚪ 白色核心进入阶段 ${tower.stage}`, 'status', '#ecf0f1');
          }
        }

        let projectileType: Projectile['type'] = 'normal';

        if (fusionType === 'orange') projectileType = 'explosive';
        else if (fusionType === 'green') projectileType = 'bounce';
        else if (fusionType === 'purple') projectileType = 'corrode';
        else if (tower.type === 'blue') projectileType = 'slow';
        else if (tower.type === 'yellow') projectileType = 'pierce';

        const target = inRange[0];

        // 白色核心：根据阶段释放不同技能
        let finalDamage = baseDamage;
        let bounceTargets: Enemy[] = [];
        if (fusionType === 'white') {
          if (tower.stage === 1) {
            finalDamage = baseDamage * 1.5;
            projectileType = 'normal';
          } else if (tower.stage === 2) {
            finalDamage = baseDamage * 0.8;
            projectileType = 'bounce';
            bounceTargets = getBounceTargets({ x: target.x, y: target.y }, inRange, target.id, 3);
          } else {
            finalDamage = baseDamage * 0.6;
            projectileType = 'explosive';
          }
        }

        const projectile: Projectile = {
          id: projectileIdRef.current++,
          x: towerCenterX,
          y: towerCenterY,
          targetX: target.x,
          targetY: target.y,
          color: fusionType ? getColorValue(fusionType) : getColorValue(tower.type),
          speed: 350,
          damage: finalDamage,
          type: projectileType,
          element: elementColor,
          bounceCount: 0,
          bounceTargets: bounceTargets.map(e => e.id),
        };

        setProjectiles(p => [...p, projectile]);
      });

      // 更新 maxChainCount
      if (chainThisWave > maxChainCount) {
        setMaxChainCount(chainThisWave);
      }

      return [...prevTowers];
    });

    // ---- 弹丸移动和命中 ----
    setProjectiles(prev => {
      const remaining: Projectile[] = [];

      prev.forEach(proj => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          // 命中目标
          setEnemies(currentEnemies => {
            let updated = currentEnemies.map(e => e);
            const hitRange = proj.type === 'pierce' || proj.type === 'explosive' ? 65 : 25;

            // 找到命中的敌人
            updated = updated.map(e => {
              const eDist = Math.sqrt((e.x - proj.x) ** 2 + (e.y - proj.y) ** 2);
              if (eDist >= hitRange) return e;

              let mutated = { ...e, statuses: [...e.statuses], health: e.health };

              // 计算元素抗性伤害
              let effectiveDamage = proj.damage;
              const elementKey = proj.element as ElementColor;
              if (elementKey && mutated.elementInfo) {
                const resistance = mutated.elementInfo.resistances[elementKey] ?? 0;
                const weakness = mutated.elementInfo.weaknesses[elementKey] ?? 1;
                effectiveDamage = effectiveDamage * (1 - resistance) * weakness;
              }

              // 腐蚀降低抗性
              const hasCorrode = mutated.statuses.some(s => s.type === 'corrode');
              if (hasCorrode) {
                effectiveDamage *= 1.2;
              }

              // 检查元素反应
              const reactionResult = checkReactions(mutated, proj.element, now);
              mutated = reactionResult.enemy;
              let reactionTriggered = reactionResult.triggerReaction;
              let bonusDamage = reactionResult.bonusDamage;

              effectiveDamage += bonusDamage;

              // 应用状态效果
              if (proj.element === 'red' || proj.element === 'orange') {
                mutated = applyStatus(mutated, 'burn', proj.element, now);
              } else if (proj.element === 'blue' || proj.element === 'green') {
                mutated = applyStatus(mutated, 'freeze', proj.element, now);
              } else if (proj.element === 'yellow') {
                mutated = applyStatus(mutated, 'shock', proj.element, now);
              } else if (proj.element === 'purple') {
                mutated = applyStatus(mutated, 'corrode', proj.element, now);
              }

              if (proj.type === 'explosive') {
                mutated = applyStatus(mutated, 'explosive', proj.element, now);
              }

              mutated.health -= effectiveDamage;

              // 反应粒子效果
              if (reactionTriggered) {
                createReactionParticles(mutated.x, mutated.y, reactionTriggered);
                const reactionCfg = REACTION_CONFIG[reactionTriggered];
                addLog(`${reactionCfg.icon} ${reactionCfg.name}触发！+${Math.floor(bonusDamage)}伤害`, 'reaction', reactionCfg.color);
              }

              // 粒子效果
              const statusEffect = proj.element === 'red' ? 'burn' :
                proj.element === 'blue' ? 'freeze' :
                proj.element === 'yellow' ? 'shock' :
                proj.element === 'purple' ? 'corrode' :
                proj.element === 'orange' ? 'explosive' : 'normal';
              createParticles(mutated.x, mutated.y, proj.color, 4, statusEffect);

              // 减速效果
              if (proj.type === 'slow') {
                mutated.speed = Math.max(8, mutated.baseSpeed * 0.55);
              }

              // 死亡处理
              if (mutated.health <= 0) {
                // 爆裂 AOE
                if (mutated.statuses.some(s => s.type === 'explosive')) {
                  createParticles(mutated.x, mutated.y, '#e67e22', 18, 'explosive');
                  addLog('💥 爆裂！对周围敌人造成伤害', 'chain', '#e67e22');
                  // AOE damage will be applied below
                }

                return { ...mutated, health: -1 }; // mark for removal
              }

              return mutated;
            });

            // 处理爆炸AOE
            const deadEnemies = updated.filter(e => e.health < 0);
            updated = updated.filter(e => e.health >= 0);

            deadEnemies.forEach(dead => {
              const hadExplosive = dead.statuses.some(s => s.type === 'explosive');
              if (hadExplosive) {
                const explodeDmg = 20 + dead.maxHealth * 0.1;
                updated = updated.map(e => {
                  const aoeDist = Math.sqrt((e.x - dead.x) ** 2 + (e.y - dead.y) ** 2);
                  if (aoeDist <= 80) {
                    return { ...e, health: e.health - explodeDmg, statuses: [...e.statuses] };
                  }
                  return e;
                });
              }

              // 连锁导电
              const hadShock = dead.statuses.some(s => s.type === 'shock');
              if (hadShock && !dead.shockJumped) {
                const chainResult = triggerChainConduct({ ...dead, shockJumped: false }, updated, now);
                updated = chainResult.updatedEnemies;
                if (chainResult.chainCount > 0) {
                  addLog(`⚡🔗 连锁导电 ×${chainResult.chainCount}！`, 'chain', '#f4d03f');
                  if (chainResult.chainCount > maxChainCount) {
                    setMaxChainCount(chainResult.chainCount);
                  }
                }
              }

              // 正常死亡奖励
              const paintGain = 8 + Math.floor(dead.maxHealth / 15);
              const colorType = dead.elementInfo?.colorType === 'mixed'
                ? (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)]
                : (dead.elementInfo?.colorType ?? 'red');

              setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + paintGain }));
              setScore(s => s + 15 + Math.floor(dead.maxHealth / 10));
              setEnemiesKilled(k => k + 1);
              createParticles(dead.x, dead.y, dead.color, 10, 'normal');
            });

            // 过滤死亡
            updated = updated.filter(e => e.health > 0);

            return updated;
          });

          // 弹射处理
          if (proj.type === 'bounce' && proj.bounceCount < 3) {
            const bounceEnemies = getBounceTargets(
              { x: proj.targetX, y: proj.targetY },
              enemies.filter(e => !proj.bounceTargets.includes(e.id)),
              -1, 1
            );
            if (bounceEnemies.length > 0) {
              const nextTarget = bounceEnemies[0];
              remaining.push({
                ...proj,
                x: proj.targetX,
                y: proj.targetY,
                targetX: nextTarget.x,
                targetY: nextTarget.y,
                damage: proj.damage * 0.7,
                bounceCount: proj.bounceCount + 1,
                bounceTargets: [...proj.bounceTargets, nextTarget.id],
              });
            }
          }
        } else {
          proj.x += (dx / dist) * proj.speed * delta;
          proj.y += (dy / dist) * proj.speed * delta;
          remaining.push(proj);
        }
      });

      return remaining;
    });

    // ---- 粒子更新 ----
    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    })).filter(p => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy, maxChainCount,
      applyStatus, checkReactions, triggerChainConduct, createParticles,
      createReactionParticles, addLog]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  // ---- 开始游戏 ----
  const startGame = () => {
    setGameState('playing');
    setWave(1);
    setCoreHealth(100);
    setPaint({ red: 50, blue: 50, yellow: 50 });
    setEnemies([]);
    setTowers([]);
    setProjectiles([]);
    setParticles([]);
    setBattleLog([]);
    setMaxChainCount(0);
    setScore(0);
    setEnemiesKilled(0);
    setWaveInProgress(false);
    setSelectedTowerType(null);
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    logIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    reactionCooldownsRef.current.clear();
  };

  // ---- 升级塔 ----
  const upgradeTower = (towerId: number) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level * 25;
    const costType = tower.type;
    if (paint[costType] >= cost) {
      setPaint(prev => ({ ...prev, [costType]: prev[costType] - cost }));
      setTowers(prev => prev.map(t =>
        t.id === towerId
          ? { ...t, level: t.level + 1, damage: Math.floor(t.damage * 1.4), range: t.range + 0.2 }
          : t
      ));
    }
  };

  // ---- 敌人血条颜色 ----
  const getEnemyBarColor = (enemy: Enemy): string => {
    if (enemy.elementInfo.colorType === 'mixed') return '#8e44ad';
    const c = enemy.elementInfo.colorType;
    return c === 'red' ? '#e74c3c' : c === 'blue' ? '#3498db' : '#f39c12';
  };

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>

      {gameState === 'menu' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
          <div className="transform -rotate-1">
            <h1 className="text-5xl font-bold text-amber-700 mb-2"
                style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
              绘世守护者
            </h1>
            <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender - 元素之战</p>

            <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
              <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center">📜 游戏说明</h3>
              <ul className="text-amber-700 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">🔴 红色·灼烧塔</span>
                  <span>施加灼烧状态，持续掉血</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">🔵 蓝色·冻结塔</span>
                  <span>施加冻结状态，停止移动</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">🟡 黄色·电击塔</span>
                  <span>施加电击状态，死亡时连锁跳跃</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">🟣 紫塔 (红+蓝)</span>
                  <span>腐蚀伤害，降低敌人抗性</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">🟠 橙塔 (红+黄)</span>
                  <span>范围爆炸，死亡爆裂</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">🟢 绿塔 (蓝+黄)</span>
                  <span>减速+连锁弹射</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>⚪ 白塔 (红+蓝+黄)</span>
                  <span>多阶段技能：单体→弹射→AOE</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-amber-200">
                <p className="text-amber-600 text-xs">
                  💡 相邻的不同颜色塔会自动融合！冻结+灼烧触发"蒸汽爆发"，灼烧+冻结触发"冷却脆化"
                </p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              开始绘制冒险！
            </button>
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-4 justify-center">
          {/* 左侧面板 */}
          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
            <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
              颜料精华
            </h3>

            <div className="space-y-3 mb-4">
              {(['red', 'blue', 'yellow'] as const).map(type => {
                const labels = { red: '红色·灼烧', blue: '蓝色·冻结', yellow: '黄色·电击' };
                const bg = type === 'red' ? 'bg-red-50' : type === 'blue' ? 'bg-blue-50' : 'bg-yellow-50';
                return (
                  <div key={type} className={`flex items-center gap-2 p-2 ${bg} rounded-lg`}>
                    <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: getColorValue(type) }} />
                    <div className="flex-1">
                      <div className="text-xs font-medium" style={{ color: getColorValue(type) }}>{labels[type]}</div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${Math.min(100, paint[type])}%`, backgroundColor: getColorValue(type) }} />
                      </div>
                    </div>
                    <span className="font-bold w-8 text-right text-sm" style={{ color: getColorValue(type) }}>{paint[type]}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
              绘制防御塔
            </h3>

            <div className="space-y-2 mb-4">
              {(['red', 'blue', 'yellow'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedTowerType(selectedTowerType === type ? null : type)}
                  className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    selectedTowerType === type ? 'border-gray-800 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${getColorValue(type)}30, white)` }}
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
              笔触风格
            </h3>

            <div className="grid grid-cols-3 gap-1 mb-4">
              {(['pencil', 'watercolor', 'oil'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style ? 'bg-amber-400 text-amber-900 shadow-md' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {style === 'pencil' ? '✏️铅笔' : style === 'watercolor' ? '💧水彩' : '🖌️油画'}
                </button>
              ))}
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
              💡 相邻不同色塔自动融合！
            </div>
          </div>

          {/* 中央游戏区 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300">
              <div className="text-amber-800 font-bold flex items-center gap-1">
                <span className="text-xl">🌊</span><span>波次 {wave}/10</span>
              </div>
              <div className="text-red-600 font-bold flex items-center gap-1">
                <span className="text-xl">❤️</span><span>{coreHealth}</span>
              </div>
              <div className="text-amber-600 font-bold flex items-center gap-1">
                <span className="text-xl">⭐</span><span>{score}</span>
              </div>
              <div className="text-green-600 font-bold flex items-center gap-1">
                <span className="text-xl">💀</span><span>{enemiesKilled}</span>
              </div>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`text-xs px-2 py-1 rounded-full ${showDebug ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                📋 日志
              </button>
            </div>

            <div className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
                 style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE,
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)' }}>

              {/* 路径 */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                {PATH_LINES.map((line, i) => (
                  <g key={i}>
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#8B4513" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#D2691E" strokeWidth="4" strokeDasharray="12,8" strokeLinecap="round" opacity="0.7" />
                    {(() => {
                      const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
                      const midX = (line.x1 + line.x2) / 2;
                      const midY = (line.y1 + line.y2) / 2;
                      return (
                        <polygon
                          points={`${midX + Math.cos(angle) * 8},${midY + Math.sin(angle) * 8} ${midX + Math.cos(angle + 2.5) * 8},${midY + Math.sin(angle + 2.5) * 8} ${midX + Math.cos(angle - 2.5) * 8},${midY + Math.sin(angle - 2.5) * 8}`}
                          fill="#8B4513" opacity="0.6"
                        />
                      );
                    })()}
                  </g>
                ))}
              </svg>

              {/* 路径格子 */}
              {PATH.map((pos, i) => (
                <div key={i} className="absolute rounded-lg border-2 border-dashed border-amber-400"
                     style={{ left: pos.x * CELL_SIZE + 3, top: pos.y * CELL_SIZE + 3, width: CELL_SIZE - 6, height: CELL_SIZE - 6,
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', opacity: 0.7,
                              boxShadow: 'inset 0 0 10px rgba(180, 83, 9, 0.1)' }} />
              ))}

              {/* 核心 */}
              <div className="absolute flex items-center justify-center animate-pulse"
                   style={{ left: CORE_POSITION.x * CELL_SIZE, top: CORE_POSITION.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-blue-400 shadow-lg flex items-center justify-center border-4 border-white">
                    <span className="text-xl">💎</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full text-xs font-bold text-red-500 shadow">{coreHealth}</div>
                </div>
              </div>

              {/* 入口 */}
              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: -10, top: PATH[0].y * CELL_SIZE - 5, width: CELL_SIZE + 20, height: CELL_SIZE + 10 }}>
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">🚪 入口</div>
              </div>

              {/* 核心标签 */}
              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: CORE_POSITION.x * CELL_SIZE - 10, top: CORE_POSITION.y * CELL_SIZE - 25, width: CELL_SIZE + 20 }}>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">💎 画布核心</div>
              </div>

              {/* 放置格子 */}
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const canPlace = canPlaceTower(x, y);
                return (
                  <div key={i}
                       className={`absolute cursor-pointer transition-all ${
                         selectedTowerType && canPlace ? 'hover:bg-green-300 hover:bg-opacity-40 hover:border-2 hover:border-green-500 hover:border-dashed' : ''
                       }`}
                       style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                       onClick={() => placeTower(x, y)} />
                );
              })}

              {/* 塔渲染 */}
              {towers.map(tower => {
                const isFusion = !!tower.fusionType;
                const displayColor = tower.fusionType ? getColorValue(tower.fusionType) : getColorValue(tower.type);
                const fusionIcon = tower.fusionType
                  ? ({ purple: '☠️', orange: '💥', green: '🎯', white: '⚪' })[tower.fusionType]
                  : (tower.type === 'red' ? '🔥' : tower.type === 'blue' ? '❄️' : '⚡');

                return (
                  <div key={tower.id}
                       className="absolute flex flex-col items-center justify-center cursor-pointer group tower-brush"
                       style={{ left: tower.x * CELL_SIZE + 2, top: tower.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                       onClick={() => upgradeTower(tower.id)}>
                    <div className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                         style={{ width: tower.range * CELL_SIZE * 2, height: tower.range * CELL_SIZE * 2, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', borderColor: displayColor, backgroundColor: displayColor }} />
                    {isFusion && (
                      <div className="absolute rounded-full animate-pulse pointer-events-none"
                           style={{ width: 44, height: 44, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: `0 0 18px 4px ${displayColor}80` }} />
                    )}
                    <div className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
                         style={{
                           background: isFusion ? `linear-gradient(135deg, ${displayColor}dd, ${displayColor}88, ${displayColor}dd)` : `linear-gradient(135deg, ${displayColor}dd, ${displayColor})`,
                           borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : tower.style === 'watercolor' ? '50%' : '8px',
                           boxShadow: isFusion ? `0 4px 16px ${displayColor}80, 0 0 24px ${displayColor}40, inset 0 0 10px rgba(255,255,255,0.4)` : `0 4px 12px ${displayColor}60, inset 0 0 10px rgba(255,255,255,0.3)`,
                           border: tower.style === 'pencil' ? `2px dashed ${displayColor}` : `3px solid ${displayColor}`,
                         }}>
                      <span className="text-lg font-bold drop-shadow-lg" style={{ color: '#fff' }}>{fusionIcon}{tower.level}</span>
                    </div>
                    {tower.fusionType === 'white' && (
                      <div className="absolute -top-1 right-0 bg-gray-800 text-white text-xs px-1 rounded-full animate-pulse" style={{ fontSize: '8px' }}>S{tower.stage}</div>
                    )}
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg border border-gray-600">
                      {tower.level < 5 ? `⬆️ 升级: ${tower.level * 25}精华` : '⭐ 已满级'}
                    </div>
                  </div>
                );
              })}

              {/* 敌人渲染 (含状态图标) */}
              {enemies.map(enemy => (
                <div key={enemy.id} className="absolute flex flex-col items-center"
                     style={{ left: enemy.x - 18, top: enemy.y - 30, transition: 'none' }}>
                  {/* 血条 */}
                  <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-0.5 border border-gray-300">
                    <div className="h-full transition-all" style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`, background: `linear-gradient(90deg, ${getEnemyBarColor(enemy)}, ${getEnemyBarColor(enemy)}aa)` }} />
                  </div>
                  {/* 异常状态图标行 */}
                  {enemy.statuses.length > 0 && (
                    <div className="flex gap-0.5 mb-0.5" style={{ marginTop: -1 }}>
                      {enemy.statuses.filter(s => s.type !== 'explosive').map((s, idx) => {
                        const cfg = STATUS_CONFIG[s.type];
                        return (
                          <span key={idx} className="text-xs" title={`${cfg.icon} x${s.stacks} ${Math.ceil(s.remaining / 60)}s`}
                                style={{ fontSize: '9px', textShadow: '0 0 3px white' }}>
                            {cfg.icon}{s.stacks > 1 ? s.stacks : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* 敌人本体 */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center relative"
                       style={{
                         background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
                         boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`,
                         border: '2px dashed rgba(0,0,0,0.2)',
                         animation: enemy.statuses.some(s => s.type === 'freeze') ? 'none' : 'wobble 0.6s ease-in-out infinite',
                       }}>
                    {/* 冻结覆盖 */}
                    {enemy.statuses.some(s => s.type === 'freeze') && (
                      <div className="absolute inset-0 rounded-full bg-blue-300 bg-opacity-40 flex items-center justify-center z-10">
                        <span style={{ fontSize: '14px' }}>❄️</span>
                      </div>
                    )}
                    <span className="text-base drop-shadow">🎨</span>
                  </div>
                  {/* 元素类型标签 */}
                  <div className="text-xs font-bold mt-0.5 px-1 rounded" style={{ fontSize: '7px', color: getEnemyBarColor(enemy), backgroundColor: `${getEnemyBarColor(enemy)}20` }}>
                    {enemy.elementInfo.colorType.toUpperCase()}
                  </div>
                </div>
              ))}

              {/* 弹丸渲染 */}
              {projectiles.map(proj => (
                <div key={proj.id} className="absolute rounded-full"
                     style={{
                       left: proj.x - 6, top: proj.y - 6,
                       width: proj.type === 'pierce' || proj.type === 'explosive' ? 14 : 12,
                       height: proj.type === 'pierce' || proj.type === 'explosive' ? 14 : 12,
                       background: `radial-gradient(circle, white, ${proj.color})`,
                       boxShadow: `0 0 12px ${proj.color}, 0 0 20px ${proj.color}50`,
                       border: proj.type === 'slow' ? '2px dashed white' : proj.type === 'bounce' ? '2px dotted white' : 'none',
                       animation: proj.type === 'bounce' ? 'wobble 0.3s ease-in-out infinite' : undefined,
                     }} />
              ))}

              {/* 粒子渲染 */}
              {particles.map(p => (
                <div key={p.id} className="absolute rounded-full pointer-events-none"
                     style={{
                       left: p.x - p.size / 2, top: p.y - p.size / 2,
                       width: p.size, height: p.size,
                       background: p.effect === 'reaction' ? `radial-gradient(circle, ${p.color}, transparent)` :
                                   p.effect === 'burn' ? `radial-gradient(circle, #ff6b35, ${p.color})` :
                                   p.effect === 'freeze' ? `radial-gradient(circle, #5dade2, ${p.color})` :
                                   p.effect === 'shock' ? `radial-gradient(circle, #f4d03f, ${p.color})` :
                                   p.effect === 'explosive' ? `radial-gradient(circle, #e67e22, ${p.color})` :
                                   `radial-gradient(circle, ${p.color}, ${p.color}80)`,
                       opacity: p.life / 50,
                       filter: p.effect === 'reaction' ? 'blur(1px)' : 'blur(0.5px)',
                     }} />
              ))}
            </div>

            {/* 控制按钮 */}
            <div className="flex gap-3 mt-3">
              {!waveInProgress ? (
                <button onClick={startWave} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                  🚀 开始第 {wave} 波 {wave > 1 && `(+10全部精华)`}
                </button>
              ) : (
                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                  ⚔️ 战斗中... ({enemies.length}只颜料怪)
                </div>
              )}
              {!waveInProgress && wave < 10 && enemies.length === 0 && (
                <button onClick={() => setWave(w => w + 1)} className="px-4 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg">
                  ⏩ 跳过
                </button>
              )}
              <button onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                      className="px-4 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg">
                {gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
              </button>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-60">
            <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
              📖 图鉴收集
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['red', 'blue', 'yellow'] as const).map(type =>
                (['pencil', 'watercolor', 'oil'] as const).map(style => {
                  const key = `${type}-${style}`;
                  const collected = collectedTowers.has(key);
                  return (
                    <div key={key}
                         className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${collected ? `${getStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'}`}
                         style={{ backgroundColor: collected ? getColorValue(type) : '#f3f4f6' }}>
                      <span className="text-lg">{collected ? (style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️') : '❓'}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="text-center text-sm text-amber-600 bg-amber-50 py-2 rounded-lg mb-4">
              已收集: {collectedTowers.size} / 9
            </div>

            <h4 className="font-bold text-amber-800 mb-2 text-sm border-b border-dashed border-amber-200 pb-1">
              📊 战斗统计
            </h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between items-center p-1.5 bg-red-50 rounded-lg">
                <span className="text-gray-600">消灭敌人</span>
                <span className="font-bold text-red-600">{enemiesKilled}</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-amber-50 rounded-lg">
                <span className="text-gray-600">获得分数</span>
                <span className="font-bold text-amber-600">{score}</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-blue-50 rounded-lg">
                <span className="text-gray-600">防御塔数</span>
                <span className="font-bold text-blue-600">{towers.length}</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-purple-50 rounded-lg">
                <span className="text-gray-600">融合塔数</span>
                <span className="font-bold text-purple-600">{towers.filter(t => !!t.fusionType).length}</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-yellow-50 rounded-lg">
                <span className="text-gray-600">最高连锁</span>
                <span className="font-bold text-yellow-600">{maxChainCount}</span>
              </div>
            </div>

            {/* 战斗日志 (可折叠) */}
            {showDebug && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <h4 className="font-bold text-amber-800 mb-2 text-sm flex items-center justify-between">
                  📋 战斗日志
                  <button onClick={() => setBattleLog([])} className="text-xs text-gray-400 hover:text-gray-600">
                    清空
                  </button>
                </h4>
                <div className="max-h-80 overflow-y-auto space-y-1" style={{ maxHeight: '320px' }}>
                  {battleLog.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">暂无日志记录</p>
                  )}
                  {battleLog.map(log => (
                    <div key={log.id} className="text-xs p-1.5 rounded bg-gray-50 border border-gray-100 flex items-start gap-1"
                         style={{ borderLeftColor: log.color, borderLeftWidth: '3px' }}>
                      <span className="text-xs">{log.message}</span>
                    </div>
                  ))}
                </div>
                {/* 塔伤害贡献 */}
                <h4 className="font-bold text-amber-800 mt-3 mb-1 text-xs border-t border-dashed border-amber-200 pt-2">
                  🏹 塔伤害贡献
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {towers.filter(t => t.totalDamageDealt > 0).length === 0 && (
                    <p className="text-xs text-gray-400 text-center">暂无数据</p>
                  )}
                  {towers.filter(t => t.totalDamageDealt > 0)
                    .sort((a, b) => b.totalDamageDealt - a.totalDamageDealt)
                    .map(t => {
                      const color = t.fusionType ? getColorValue(t.fusionType) : getColorValue(t.type);
                      const icon = t.fusionType
                        ? ({ purple: '☠️', orange: '💥', green: '🎯', white: '⚪' })[t.fusionType]
                        : (t.type === 'red' ? '🔥' : t.type === 'blue' ? '❄️' : '⚡');
                      return (
                        <div key={t.id} className="flex items-center gap-1 text-xs">
                          <span>{icon}</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${Math.min(100, (t.totalDamageDealt / (score + 1)) * 10)}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-gray-500 w-8 text-right">{t.totalDamageDealt}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 快捷状态说明 */}
            <div className="mt-4 pt-2 border-t border-amber-200">
              <h4 className="font-bold text-amber-800 mb-2 text-sm">⚗️ 元素反应</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>❄️+🔥 = 💨 蒸汽爆发</p>
                <p>🔥+❄️ = 🧊 冷却脆化</p>
                <p>⚡💀 = ⚡🔗 连锁导电</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束 */}
      {gameState === 'gameOver' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-300 max-w-md transform -rotate-1">
          <div className="transform rotate-1">
            <h2 className="text-4xl font-bold text-red-600 mb-4" style={{ fontFamily: 'cursive' }}>💔 画布被污染了...</h2>
            <p className="text-red-400 mb-6">颜料怪占领了你的画布核心</p>
            <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-red-800"><span>🌊 坚持波次</span><span className="font-bold">{wave}</span></div>
              <div className="flex justify-between text-red-800"><span>💀 消灭敌人</span><span className="font-bold">{enemiesKilled}</span></div>
              <div className="flex justify-between text-red-800"><span>⭐ 最终分数</span><span className="font-bold">{score}</span></div>
              <div className="flex justify-between text-red-800"><span>📖 收集图鉴</span><span className="font-bold">{collectedTowers.size}/9</span></div>
              <div className="flex justify-between text-red-800"><span>⚗️ 最高连锁</span><span className="font-bold">{maxChainCount}</span></div>
            </div>
            <button onClick={startGame} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg">🎨 重新开始</button>
          </div>
        </div>
      )}

      {/* 胜利 */}
      {gameState === 'victory' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-300 max-w-md transform rotate-1">
          <div className="transform -rotate-1">
            <h2 className="text-4xl font-bold text-green-600 mb-4" style={{ fontFamily: 'cursive' }}>🎉 画布已守护成功！</h2>
            <p className="text-green-400 mb-6">你成功击退了所有颜料怪的入侵！</p>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-green-800"><span>🏆 完成波次</span><span className="font-bold">10/10</span></div>
              <div className="flex justify-between text-green-800"><span>💀 消灭敌人</span><span className="font-bold">{enemiesKilled}</span></div>
              <div className="flex justify-between text-green-800"><span>⭐ 最终分数</span><span className="font-bold">{score}</span></div>
              <div className="flex justify-between text-green-800"><span>📖 收集图鉴</span><span className="font-bold">{collectedTowers.size}/9</span></div>
              <div className="flex justify-between text-green-800"><span>❤️ 剩余生命</span><span className="font-bold">{coreHealth}</span></div>
              <div className="flex justify-between text-green-800"><span>⚗️ 最高连锁</span><span className="font-bold">{maxChainCount}</span></div>
            </div>
            <button onClick={startGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">🎨 再来一局</button>
          </div>
        </div>
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        🎨 绘世守护者 - 用画笔守护你的世界 | 元素之战
      </div>
    </div>
  );
}