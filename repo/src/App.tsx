import { useState, useEffect, useCallback, useRef } from 'react';

// 类型定义
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
  const [selectedTowerType, setSelectedTowerType] = useState<'red' | 'blue' | 'yellow' | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'pencil' | 'watercolor' | 'oil'>('pencil');
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

  const getColorValue = (type: 'red' | 'blue' | 'yellow'): string => {
    const colors = {
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

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      health: 40 + wave * 15,
      maxHealth: 40 + wave * 15,
      speed: 35 + Math.min(wave * 3, 25),
      color: colors[type],
      colorType: type,
      pathIndex: 0,
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [wave]);

  const startWave = () => {
    if (waveInProgress) return;
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
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

      prev.forEach(enemy => {
        if (enemy.pathIndex >= PATH.length - 1) {
          damage += 10;
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
        setCoreHealth(h => Math.max(0, h - damage));
      }

      return updatedEnemies;
    });

    setCoreHealth(h => {
      if (h <= 0) {
        setGameState('gameOver');
      }
      return h;
    });

    setTowers(prev => {
      const currentTime = Date.now();
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

          const projectile: Projectile = {
            id: projectileIdRef.current++,
            x: towerCenterX,
            y: towerCenterY,
            targetX: target.x,
            targetY: target.y,
            color: getColorValue(tower.type),
            speed: 350,
            damage: tower.damage * tower.level,
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
              const hitRange = proj.type === 'pierce' ? 60 : 25;
              
              if (eDist < hitRange) {
                createParticles(e.x, e.y, proj.color, 3);
                const newHealth = e.health - proj.damage;
                
                if (newHealth <= 0) {
                  const paintGain = 8 + Math.floor(e.maxHealth / 15);
                  const colorType = e.colorType === 'mixed' ? 
                    (['red', 'blue', 'yellow'] as const)[Math.floor(Math.random() * 3)] : 
                    e.colorType;
                  
                  setPaint((p: PaintEssence) => ({ ...p, [colorType]: p[colorType] + paintGain }));
                  setScore(s => s + 15 + Math.floor(e.maxHealth / 10));
                  setEnemiesKilled(k => k + 1);
                  createParticles(e.x, e.y, e.color, 8);
                  return { ...e, health: 0 };
                }

                if (proj.type === 'slow') {
                  return { ...e, health: newHealth, speed: Math.max(15, e.speed * 0.7) };
                }
                
                return { ...e, health: newHealth };
              }
              return e;
            }).filter(e => e.health > 0);
            
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

    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.velocityX,
      y: p.y + p.velocityY,
      life: p.life - 1,
      size: p.size * 0.95,
    })).filter(p => p.life > 0));

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
                  <span><strong>红色颜料塔</strong>：高伤害单体攻击</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">🔵</span>
                  <span><strong>蓝色颜料塔</strong>：范围减速效果</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">🟡</span>
                  <span><strong>黄色颜料塔</strong>：穿透攻击多个敌人</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-amber-200">
                <p className="text-amber-600 text-xs">💡 击败颜料怪获得颜料精华，用于建造更多防御塔！</p>
              </div>
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

            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
              💡 点击画布空白处放置防御塔
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
                      {tower.style === 'pencil' ? '✏️' : tower.style === 'watercolor' ? '💧' : '🖌️'}
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
                  
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                       style={{
                         background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
                         boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`,
                         border: '2px dashed rgba(0,0,0,0.2)',
                         animation: 'wobble 0.6s ease-in-out infinite',
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
                       width: proj.type === 'pierce' ? 14 : 12,
                       height: proj.type === 'pierce' ? 14 : 12,
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
                       filter: 'blur(0.5px)',
                     }} />
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

          <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-52">
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
                         className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                           collected ? `${getStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'
                         }`}
                         style={{ backgroundColor: collected ? getColorValue(type) : '#f3f4f6' }}
                         title={collected ? `${type}-${style}` : '未收集'}>
                      <span className="text-lg">
                        {collected ? (
                          style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️'
                        ) : '❓'}
                      </span>
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

            <div className="mt-4 pt-2 border-t border-amber-200">
              <h4 className="font-bold text-amber-800 mb-2 text-sm">🎯 笔触效果</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>✏️ <strong>铅笔</strong>: 攻速快</p>
                <p>💧 <strong>水彩</strong>: 平衡型</p>
                <p>🖌️ <strong>油画</strong>: 高伤害</p>
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
              🎉 画布已守护成功！
            </h2>
            <p className="text-green-400 mb-6">你成功击退了所有颜料怪的入侵！</p>
            
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
                <span>📖 收集图鉴</span>
                <span className="font-bold">{collectedTowers.size}/9</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>❤️ 剩余生命</span>
                <span className="font-bold">{coreHealth}</span>
              </div>
            </div>
            
            <button onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
              🎨 再来一局
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        🎨 绘世守护者 - 用画笔守护你的世界
      </div>
    </div>
  );
}