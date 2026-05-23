import type { TowerType, TowerStyle, PaintEssence } from '../types/game';

interface ControlPanelProps {
  paint: PaintEssence;
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  onSelectTowerType: (type: TowerType | null) => void;
  onSelectStyle: (style: TowerStyle) => void;
  getTowerColorValue: (type: TowerType) => string;
  getTowerStyleClass: (style: string) => string;
}

const TOWER_COSTS: Record<string, number> = {
  red: 30,
  blue: 30,
  yellow: 30,
};

const TOWER_NAMES: Record<TowerType, string> = {
  red: '烈焰塔',
  blue: '寒冰塔',
  yellow: '雷电塔',
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  paint,
  selectedTowerType,
  selectedStyle,
  onSelectTowerType,
  onSelectStyle,
  getTowerColorValue,
  getTowerStyleClass,
}) => {
  const towerTypes: TowerType[] = ['red', 'blue', 'yellow'];
  const styles: TowerStyle[] = ['pencil', 'watercolor', 'oil'];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        🎨 颜料精华
      </h3>

      <div className="space-y-3 mb-4">
        {(['red', 'blue', 'yellow'] as const).map(type => (
          <div key={type} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-red-500 shadow-inner" />
            <div className="flex-1">
              <div className="text-xs text-red-600 font-medium">{type === 'red' ? '红色' : type === 'blue' ? '蓝色' : '黄色'}</div>
              <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.min(100, paint[type])}%` }} />
              </div>
            </div>
            <span className="font-bold text-red-600 w-8 text-right">{paint[type]}</span>
          </div>
        ))}
      </div>

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
              <div className="text-xs text-gray-500">消耗 {TOWER_COSTS[type]} 精华</div>
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

      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
        💡 点击画布空白处放置防御塔
      </div>
    </div>
  );
};
