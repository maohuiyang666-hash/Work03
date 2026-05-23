import React from 'react';
import { PlayerBuild } from '../types/reward';
import { BuildSystem } from '../logic/buildSystem';
import { RARITY_COLORS } from '../config/rewardConfig';

interface BuildPanelProps {
  build: PlayerBuild;
}

const BuildPanel: React.FC<BuildPanelProps> = ({ build }) => {
  const rarityCount = BuildSystem.getRarityCount(build.selectedRewards);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        📊 你的构筑
      </h3>

      {build.buildTags.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-sm text-gray-700 mb-2">构筑标签</h4>
          <div className="flex flex-wrap gap-2">
            {build.buildTags.map(tag => {
              const tagInfo = BuildSystem.getTagInfo(tag);
              return tagInfo ? (
                <div
                  key={tag}
                  className="px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-xs font-medium text-amber-800 flex items-center gap-1"
                >
                  {tagInfo.icon} {tagInfo.name}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-bold text-sm text-gray-700 mb-2">稀有度统计</h4>
        <div className="space-y-1">
          {Object.entries(rarityCount).map(([rarity, count]) => (
            <div key={rarity} className="flex justify-between text-xs">
              <span className={RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-bold text-sm text-gray-700 mb-2">属性倾向</h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>🔥 红塔</span>
              <span>{Math.floor(build.buildStats.redPower * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${Math.min(100, build.buildStats.redPower * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>❄️ 蓝塔</span>
              <span>{Math.floor(build.buildStats.blueControl * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, build.buildStats.blueControl * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>⚡ 黄塔</span>
              <span>{Math.floor(build.buildStats.yellowSpeed * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${Math.min(100, build.buildStats.yellowSpeed * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {build.selectedRewards.length > 0 && (
        <div>
          <h4 className="font-bold text-sm text-gray-700 mb-2">已选奖励 ({build.selectedRewards.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {build.selectedRewards.map(reward => (
              <div
                key={reward.id}
                className={`text-xs p-2 rounded-lg ${RARITY_COLORS[reward.rarity]} bg-gray-50`}
              >
                {reward.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPanel;
