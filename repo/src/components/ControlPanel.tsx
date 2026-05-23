import type { PaintEssence, TowerType, StyleType } from '../types/game';

interface ControlPanelProps {
  paint: PaintEssence;
  selectedTowerType: TowerType | null;
  selectedStyle: StyleType;
  towerCosts: Record<TowerType, PaintEssence>;
  onSelectTowerType: (type: TowerType | null) => void;
  onSelectStyle: (style: StyleType) => void;
  getColorValue: (type: TowerType) => string;
  getStyleClass: (style: string) => string;
}

export function ControlPanel({
  paint,
  selectedTowerType,
  selectedStyle,
  towerCosts,
  onSelectTowerType,
  onSelectStyle,
  getColorValue,
  getStyleClass,
}: ControlPanelProps) {
  const resourceColors: Array<{ key: TowerType; label: string; bgClass: string; textClass: string; barClass: string }> = [
    { key: 'red', label: '红色', bgClass: 'bg-red-50', textClass: 'text-red-600', barClass: 'bg-red-500' },
    { key: 'blue', label: '蓝色', bgClass: 'bg-blue-50', textClass: 'text-blue-600', barClass: 'bg-blue-500' },
    { key: 'yellow', label: '黄色', bgClass: 'bg-yellow-50', textClass: 'text-yellow-600', barClass: 'bg-yellow-500' },
  ];

  const styles: { style: StyleType; label: string }[] = [
    { style: 'pencil', label: '铅笔' },
    { style: 'watercolor', label: '水彩' },
    { style: 'oil', label: '油画' },
  ];

  const towerTypes: Array<{ type: TowerType; label: string }> = [
    { type: 'red', label: '烈焰塔' },
    { type: 'blue', label: '寒冰塔' },
    { type: 'yellow', label: '雷电塔' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        🎨 颜料精华
      </h3>

      <div className="space-y-3 mb-4">
        {resourceColors.map(rc => (
          <div key={rc.key} className={`flex items-center gap-2 p-2 ${rc.bgClass} rounded-lg`}>
            <div className={`w-6 h-6 rounded-full bg-${rc.key}-500 shadow-inner`}
                 style={{ backgroundColor: getColorValue(rc.key) }} />
            <div className="flex-1">
              <div className={`text-xs ${rc.textClass} font-medium`}>{rc.label}</div>
              <div className={`h-2 bg-${rc.key}-200 rounded-full overflow-hidden`}
                   style={{ backgroundColor: getColorValue(rc.key) + '40' }}>
                <div className={`h-full ${rc.barClass} transition-all`}
                     style={{ backgroundColor: getColorValue(rc.key), width: `${Math.min(100, paint[rc.key])}%` }} />
              </div>
            </div>
            <span className={`font-bold ${rc.textClass} w-8 text-right`}>{paint[rc.key]}</span>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
        ✏️ 绘制防御塔
      </h3>

      <div className="space-y-2 mb-4">
        {towerTypes.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => onSelectTowerType(selectedTowerType === type ? null : type)}
            className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
              selectedTowerType === type
                ? 'border-gray-800 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{
              background: `linear-gradient(135deg, ${getColorValue(type)}30, white)`,
            }}
          >
            <div
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl ${getStyleClass(selectedStyle)}`}
              style={{ backgroundColor: getColorValue(type) }}
            >
              {selectedStyle === 'pencil' ? '\u270f\ufe0f' : selectedStyle === 'watercolor' ? '\ud83d\udca7' : '\ud83c\udfa8'}
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold" style={{ color: getColorValue(type) }}>
                {label}
              </div>
              <div className="text-xs text-gray-500">消耗 {towerCosts[type][type]} 精华</div>
            </div>
          </button>
        ))}
      </div>

      <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
        🖌️ 笔触风格
      </h3>

      <div className="grid grid-cols-3 gap-1 mb-4">
        {styles.map(({ style, label }) => (
          <button
            key={style}
            onClick={() => onSelectStyle(style)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              selectedStyle === style
                ? 'bg-amber-400 text-amber-900 shadow-md'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
        提示 点击画布空白处放置防御塔
      </div>
    </div>
  );
}