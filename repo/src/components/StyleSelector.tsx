import { TOWER_STYLE_META } from '../config/towerConfig';
import type { TowerStyle } from '../types/game';

interface StyleSelectorProps {
  selectedStyle: TowerStyle;
  onSelectStyle: (style: TowerStyle) => void;
}

export const StyleSelector = ({ selectedStyle, onSelectStyle }: StyleSelectorProps) => (
  <div className="grid grid-cols-3 gap-1 mb-4">
    {(['pencil', 'watercolor', 'oil'] as const).map((style) => (
      <button
        key={style}
        onClick={() => onSelectStyle(style)}
        className={`p-2 rounded-lg text-xs font-medium transition-all ${
          selectedStyle === style
            ? 'bg-amber-400 text-amber-900 shadow-md'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
      >
        {TOWER_STYLE_META[style].label}
      </button>
    ))}
  </div>
);
