import React from 'react';
import { Tower } from '../types';

interface CollectionPanelProps {
  collectedTowers: Set<string>;
  enemiesKilled: number;
  score: number;
  towers: Tower[];
}

export const CollectionPanel: React.FC<CollectionPanelProps> = ({
  collectedTowers,
  enemiesKilled,
  score,
  towers,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        📖 画家图鉴
      </h3>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['red', 'blue', 'yellow'] as const).map(type => 
          (['pencil', 'watercolor', 'oil'] as const).map(style => {
            const key = `${type}-${style}`;
            const isCollected = collectedTowers.has(key);
            
            return (
              <div key={key} 
                   className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xl
                     ${isCollected ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200 grayscale opacity-40'}`}
                   title={isCollected ? `${type === 'red' ? '烈焰' : type === 'blue' ? '寒冰' : '雷电'}${style === 'pencil' ? '铅笔' : style === 'watercolor' ? '水彩' : '油画'}塔` : '未解锁'}
              >
                <span className="drop-shadow-sm">
                  {isCollected ? (
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
  );
};
