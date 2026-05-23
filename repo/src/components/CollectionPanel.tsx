import type { TowerType, TowerStyle } from '../types/game';

interface CollectionPanelProps {
  collectedTowers: Set<string>;
  getTowerColorValue: (type: TowerType) => string;
  getTowerStyleClass: (style: string) => string;
}

export const CollectionPanel: React.FC<CollectionPanelProps> = ({
  collectedTowers,
  getTowerColorValue,
  getTowerStyleClass,
}) => {
  const towerTypes: TowerType[] = ['red', 'blue', 'yellow'];
  const styles: TowerStyle[] = ['pencil', 'watercolor', 'oil'];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-52">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        📖 图鉴收集
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {towerTypes.map(type =>
          styles.map(style => {
            const key = `${type}-${style}`;
            const collected = collectedTowers.has(key);
            return (
              <div
                key={key}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  collected ? `${getTowerStyleClass(style)} shadow-md` : 'bg-gray-100 border-gray-200'
                }`}
                style={{ backgroundColor: collected ? getTowerColorValue(type) : '#f3f4f6' }}
                title={collected ? `${type}-${style}` : '未收集'}
              >
                <span className="text-lg">
                  {collected ? (
                    style === 'pencil' ? '✏️' : style === 'watercolor' ? '💧' : '🖌️'
                  ) : (
                    '❓'
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
