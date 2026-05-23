import { TowerSelector } from './TowerSelector';
import { StyleSelector } from './StyleSelector';
import type { PaintEssence, TowerStyle, TowerType } from '../types/game';

interface ControlPanelProps {
  paint: PaintEssence;
  selectedTowerType: TowerType | null;
  selectedStyle: TowerStyle;
  onSelectTowerType: (type: TowerType) => void;
  onSelectStyle: (style: TowerStyle) => void;
}

export const ControlPanel = ({
  paint,
  selectedTowerType,
  selectedStyle,
  onSelectTowerType,
  onSelectStyle,
}: ControlPanelProps) => (
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
    <TowerSelector
      selectedTowerType={selectedTowerType}
      selectedStyle={selectedStyle}
      onSelectTowerType={onSelectTowerType}
    />

    <h3 className="font-bold text-amber-800 mb-2 text-center border-b-2 border-dashed border-amber-200 pb-2">
      🖌️ 笔触风格
    </h3>
    <StyleSelector selectedStyle={selectedStyle} onSelectStyle={onSelectStyle} />

    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
      💡 点击画布空白处放置防御塔
    </div>
  </div>
);
