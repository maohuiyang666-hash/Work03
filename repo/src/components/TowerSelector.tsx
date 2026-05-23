import type { TowerType, TowerStyle } from '../types/game';

interface GameStatsProps {
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  MAX_WAVES?: number;
}

export const GameStats: React.FC<GameStatsProps> = ({
  wave,
  coreHealth,
  score,
  enemiesKilled,
  MAX_WAVES = 10,
}) => {
  return (
    <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300">
      <div className="text-amber-800 font-bold flex items-center gap-1">
        <span className="text-xl">🌊</span>
        <span>波次 {wave}/{MAX_WAVES}</span>
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
  );
};

interface TowerSelectorProps {
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  onSelectTowerType: (type: TowerType | null) => void;
  onSelectStyle: (style: TowerStyle) => void;
  getTowerColorValue: (type: TowerType) => string;
  getTowerStyleClass: (style: string) => string;
  paint: { red: number; blue: number; yellow: number };
}

export const TowerSelector: React.FC<TowerSelectorProps> = ({
  selectedTowerType,
  selectedStyle,
  onSelectTowerType,
  onSelectStyle,
  getTowerColorValue,
  getTowerStyleClass,
  paint,
}) => {
  const towerTypes: TowerType[] = ['red', 'blue', 'yellow'];
  const styles: TowerStyle[] = ['pencil', 'watercolor', 'oil'];

  const TOWER_COSTS: Record<TowerType, number> = {
    red: 30,
    blue: 30,
    yellow: 30,
  };

  const TOWER_NAMES: Record<TowerType, string> = {
    red: '烈焰塔',
    blue: '寒冰塔',
    yellow: '雷电塔',
  };

  return (
    <>
      <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
        ✏️ 绘制防御塔
      </h3>

      <div className="space-y-2 mb-4">
        {towerTypes.map(type => (
          <button
            key={type}
            onClick={() => onSelectTowerType(selectedTowerType === type ? null : type)}
            className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
              selectedTowerType === type ? 'border-gray-800 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{
              background: `linear-gradient(135deg, ${getTowerColorValue(type)}30, white)`,
            }}
          >
            <div
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl ${getTowerStyleClass(selectedStyle)}`}
              style={{ backgroundColor: getTowerColorValue(type) }}
            >
              {selectedStyle === 'pencil' ? '✏️' : selectedStyle === 'watercolor' ? '💧' : '🖌️'}
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold" style={{ color: getTowerColorValue(type) }}>
                {TOWER_NAMES[type]}
              </div>
              <div className="text-xs text-gray-500">
                消耗 {TOWER_COSTS[type]} {type} 精华 (现有: {paint[type]})
              </div>
            </div>
          </button>
        ))}
      </div>

      <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
        🖌️ 笔触风格
      </h3>

      <div className="grid grid-cols-3 gap-1 mb-4">
        {styles.map(style => (
          <button
            key={style}
            onClick={() => onSelectStyle(style)}
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
    </>
  );
};
