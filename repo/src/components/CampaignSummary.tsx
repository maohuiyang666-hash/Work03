import { CampaignState, PlayerBuild } from '../types/campaign';
import { ReplayData } from '../types/replay';
import { getRarityLabelMap } from '../logic/buildSystem';
import { hasCampaignSave } from '../logic/saveSystem';

interface Props {
  gameOver: boolean;
  campaign: CampaignState;
  build: PlayerBuild;
  replay?: ReplayData;
  isHighScore: boolean;
  towerColorCounts: { red: number; blue: number; yellow: number };
  onRestart: () => void;
  onViewReplay: () => void;
  onLoadPrevious: () => void;
}

export default function CampaignSummary({
  gameOver,
  campaign,
  build,
  replay,
  isHighScore,
  towerColorCounts,
  onRestart,
  onViewReplay,
  onLoadPrevious,
}: Props) {
  const bgColor = gameOver ? 'from-red-50 to-red-100 border-red-400' : 'from-green-50 to-emerald-100 border-green-400';
  const titleColor = gameOver ? 'text-red-600' : 'text-green-600';
  const emoji = gameOver ? '💔' : '🎉';
  const titleText = gameOver ? '画布被污染了...' : '画布已守护成功！';
  const subtitle = gameOver ? '颜料怪占领了你的画布核心' : '你成功击退了所有颜料怪的入侵！';

  const rarityCounts: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  build.selectedRewards.forEach(r => { rarityCounts[r.rarity] = (rarityCounts[r.rarity] || 0) + 1; });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${bgColor} rounded-3xl shadow-2xl p-8 border-4 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        <h2 className={`text-3xl font-bold ${titleColor} text-center mb-1`} style={{ fontFamily: 'cursive' }}>
          {emoji} {titleText}
        </h2>
        <p className="text-center text-gray-500 mb-4">{subtitle}</p>

        {isHighScore && (
          <div className="bg-yellow-100 rounded-xl p-2 mb-4 text-center animate-pulse">
            <span className="text-yellow-700 font-bold">🏆 刷新历史最高分！</span>
          </div>
        )}

        <div className="bg-white/80 rounded-2xl p-4 mb-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span>⭐ 最终分数</span><span className="font-bold text-amber-600">{campaign.score}</span></div>
          <div className="flex justify-between"><span>🌊 最高波次</span><span className="font-bold text-blue-600">{campaign.wave}</span></div>
          <div className="flex justify-between"><span>❤️ 核心剩余生命</span><span className="font-bold text-red-600">{campaign.coreHealth}</span></div>
          <div className="flex justify-between"><span>💀 总击杀数</span><span className="font-bold text-gray-600">{campaign.enemiesKilled}</span></div>
          <div className="flex justify-between"><span>🎨 总获得颜料</span><span className="font-bold text-green-600">
            {campaign.paint.red + campaign.paint.blue + campaign.paint.yellow}</span>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">🏗️ 构筑流派</h3>
          <div className="flex flex-wrap gap-1 mb-2">
            {build.buildTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white">{tag}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div className="bg-red-50 p-1 rounded"><span className="text-red-600 font-bold">{build.buildStats.redPower.toFixed(1)}</span><br/>红色之力</div>
            <div className="bg-blue-50 p-1 rounded"><span className="text-blue-600 font-bold">{build.buildStats.blueControl.toFixed(1)}</span><br/>蓝色掌控</div>
            <div className="bg-yellow-50 p-1 rounded"><span className="text-yellow-600 font-bold">{build.buildStats.yellowSpeed.toFixed(1)}</span><br/>黄色极速</div>
            <div className="bg-green-50 p-1 rounded"><span className="text-green-600 font-bold">{build.buildStats.economy.toFixed(1)}</span><br/>颜料经济</div>
            <div className="bg-purple-50 p-1 rounded"><span className="text-purple-600 font-bold">{build.buildStats.defense.toFixed(1)}</span><br/>核心防御</div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">🎁 奖励统计 ({build.selectedRewards.length}项)</h3>
          <div className="flex gap-2 text-xs">
            {Object.entries(rarityCounts).map(([r, c]) => c > 0 && (
              <span key={r} className="px-2 py-1 rounded-full bg-white shadow">
                {getRarityLabelMap(r)}: <span className="font-bold">{c}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5 text-xs">
            {build.selectedRewards.map(r => (
              <div key={r.id} className="flex justify-between text-gray-600">
                <span>{r.name}</span>
                <span className="text-gray-400">{getRarityLabelMap(r.rarity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">📊 其他数据</h3>
          <div className="text-xs space-y-1 text-gray-600">
            <div className="flex justify-between"><span>🔴 红色塔数</span><span>{towerColorCounts.red}</span></div>
            <div className="flex justify-between"><span>🔵 蓝色塔数</span><span>{towerColorCounts.blue}</span></div>
            <div className="flex justify-between"><span>🟡 黄色塔数</span><span>{towerColorCounts.yellow}</span></div>
            <div className="flex justify-between"><span>⚡ 随机事件</span><span>{campaign.eventHistory.length}次</span></div>
            <div className="flex justify-between"><span>🎯 难度调整</span><span>{campaign.difficultyHistory.length}次</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onRestart}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
            🎨 重新开始
          </button>
          {replay && (
            <button onClick={onViewReplay}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
              ▶️ 查看回放
            </button>
          )}
          {hasCampaignSave() && (
            <button onClick={onLoadPrevious}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
              📂 读取存档
            </button>
          )}
        </div>
      </div>
    </div>
  );
}