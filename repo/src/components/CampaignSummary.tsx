import React from 'react';
import { PlayerBuild } from '../types/reward';
import { DifficultyDirector, CampaignStats } from '../types/campaign';
import { BuildSystem } from '../logic/buildSystem';
import { RARITY_COLORS, RARITY_BG } from '../config/rewardConfig';
import { Tower, PaintEssence } from '../App';

interface CampaignSummaryProps {
  isVictory: boolean;
  finalWave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  towers: Tower[];
  totalPaintGained: PaintEssence;
  build: PlayerBuild;
  difficulty: DifficultyDirector;
  stats: CampaignStats;
  eventHistory: Array<{ wave: number; event: string }>;
  onRestart: () => void;
  onViewReplay?: () => void;
}

const CampaignSummary: React.FC<CampaignSummaryProps> = ({
  isVictory,
  finalWave,
  coreHealth,
  score,
  enemiesKilled,
  towers,
  totalPaintGained,
  build,
  difficulty,
  stats,
  eventHistory,
  onRestart,
  onViewReplay
}) => {
  const rarityCount = BuildSystem.getRarityCount(build.selectedRewards);
  const towerCounts = towers.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isNewHighScore = score > stats.highestScore;
  const isNewHighWave = finalWave > stats.highestWave;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isVictory ? 'border-4 border-green-400' : 'border-4 border-red-400'}`}>
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold mb-2 ${isVictory ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'cursive' }}>
            {isVictory ? '🎉 画布已守护成功！' : '💔 画布被污染了...'}
          </h2>
          <p className="text-gray-600">你的战役结束了</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
            <h3 className="font-bold text-amber-800 mb-4 text-lg">📊 核心数据</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">最高波次</span>
                <span className="font-bold text-xl text-amber-800 flex items-center gap-2">
                  {finalWave}
                  {isNewHighWave && <span className="text-yellow-500 text-sm">🏆 新纪录!</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">最终分数</span>
                <span className="font-bold text-xl text-amber-800 flex items-center gap-2">
                  {score}
                  {isNewHighScore && <span className="text-yellow-500 text-sm">🏆 新纪录!</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">剩余生命</span>
                <span className="font-bold text-xl text-red-600">{coreHealth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总击杀</span>
                <span className="font-bold text-xl text-purple-600">{enemiesKilled}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="font-bold text-blue-800 mb-4 text-lg">🎨 颜料统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-red-600">🔴 红色</span>
                <span className="font-bold">{totalPaintGained.red}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">🔵 蓝色</span>
                <span className="font-bold">{totalPaintGained.blue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">🟡 黄色</span>
                <span className="font-bold">{totalPaintGained.yellow}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
            <h3 className="font-bold text-purple-800 mb-4 text-lg">🏗️ 防御塔</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-red-600">🔴 烈焰塔</span>
                <span className="font-bold">{towerCounts.red || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">🔵 寒冰塔</span>
                <span className="font-bold">{towerCounts.blue || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">🟡 雷电塔</span>
                <span className="font-bold">{towerCounts.yellow || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">📈 构筑标签</h3>
            {build.buildTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {build.buildTags.map(tag => {
                  const tagInfo = BuildSystem.getTagInfo(tag);
                  return tagInfo ? (
                    <div
                      key={tag}
                      className="px-3 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-sm font-medium text-amber-800 flex items-center gap-2"
                    >
                      {tagInfo.icon} {tagInfo.name}
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">还没有明显的构筑倾向</p>
            )}
          </div>
        </div>

        {build.selectedRewards.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">🎁 获得的奖励</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {build.selectedRewards.map(reward => (
                <div
                  key={reward.id}
                  className={`p-3 rounded-xl border-2 ${RARITY_BG[reward.rarity]} ${RARITY_COLORS[reward.rarity]}`}
                >
                  <div className="font-bold text-sm">{reward.name}</div>
                  <div className="text-xs opacity-70">{reward.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {difficulty.history.length > 1 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">📊 难度变化</h3>
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {difficulty.history.slice(1).map((snapshot, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>波次 {snapshot.wave}</span>
                    <span className="font-bold">难度: {snapshot.difficulty.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {eventHistory.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">🎲 事件记录</h3>
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {eventHistory.map((event, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>波次 {event.wave}</span>
                    <span className="font-bold text-purple-600">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-xl"
          >
            🎨 再来一局
          </button>
          {onViewReplay && (
            <button
              onClick={onViewReplay}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl"
            >
              🎬 查看回放
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignSummary;
