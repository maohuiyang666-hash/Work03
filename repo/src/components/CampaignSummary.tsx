import { CampaignState, PlayerBuild, CampaignStats } from '../types/campaign';

interface CampaignSummaryProps {
  state: CampaignState;
  build: PlayerBuild;
  stats: CampaignStats;
  isVictory: boolean;
  onRestart: () => void;
  onViewReplay?: () => void;
}

export const CampaignSummary = ({ state, build, stats, isVictory, onRestart, onViewReplay }: CampaignSummaryProps) => {
  const isNewHighScore = state.score > stats.highestScore;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-8 border-double text-center max-h-[90vh] overflow-y-auto"
           style={{ borderColor: isVictory ? '#fbbf24' : '#ef4444' }}>
        <h1 className="text-5xl font-black mb-2 drop-shadow-md" style={{ color: isVictory ? '#d97706' : '#b91c1c' }}>
          {isVictory ? '🎉 战役胜利！' : '💀 战役失败'}
        </h1>
        <p className="text-gray-500 mb-6 text-lg">
          {isVictory ? '你成功守护了这片画布！' : `你在第 ${state.currentWave} 波被击败了...`}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-left">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-sm font-bold">最终分数</div>
            <div className="text-3xl font-black text-amber-600 flex items-center gap-2">
              {state.score} {isNewHighScore && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">新纪录!</span>}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-sm font-bold">最高波次</div>
            <div className="text-3xl font-black text-blue-600">{Math.max(state.currentWave, stats.highestWave)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-sm font-bold">总击杀数</div>
            <div className="text-xl font-bold text-gray-800">💀 {state.enemiesKilled}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-sm font-bold">剩余核心生命</div>
            <div className="text-xl font-bold text-gray-800">❤️ {state.coreHealth}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-2 border-b-2 pb-2">🛠️ 最终构筑流派</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {build.buildTags.length > 0 ? build.buildTags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300">
                {tag}
              </span>
            )) : <span className="text-gray-400">无流派</span>}
          </div>
        </div>

        <div className="mb-8 text-left">
          <h3 className="text-lg font-bold text-gray-700 mb-2 border-b-2 pb-2">🎁 已获奖励 ({build.selectedRewards.length})</h3>
          <div className="flex flex-wrap gap-2">
            {build.selectedRewards.map((r, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-700" title={r.description}>
                {r.name}
              </span>
            ))}
            {build.selectedRewards.length === 0 && <span className="text-gray-400 text-sm">未获得任何奖励</span>}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {onViewReplay && (
            <button onClick={onViewReplay} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg">
              📼 查看回放
            </button>
          )}
          <button onClick={onRestart} className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg text-lg">
            🔄 重新开始
          </button>
        </div>
      </div>
    </div>
  );
};
