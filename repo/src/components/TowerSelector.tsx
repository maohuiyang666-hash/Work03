import { TOWER_COSTS, TOWER_STYLE_META, TOWER_TYPE_META, getTowerColor, getStyleClass } from '../config/towerConfig';
import type { TowerStyle, TowerType } from '../types/game';

interface TowerSelectorProps {
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  onSelectTowerType: (type: TowerType) => void;
}

export const TowerSelector = ({
  selectedTowerType,
  selectedStyle,
  onSelectTowerType,
}: TowerSelectorProps) => (
  <div className="space-y-2 mb-4">
    {(['red', 'blue', 'yellow'] as const).map((type) => (
      <button
        key={type}
        onClick={() => onSelectTowerType(type)}
        className={`w-full p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
          selectedTowerType === type
            ? 'border-gray-800 shadow-lg scale-105'
            : 'border-gray-200 hover:border-gray-400'
        }`}
        style={{
          background: `linear-gradient(135deg, ${getTowerColor(type)}30, white)`,
        }}
      >
        <div
          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl ${getStyleClass(selectedStyle)}`}
          style={{ backgroundColor: getTowerColor(type) }}
        >
          {TOWER_STYLE_META[selectedStyle].icon}
        </div>
        <div className="text-left flex-1">
          <div className="text-sm font-bold" style={{ color: getTowerColor(type) }}>
            {TOWER_TYPE_META[type].label}
          </div>
          <div className="text-xs text-gray-500">消耗 {TOWER_COSTS[type][type]} 精华</div>
        </div>
      </button>
    ))}
  </div>
);
