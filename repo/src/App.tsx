import { useState, useEffect, useCallback, useRef } from 'react';

// 状态效果系统
interface StatusEffect {
  type: 'burn' | 'freeze' | 'shock' | 'corrosive' | 'burst';
  duration: number;
  maxDuration: number;
  stacks: number;
  maxStacks: number;
  tickTimer: number;
  value: number;
  sourceTowerId?: number;
}

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
  baseSpeed: number;
  color: string;
  colorType: 'red' | 'blue' | 'yellow' | 'mixed';
  pathIndex: number;
  resistances: Record<string, number>;
  weaknesses: string[];
  immunities: string[];
  statusEffects: StatusEffect[];
}

interface Tower {
  id: number;
  x: number;
  y: number;
  type: 'red' | 'blue' | 'yellow' | 'purple' | 'orange' | 'green' | 'white';
  baseTypes: ('red' | 'blue' | 'yellow')[];
  level: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  style: 'pencil' | 'watercolor' | 'oil';
  damageDealt: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetId?: number;
  color: string;
  speed: number;
  damage: number;
  type: 'normal' | 'slow' | 'pierce' | 'chain' | 'splash';
  element: 'red' | 'blue' | 'yellow' | 'purple' | 'orange' | 'green' | 'white';
  sourceTowerId: number;
  chainCount?: number;
  chainedEnemyIds?: Set<number>;
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
  text?: string;
}

interface CombatLogEntry {
  id: number;
  time: number;
  message: string;
  type: 'reaction' | 'chain' | 'system';
}

interface PaintEssence {
  red: number;
  blue: number;
  yellow: number;
}

// 游戏常量
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

export default function CanvasDefender() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'victory'>('menu');
  const [wave, setWave] = useState(1);
  const [coreHealth, setCoreHealth] = useState(100);
  const [paint, setPaint] = useState<PaintEssence>({ red: 50, blue: 50, yellow: 50 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedTowerType, setSelectedTowerType] = useState<'red' | 'blue' | 'yellow' | 'purple' | 'orange' | 'green' | 'white' | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'pencil' | 'watercolor' | 'oil'>('pencil');
  const [score, setScore] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [collectedTowers, setCollectedTowers] = useState<Set<string>>(new Set());
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [highestChainCount, setHighestChainCount] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const logIdRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const addLog = useCallback((message: string, type: 'reaction' | 'chain' | 'system') => {
    setCombatLogs((prev: CombatLogEntry[]) => {
      const newLogs = [{ id: logIdRef.current++, time: Date.now(), message, type }, ...prev].slice(0, 10);
      return newLogs;
    });
  }, []);

  const getColorValue = (type: string): string => {
    const colors: Record<string, string> = {
      red: '#e74c3c',
      blue: '#3498db',
      yellow: '#f39c12',
      purple: '#9b59b6',
      orange: '#e67e22',
      green: '#2ecc71',
      white: '#ecf0f1',
    };
    return colors[type] || '#000';
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
    const isOnPath = PATH.some((p: Position) => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (isOnPath && !(x === CORE_POSITION.x && y === CORE_POSITION.y)) return false;
    const hasTower = towers.some((t: Tower) => t.x === x && t.y === y);
    if (hasTower) return false;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return true;
  };

  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState !== 'playing') return;
    if (selectedTowerType !== 'red' && selectedTowerType !== 'blue' && selectedTowerType !== 'yellow') return;
    if (!canPlaceTower(x, y)) return;

    const cost = TOWER_COSTS[selectedTowerType];
    if (paint.red < cost.red || paint.blue < cost.blue || paint.yellow < cost.yellow) return;

    const styleMultiplier = selectedStyle === 'pencil' ? 0.8 : selectedStyle === 'watercolor' ? 1.0 : 1.2;
    
    // Check for fusion
    const adjacentTowers = towers.filter((t: Tower) => Math.abs(t.x - x) <= 1 && Math.abs(t.y - y) <= 1 && (t.x !== x || t.y !== y));
    let finalType = selectedTowerType as string;
    let baseTypes = [selectedTowerType as 'red' | 'blue' | 'yellow'];
    let towersToRemove: number[] = [];
    
    const typesPresent = new Set<string>();
    typesPresent.add(selectedTowerType);
    
    // Simple logic for fusion: combine with adjacent basic towers
    for (const t of adjacentTowers) {
      if (t.type === 'red' || t.type === 'blue' || t.type === 'yellow') {
        if (!typesPresent.has(t.type)) {
          typesPresent.add(t.type);
          baseTypes.push(t.type);
          towersToRemove.push(t.id);
        }
      }
    }

    let isFusion = false;
    if (typesPresent.has('red') && typesPresent.has('blue') && typesPresent.has('yellow')) {
      finalType = 'white';
      isFusion = true;
    } else if (typesPresent.has('red') && typesPresent.has('blue')) {
      finalType = 'purple';
      isFusion = true;
    } else if (typesPresent.has('red') && typesPresent.has('yellow')) {
      finalType = 'orange';
      isFusion = true;
    } else if (typesPresent.has('blue') && typesPresent.has('yellow')) {
      finalType = 'green';
      isFusion = true;
    }

    if (isFusion) {
      addLog(`融合成功！创造了${finalType === 'white' ? '核心' : finalType === 'purple' ? '腐蚀' : finalType === 'orange' ? '爆裂' : '连锁'}塔`, 'system');
    }

    const newTower: Tower = {
      id: towerIdRef.current++,
      x,
      y,
      type: finalType as any,
      baseTypes,
      level: 1,
      range: isFusion ? 3.5 : 2.5,
      damage: Math.floor((isFusion ? 30 : 15) * styleMultiplier),
      attackSpeed: selectedStyle === 'watercolor' ? 1200 : selectedStyle === 'pencil' ? 800 : 1500,
      lastAttack: 0,
      style: selectedStyle,
      damageDealt: 0
    };

    setTowers((prev: Tower[]) => {
      const remaining = prev.filter((t: Tower) => !towersToRemove.includes(t.id));
      return [...remaining, newTower];
    });

    setPaint((prev: PaintEssence) => ({
      red: prev.red - cost.red,
      blue: prev.blue - cost.blue,
      yellow: prev.yellow - cost.yellow,
    }));

    const towerKey = `${finalType}-${selectedStyle}`;
    if (!collectedTowers.has(towerKey)) {
      setCollectedTowers((prev: Set<string>) => new Set(prev).add(towerKey));
    }
  };

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

    let resistances: Record<string, number> = {};
    let weaknesses: string[] = [];
    let immunities: string[] = [];

    if (type === 'red') { resistances['burn'] = 0.8; weaknesses.push('freeze'); }
    if (type === 'blue') { resistances['freeze'] = 0.8; weaknesses.push('shock'); }
    if (type === 'yellow') { resistances['shock'] = 0.8; weaknesses.push('burn'); }
    if (type === 'mixed') {
      resistances['burn'] = 0.5;
      resistances['freeze'] = 0.5;
      resistances['shock'] = 0.5;
      resistances['corrosive'] = 0.5;
      immunities.push('burst');
    }

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: 40 + wave * 15,
      maxHealth: 40 + wave * 15,
      speed: 35 + Math.min(wave * 3, 25),
      baseSpeed: 35 + Math.min(wave * 3, 25),
      color: colors[type],
      colorType: type,
      pathIndex: 0,
      resistances,
      weaknesses,
      immunities,
      statusEffects: [],
    };

    setEnemies((prev: Enemy[]) => [...prev, newEnemy]);
  }, [wave]);

  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    setHighestChainCount(0);
    addLog(`第 ${wave} 波开始了！`, 'system');
  };

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5, text?: string) => {
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
        text: i === 0 ? text : undefined
      });
    }
    setParticles((prev: Particle[]) => [...prev, ...newParticles]);
  }, []);

  const addStatusEffect = (enemy: Enemy, effectType: StatusEffect['type'], duration: number, value: number, maxStacks: number, sourceId?: number) => {
    if (enemy.immunities.includes(effectType)) return enemy;
    
    const existingIdx = enemy.statusEffects.findIndex((e: StatusEffect) => e.type === effectType);
    const newEffects = [...enemy.statusEffects];
    
    if (existingIdx >= 0) {
      newEffects[existingIdx].stacks = Math.min(newEffects[existingIdx].stacks + 1, maxStacks);
      newEffects[existingIdx].duration = duration;
      newEffects[existingIdx].value = value;
    } else {
      newEffects.push({
        type: effectType,
        duration,
        maxDuration: duration,
        stacks: 1,
        maxStacks,
        tickTimer: 0,
        value,
        sourceTowerId: sourceId
      });
    }
    
    return { ...enemy, statusEffects: newEffects };
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
        if (wave >= 10) {
          setGameState('victory');
        } else {
          const bonus: PaintEssence = { red: 10, blue: 10, yellow: 10 };
          setPaint((prev: PaintEssence) => ({
            red: prev.red + bonus.red,
            blue: prev.blue + bonus.blue,
            yellow: prev.yellow + bonus.yellow,
          }));
        }
      }
    }

    let dyingEnemies: Enemy[] = [];

    setEnemies((prev: Enemy[]) => {
      const updatedEnemies: Enemy[] = [];
      let damageToCore = 0;

      prev.forEach((enemy: Enemy) => {
        if (enemy.health <= 0) return;

        if (enemy.pathIndex >= PATH.length - 1) {
          damageToCore += 10;
          return;
        }

        let currentEnemy = { ...enemy };
        
        // Handle Status Effects
        let speedMultiplier = 1;
        let isFrozen = false;
        let defenseMultiplier = 1;

        currentEnemy.statusEffects = currentEnemy.statusEffects.map((effect: StatusEffect) => {
          let updatedEffect = { ...effect };
          updatedEffect.duration -= delta;
          
          if (updatedEffect.type === 'freeze') {
            isFrozen = true;
          } else if (updatedEffect.type === 'corrosive') {
            defenseMultiplier -= 0.1 * updatedEffect.stacks;
          } else if (updatedEffect.type === 'burn' || updatedEffect.type === 'shock') {
            updatedEffect.tickTimer += delta;
            if (updatedEffect.tickTimer >= 1) { // tick every second
              const damage = updatedEffect.value * updatedEffect.stacks;
              currentEnemy.health -= damage;
              updatedEffect.tickTimer = 0;
              createParticles(currentEnemy.x, currentEnemy.y, updatedEffect.type === 'burn' ? '#e74c3c' : '#f39c12', 2);
              
              if (updatedEffect.sourceTowerId !== undefined) {
                setTowers((ts: Tower[]) => ts.map((t: Tower) => t.id === updatedEffect.sourceTowerId ? { ...t, damageDealt: t.damageDealt + damage } : t));
              }
            }
          }

          return updatedEffect;
        }).filter((e: StatusEffect) => e.duration > 0);

        if (currentEnemy.health <= 0) {
          dyingEnemies.push(currentEnemy);
          return;
        }

        const target = {
          x: PATH[currentEnemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
          y: PATH[currentEnemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
        };

        const dx = target.x - currentEnemy.x;
        const dy = target.y - currentEnemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        currentEnemy.speed = currentEnemy.baseSpeed * Math.max(0.1, speedMultiplier);

        if (!isFrozen) {
          if (dist < 5) {
            currentEnemy.pathIndex++;
          } else {
            currentEnemy.x += (dx / dist) * currentEnemy.speed * delta;
            currentEnemy.y += (dy / dist) * currentEnemy.speed * delta;
          }
        }

        updatedEnemies.push(currentEnemy);
      });

      if (damageToCore > 0) {
        setCoreHealth((h: number) => Math.max(0, h - damageToCore));
      }

      return updatedEnemies;
    });

    setCoreHealth((h: number) => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    setTowers((prev: Tower[]) => {
      const currentTime = Date.now();
      let newProjectiles: Projectile[] = [];

      prev.forEach((tower: Tower) => {
        if (currentTime - tower.lastAttack < tower.attackSpeed) return;

        const towerCenterX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerCenterY = tower.y * CELL_SIZE + CELL_SIZE / 2;

        const inRange = enemies.filter((e: Enemy) => {
          if (e.health <= 0) return false;
          const dist = Math.sqrt(
            Math.pow(e.x - towerCenterX, 2) + Math.pow(e.y - towerCenterY, 2)
          );
          return dist <= tower.range * CELL_SIZE;
        });

        if (inRange.length > 0) {
          const target = inRange[0];
          tower.lastAttack = currentTime;

          let projType: Projectile['type'] = 'normal';
          if (tower.type === 'blue') projType = 'slow';
          else if (tower.type === 'yellow') projType = 'pierce';
          else if (tower.type === 'purple') projType = 'splash';
          else if (tower.type === 'orange') projType = 'splash';
          else if (tower.type === 'green') projType = 'chain';
          else if (tower.type === 'white') projType = 'chain';

          const projectile: Projectile = {
            id: projectileIdRef.current++,
            x: towerCenterX,
            y: towerCenterY,
            targetX: target.x,
            targetY: target.y,
            targetId: target.id,
            color: getColorValue(tower.type),
            speed: 350,
            damage: tower.damage * tower.level,
            type: projType,
            element: tower.type,
            sourceTowerId: tower.id,
            chainCount: projType === 'chain' ? 3 : undefined,
            chainedEnemyIds: projType === 'chain' ? new Set([target.id]) : undefined,
          };

          newProjectiles.push(projectile);
        }
      });
      
      if (newProjectiles.length > 0) {
        setProjectiles((p: Projectile[]) => [...p, ...newProjectiles]);
      }
      return [...prev];
    });

    setProjectiles((prev: Projectile[]) => {
      const remaining: Projectile[] = [];
      
      prev.forEach((proj: Projectile) => {
        let dx = proj.targetX - proj.x;
        let dy = proj.targetY - proj.y;
        
        // homing missile for target
        const targetEnemy = enemies.find((e: Enemy) => e.id === proj.targetId);
        if (targetEnemy) {
          dx = targetEnemy.x - proj.x;
          dy = targetEnemy.y - proj.y;
        }
        
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          setEnemies((enemiesList: Enemy[]) => {
            const updated = enemiesList.map((e: Enemy) => {
              if (e.health <= 0) return e;

              const eDist = Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2));
              let hitRange = proj.type === 'splash' ? 80 : proj.type === 'pierce' ? 60 : 30;
              
              if (eDist < hitRange) {
                // Apply Damage
                let damage = proj.damage;
                const resistance = e.resistances[proj.element] || 0;
                damage = damage * (1 - resistance);
                
                if (e.weaknesses.includes(proj.element)) {
                  damage *= 1.5;
                }

                // Corrosive defense multiplier
                const corrosiveStacks = e.statusEffects.find((eff: StatusEffect) => eff.type === 'corrosive')?.stacks || 0;
                damage *= (1 + corrosiveStacks * 0.1);

                // Skill Chains
                let isSteamExplosion = false;
                let isCoolingEmbrittlement = false;

                if (proj.element === 'red' && e.statusEffects.some((eff: StatusEffect) => eff.type === 'freeze')) {
                  isSteamExplosion = true;
                  damage *= 2;
                  addLog('蒸汽爆发！(冰冻+红)', 'reaction');
                  createParticles(e.x, e.y, '#ffffff', 10, '蒸汽爆发');
                  // Remove freeze
                  e.statusEffects = e.statusEffects.filter((eff: StatusEffect) => eff.type !== 'freeze');
                } else if (proj.element === 'blue' && e.statusEffects.some((eff: StatusEffect) => eff.type === 'burn')) {
                  isCoolingEmbrittlement = true;
                  damage *= 2;
                  addLog('冷却脆化！(灼烧+蓝)', 'reaction');
                  createParticles(e.x, e.y, '#87ceeb', 10, '冷却脆化');
                  // Remove burn
                  e.statusEffects = e.statusEffects.filter((eff: StatusEffect) => eff.type !== 'burn');
                }

                const newHealth = e.health - damage;

                setTowers((ts: Tower[]) => ts.map((t: Tower) => t.id === proj.sourceTowerId ? { ...t, damageDealt: t.damageDealt + damage } : t));

                if (newHealth <= 0) {
                  dyingEnemies.push({...e, health: 0});
                  return { ...e, health: 0 };
                }

                let updatedEnemy = { ...e, health: newHealth };

                // Apply Status Effects
                if (proj.element === 'red' || proj.element === 'orange' || proj.element === 'white') {
                   updatedEnemy = addStatusEffect(updatedEnemy, 'burn', 3, proj.damage * 0.2, 5, proj.sourceTowerId);
                }
                if (proj.element === 'blue' || proj.element === 'green' || proj.element === 'white') {
                   updatedEnemy = addStatusEffect(updatedEnemy, 'freeze', 1.5, 0, 1, proj.sourceTowerId);
                }
                if (proj.element === 'yellow' || proj.element === 'green' || proj.element === 'white') {
                   updatedEnemy = addStatusEffect(updatedEnemy, 'shock', 4, proj.damage * 0.1, 3, proj.sourceTowerId);
                }
                if (proj.element === 'purple') {
                   updatedEnemy = addStatusEffect(updatedEnemy, 'corrosive', 5, 0, 5, proj.sourceTowerId);
                }
                if (proj.element === 'orange') {
                   updatedEnemy = addStatusEffect(updatedEnemy, 'burst', 5, proj.damage * 0.5, 1, proj.sourceTowerId);
                }

                createParticles(e.x, e.y, proj.color, 3);
                
                return updatedEnemy;
              }
              return e;
            });

            // Handle Chain
            if (proj.type === 'chain' && proj.chainCount! > 0) {
              const nearbyEnemies = updated.filter((e: Enemy) => 
                e.health > 0 && 
                !proj.chainedEnemyIds!.has(e.id) &&
                Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2)) < 150
              );
              
              if (nearbyEnemies.length > 0) {
                const nextTarget = nearbyEnemies[0];
                const newChainedIds = new Set(proj.chainedEnemyIds);
                newChainedIds.add(nextTarget.id);
                
                const chainNum = 4 - proj.chainCount!;
                if (chainNum > highestChainCount) {
                  setHighestChainCount(chainNum);
                }

                remaining.push({
                  ...proj,
                  x: proj.x,
                  y: proj.y,
                  targetX: nextTarget.x,
                  targetY: nextTarget.y,
                  targetId: nextTarget.id,
                  chainCount: proj.chainCount! - 1,
                  chainedEnemyIds: newChainedIds
                });
              }
            }

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

    if (dyingEnemies.length > 0) {
      setEnemies((prev: Enemy[]) => {
        let remaining = [...prev];
        dyingEnemies.forEach((e: Enemy) => {
          // Burst logic
          if (e.statusEffects.some((eff: StatusEffect) => eff.type === 'burst')) {
            addLog('爆裂！(死亡触发)', 'reaction');
            createParticles(e.x, e.y, '#e67e22', 15, '爆裂');
            remaining = remaining.map((otherE: Enemy) => {
              if (otherE.health <= 0) return otherE;
              const dist = Math.sqrt(Math.pow(otherE.x - e.x, 2) + Math.pow(otherE.y - e.y, 2));
              if (dist < 100) {
                return { ...otherE, health: otherE.health - 50 };
              }
              return otherE;
            });
          }
          // Chain Conduction logic
          if (e.statusEffects.some((eff: StatusEffect) => eff.type === 'shock')) {
            addLog('连锁导电！(死亡触发)', 'reaction');
            createParticles(e.x, e.y, '#f1c40f', 15, '导电');
            remaining = remaining.map((otherE: Enemy) => {
              if (otherE.health <= 0) return otherE;
              const dist = Math.sqrt(Math.pow(otherE.x - e.x, 2) + Math.pow(otherE.y - e.y, 2));
              if (dist < 120) {
                 return addStatusEffect(otherE, 'shock', 4, 10, 3);
              }
              return otherE;
            });
          }

          const paintGain = 8 + Math.floor(e.maxHealth / 15);
          const colorType = e.colorType === 'mixed' ? 
            (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)] : 
            e.colorType;
          
          setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + paintGain }));
          setScore((s: number) => s + 15 + Math.floor(e.maxHealth / 10));
          setEnemiesKilled((k: number) => k + 1);
          createParticles(e.x, e.y, e.color, 8);
          
          remaining = remaining.filter((re: Enemy) => re.id !== e.id);
        });
        return remaining;
      });
    }

    setEnemies((prev: Enemy[]) => prev.filter((e: Enemy) => e.health > 0));

    setParticles((prev: Particle[]) => prev.map((p: Particle) => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    })).filter((p: Particle) => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, enemies, wave, waveInProgress, spawnEnemy, addLog, highestChainCount, createParticles]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

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
    setCombatLogs([]);
    setHighestChainCount(0);
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
    projectileIdRef.current = 0;
    particleIdRef.current = 0;
    logIdRef.current = 0;
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
  };

  const upgradeTower = (towerId: number) => {
    const tower = towers.find((t: Tower) => t.id === towerId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level * 25;
    
    // For fusion towers, take paint from basic types it consists of
    const canAfford = tower.baseTypes.every((t: string) => paint[t as keyof PaintEssence] >= cost);
    if (canAfford) {
      setPaint((prev: PaintEssence) => {
        const next = { ...prev };
        tower.baseTypes.forEach((t: string) => next[t as keyof PaintEssence] -= cost);
        return next;
      });
      setTowers((prev: Tower[]) => prev.map((t: Tower) =>
        t.id === towerId
          ? { ...t, level: t.level + 1, damage: Math.floor(t.damage * 1.4), range: t.range + 0.2 }
          : t
      ));
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
      
      {gameState === 'menu' && (
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
          <div className="transform -rotate-1">
            <h1 className="text-5xl font-bold text-amber-700 mb-2" 
                style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
              🎨 绘世守护者
            </h1>
            <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender</p>
            
            <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
              <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center">
                📜 游戏说明
              </h3>
              <ul className="text-amber-700 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">🔴</span>
                  <span><strong>红色颜料塔</strong>：高伤害单体攻击 (附带灼烧)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">🔵</span>
                  <span><strong>蓝色颜料塔</strong>：范围减速效果 (附带冻结)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">🟡</span>
                  <span><strong>黄色颜料塔</strong>：穿透攻击多个敌人 (附带电击)</span>
                </li>
                <li className="flex items-start gap-2 mt-2">
                  <span className="text-purple-500">🔮</span>
                  <span><strong>融合机制</strong>：相邻放置不同颜色的塔会产生强大的融合塔！(红+蓝=紫, 红+黄=橙, 蓝+黄=绿, 红+蓝+黄=白)</span>
                </li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              ✏️ 开始绘制冒险！
            </button>
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56 flex flex-col gap-4">
            <div>
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
            </div>

            <div>
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
            </div>

            <div>
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

            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
              💡 提示: 相邻放置不同颜色的塔会融合
            </div>
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
                    {(() => {
                      const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
                      const midX = (line.x1 + line.x2) / 2;
                      const midY = (line.y1 + line.y2) / 2;
                      return (
                        <polygon
                          points={`${midX + Math.cos(angle) * 8},${midY + Math.sin(angle) * 8} ${midX + Math.cos(angle + 2.5) * 8},${midY + Math.sin(angle + 2.5) * 8} ${midX + Math.cos(angle - 2.5) * 8},${midY + Math.sin(angle - 2.5) * 8}`}
                          fill="#8B4513"
                          opacity="0.6"
                        />
                      );
                    })()}
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

              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: -10, top: PATH[0].y * CELL_SIZE - 5, width: CELL_SIZE + 20, height: CELL_SIZE + 10 }}>
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                  🚪 入口
                </div>
              </div>

              <div className="absolute flex items-center justify-center z-10"
                   style={{ left: CORE_POSITION.x * CELL_SIZE - 10, top: CORE_POSITION.y * CELL_SIZE - 25, width: CELL_SIZE + 20 }}>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  💎 画布核心
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
                  
                  <div className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
                       style={{ 
                         background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`,
                         borderRadius: tower.style === 'oil' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : 
                                      tower.style === 'watercolor' ? '50% 50% 50% 50%' : '8px',
                         boxShadow: `0 4px 12px ${getColorValue(tower.type)}60, inset 0 0 10px rgba(255,255,255,0.3)`,
                         border: tower.style === 'pencil' ? '2px dashed #333' : `3px solid ${getColorValue(tower.type)}`,
                       }}>
                    <span className="text-lg text-white font-bold drop-shadow-lg">
                      {tower.type === 'white' ? '🌟' : tower.type === 'purple' ? '☠️' : tower.type === 'orange' ? '💥' : tower.type === 'green' ? '⚡' : tower.style === 'pencil' ? '✏️' : tower.style === 'watercolor' ? '💧' : '🖌️'}
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
                       top: enemy.y - 24,
                       transition: 'none',
                     }}>
                  <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 border border-gray-300">
                    <div className="h-full transition-all"
                         style={{
                           width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                           background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)`,
                         }} />
                  </div>
                  
                  {/* Status Icons */}
                  <div className="absolute -top-4 flex gap-0.5">
                    {enemy.statusEffects.map((eff, i) => (
                      <div key={i} className="text-[10px] bg-white rounded-full px-1 shadow-sm border border-gray-200" title={`${eff.type} (${eff.stacks}层)`}>
                        {eff.type === 'burn' ? '🔥' : eff.type === 'freeze' ? '❄️' : eff.type === 'shock' ? '⚡' : eff.type === 'corrosive' ? '☠️' : '💥'}
                        {eff.stacks > 1 && <span className="text-[8px]">{eff.stacks}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                       style={{
                         background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
                         boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`,
                         border: '2px dashed rgba(0,0,0,0.2)',
                         animation: enemy.statusEffects.some(e => e.type === 'freeze') ? 'none' : 'wobble 0.6s ease-in-out infinite',
                         opacity: enemy.statusEffects.some(e => e.type === 'corrosive') ? 0.6 : 1,
                       }}>
                    <span className="text-base drop-shadow">🎨</span>
                  </div>
                </div>
              ))}

              {projectiles.map(proj => (
                <div key={proj.id}
                     className="absolute rounded-full"
                     style={{
                       left: proj.x - 6,
                       top: proj.y - 6,
                       width: proj.type === 'splash' ? 16 : proj.type === 'pierce' ? 14 : 12,
                       height: proj.type === 'splash' ? 16 : proj.type === 'pierce' ? 14 : 12,
                       background: `radial-gradient(circle, white, ${proj.color})`,
                       boxShadow: `0 0 12px ${proj.color}, 0 0 20px ${proj.color}50`,
                       border: proj.type === 'slow' ? '2px dashed white' : proj.type === 'chain' ? '2px dotted yellow' : 'none',
                     }} />
              ))}

              {particles.map(p => (
                <div key={p.id}
                     className="absolute rounded-full pointer-events-none flex items-center justify-center whitespace-nowrap"
                     style={{
                       left: p.x - p.size / 2,
                       top: p.y - p.size / 2,
                       width: p.size,
                       height: p.size,
                       background: p.text ? 'transparent' : `radial-gradient(circle, ${p.color}, ${p.color}80)`,
                       opacity: p.life / 50,
                       filter: p.text ? 'none' : 'blur(0.5px)',
                       color: p.color,
                       fontWeight: 'bold',
                       fontSize: '12px',
                       textShadow: '0 0 2px white, 0 0 2px white',
                       zIndex: 50,
                     }}>
                  {p.text && p.text}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              {!waveInProgress ? (
                <button onClick={startWave}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                  🚀 开始第 {wave} 波 {wave > 1 && `(+10全部精华)`}
                </button>
              ) : (
                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                  ⚔️ 战斗中... ({enemies.length}只颜料怪)
                </div>
              )}
              
              {!waveInProgress && wave < 10 && enemies.length === 0 && (
                <button onClick={() => setWave(w => w + 1)}
                        className="px-4 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg">
                  ⏩ 跳过
                </button>
              )}
              
              <button onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
                      className="px-4 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg">
                {gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-64 flex flex-col gap-4 max-h-[700px] overflow-y-auto">
            <div>
              <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
                📖 战斗面板
              </h3>
              
              <div className="mb-4">
                <h4 className="font-bold text-amber-700 text-sm mb-2">⚔️ 伤害贡献 (前5)</h4>
                <div className="space-y-1">
                  {[...towers].sort((a, b) => b.damageDealt - a.damageDealt).slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs p-1 bg-gray-50 rounded">
                      <span className="flex items-center gap-1">
                        <span style={{color: getColorValue(t.type)}}>
                          {t.type === 'red' ? '🔴' : t.type === 'blue' ? '🔵' : t.type === 'yellow' ? '🟡' : '🔮'}
                        </span>
                        Lv.{t.level}
                      </span>
                      <span className="font-mono font-bold text-gray-700">{Math.floor(t.damageDealt)}</span>
                    </div>
                  ))}
                  {towers.length === 0 && <div className="text-xs text-gray-400 text-center py-2">暂无防御塔</div>}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-amber-700 text-sm mb-2 flex justify-between">
                  <span>⚡ 连锁记录</span>
                  <span className="text-green-600">最高: {highestChainCount}次</span>
                </h4>
              </div>

              <div>
                <h4 className="font-bold text-amber-700 text-sm mb-2">📜 战斗日志</h4>
                <div className="space-y-1 h-48 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200 text-xs font-mono">
                  {combatLogs.map(log => (
                    <div key={log.id} className={`p-1 rounded ${log.type === 'reaction' ? 'text-purple-600 bg-purple-50' : log.type === 'chain' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500'}`}>
                      <span className="opacity-50">[{new Date(log.time).toLocaleTimeString().split(' ')[0]}]</span> {log.message}
                    </div>
                  ))}
                  {combatLogs.length === 0 && <div className="text-gray-400 text-center py-4">等待战斗开始...</div>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-amber-800 mb-2 text-sm border-b border-dashed border-amber-200 pb-1">
                📊 战斗统计
              </h4>
              
              <div className="space-y-2 text-sm">
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
              </div>
            </div>
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
              ✨ 画布守护成功！
            </h2>
            <p className="text-green-500 mb-6">你用色彩保卫了整个世界</p>
            
            <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-green-800">
                <span>💀 消灭敌人</span>
                <span className="font-bold">{enemiesKilled}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>⭐ 最终分数</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>❤️ 剩余核心</span>
                <span className="font-bold">{coreHealth}</span>
              </div>
            </div>
            
            <button onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
              🎨 再次挑战
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
