import type { GameState, Position } from '../types/game';
import type { Enemy, Tower, Projectile, Particle } from '../types/entities';
import type { PathLine } from '../config/gameConfig';

interface GameBoardProps {
  gridSize: number;
  cellSize: number;
  path: Position[];
  pathLines: PathLine[];
  corePosition: Position;
  coreHealth: number;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  particles: Particle[];
  selectedTowerType: string | null;
  canPlaceTower: (x: number, y: number) => boolean;
  onCellClick: (x: number, y: number) => void;
  onTowerClick: (towerId: number) => void;
  getColorValue: (type: string) => string;
  getStyleClass: (style: string) => string;
  gameState: GameState;
}

export function GameBoard({
  gridSize,
  cellSize,
  path,
  pathLines,
  corePosition,
  coreHealth,
  enemies,
  towers,
  projectiles,
  particles,
  selectedTowerType,
  canPlaceTower,
  onCellClick,
  onTowerClick,
  getColorValue,
  getStyleClass,
  gameState,
}: GameBoardProps) {
  const boardPixelWidth = gridSize * cellSize;

  return (
    <div
      className="relative bg-white rounded-xl shadow-2xl border-4 border-amber-400 overflow-hidden"
      style={{
        width: boardPixelWidth,
        height: boardPixelWidth,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 49px, #f3e5d0 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #f3e5d0 50px)',
      }}
    >
      {/* 路径线段 */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: boardPixelWidth, height: boardPixelWidth }}
      >
        {pathLines.map((line, i) => (
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
            {/* 方向箭头 */}
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

      {/* 路径格子 */}
      {path.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-lg border-2 border-dashed border-amber-400"
          style={{
            left: pos.x * cellSize + 3,
            top: pos.y * cellSize + 3,
            width: cellSize - 6,
            height: cellSize - 6,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            opacity: 0.7,
            boxShadow: 'inset 0 0 10px rgba(180, 83, 9, 0.1)',
          }}
        />
      ))}

      {/* 核心 */}
      <div
        className="absolute flex items-center justify-center animate-pulse"
        style={{
          left: corePosition.x * cellSize,
          top: corePosition.y * cellSize,
          width: cellSize,
          height: cellSize,
        }}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-pink-400 to-blue-400 shadow-lg flex items-center justify-center border-4 border-white">
            <span className="text-xl">?</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full text-xs font-bold text-red-500 shadow">
            {coreHealth}
          </div>
        </div>
      </div>

      {/* 入口标记 */}
      <div
        className="absolute flex items-center justify-center z-10"
        style={{
          left: -10,
          top: path[0].y * cellSize - 5,
          width: cellSize + 20,
          height: cellSize + 10,
        }}
      >
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
          ? 入口
        </div>
      </div>

      {/* 核心标记 */}
      <div
        className="absolute flex items-center justify-center z-10"
        style={{
          left: corePosition.x * cellSize - 10,
          top: corePosition.y * cellSize - 25,
          width: cellSize + 20,
        }}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          ? 画布核心
        </div>
      </div>

      {/* 可点击格子 */}
      {gameState === 'playing' &&
        Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          const canPlace = canPlaceTower(x, y);

          return (
            <div
              key={i}
              className={`absolute cursor-pointer transition-all ${
                selectedTowerType && canPlace
                  ? 'hover:bg-green-300 hover:bg-opacity-40 hover:border-2 hover:border-green-500 hover:border-dashed'
                  : ''
              }`}
              style={{
                left: x * cellSize,
                top: y * cellSize,
                width: cellSize,
                height: cellSize,
              }}
              onClick={() => onCellClick(x, y)}
            />
          );
        })}

      {/* 防御塔 */}
      {towers.map(tower => (
        <div
          key={tower.id}
          className="absolute flex flex-col items-center justify-center cursor-pointer group tower-brush"
          style={{
            left: tower.x * cellSize + 2,
            top: tower.y * cellSize + 2,
            width: cellSize - 4,
            height: cellSize - 4,
          }}
          onClick={() => onTowerClick(tower.id)}
        >
          <div
            className="absolute rounded-full border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
            style={{
              width: tower.range * cellSize * 2,
              height: tower.range * cellSize * 2,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: getColorValue(tower.type),
              backgroundColor: getColorValue(tower.type),
            }}
          />

          <div
            className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${getStyleClass(tower.style)}`}
            style={{
              background: `linear-gradient(135deg, ${getColorValue(tower.type)}dd, ${getColorValue(tower.type)})`,
              borderRadius:
                tower.style === 'oil'
                  ? '30% 70% 70% 30% / 30% 30% 70% 70%'
                  : tower.style === 'watercolor'
                    ? '50% 50% 50% 50%'
                    : '8px',
              boxShadow: `0 4px 12px ${getColorValue(tower.type)}60, inset 0 0 10px rgba(255,255,255,0.3)`,
              border: tower.style === 'pencil' ? '2px dashed #333' : `3px solid ${getColorValue(tower.type)}`,
            }}
          >
            <span className="text-lg text-white font-bold drop-shadow-lg">
              {tower.style === 'pencil' ? '?' : tower.style === 'watercolor' ? '?' : '?'}
              {tower.level}
            </span>
          </div>

          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg border border-gray-600">
            {tower.level < 5 ? `? 升级: ${tower.level * 25}精华` : '? 已满级'}
          </div>
        </div>
      ))}

      {/* 敌人 */}
      {enemies.map(enemy => (
        <div
          key={enemy.id}
          className="absolute flex flex-col items-center"
          style={{
            left: enemy.x - 18,
            top: enemy.y - 24,
            transition: 'none',
          }}
        >
          <div className="w-9 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 border border-gray-300">
            <div
              className="h-full transition-all"
              style={{
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                background: `linear-gradient(90deg, ${enemy.color}, ${enemy.color}aa)`,
              }}
            />
          </div>

          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${enemy.color}cc, ${enemy.color})`,
              boxShadow: `0 0 12px ${enemy.color}80, inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3)`,
              border: '2px dashed rgba(0,0,0,0.2)',
              animation: 'wobble 0.6s ease-in-out infinite',
            }}
          >
            <span className="text-base drop-shadow">?</span>
          </div>
        </div>
      ))}

      {/* 弹丸 */}
      {projectiles.map(proj => (
        <div
          key={proj.id}
          className="absolute rounded-full"
          style={{
            left: proj.x - 6,
            top: proj.y - 6,
            width: proj.type === 'pierce' ? 14 : 12,
            height: proj.type === 'pierce' ? 14 : 12,
            background: `radial-gradient(circle, white, ${proj.color})`,
            boxShadow: `0 0 12px ${proj.color}, 0 0 20px ${proj.color}50`,
            border: proj.type === 'slow' ? '2px dashed white' : 'none',
          }}
        />
      ))}

      {/* 粒子 */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color}, ${p.color}80)`,
            opacity: p.life / 50,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}