import type { CampaignStats, DifficultySnapshot, HistoricalMeta } from '../types/campaign';
import type { PaintEssence, Tower } from '../types/game';
import type { PlayerBuild } from '../types/reward';

interface CampaignSummaryProps {
  result: 'victory' | 'gameOver';
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  totalPaintEarned: number;
  build: PlayerBuild;
  towers: Tower[];
  stats: CampaignStats;
  historicalMeta: HistoricalMeta;
  isNewRecord: boolean;
  onRestart: () => void;
}

const rarityLabels = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const towerCounts = (towers: Tower[]) => ({
  red: towers.filter((tower) => tower.type === 'red').length,
  blue: towers.filter((tower) => tower.type === 'blue').length,
  yellow: towers.filter((tower) => tower.type === 'yellow').length,
});

const averageThreat = (history: DifficultySnapshot[]): string => {
  if (!history.length) return '1.00';
  const value = history.reduce((sum, item) => sum + item.threatLevel, 0) / history.length;
  return value.toFixed(2);
};

export function CampaignSummary({
  result,
  wave,
  coreHealth,
  score,
  enemiesKilled,
  totalPaintEarned,
  build,
  towers,
  stats,
  historicalMeta,
  isNewRecord,
  onRestart,
}: CampaignSummaryProps) {
  const countByColor = towerCounts(towers);
  const title = result === 'victory' ? '🎉 画布守护成功' : '💔 战役失败';
  const tone = result === 'victory' ? 'green' : 'red';

  return (
    <div className={`w-full max-w-6xl mx-auto rounded-[2rem] border-4 bg-white/95 p-6 shadow-2xl ${tone === 'green' ? 'border-green-300' : 'border-red-300'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-4xl font-bold mb-2 ${tone === 'green' ? 'text-green-600' : 'text-red-600'}`}>{title}</h2>
          <p className={`text-sm ${tone === 'green' ? 'text-green-500' : 'text-red-500'}`}>战役结算已汇总奖励、构筑、导演记录、随机事件与历史成绩。</p>
        </div>
        <button
          onClick={onRestart}
          className={`rounded-2xl px-6 py-3 text-lg font-bold text-white shadow-lg ${tone === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
        >
          重新开始
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="text-sm text-amber-600">最终分数</div>
          <div className="text-3xl font-bold text-amber-800">{score}</div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4">
          <div className="text-sm text-rose-500">最高波次</div>
          <div className="text-3xl font-bold text-rose-700">{wave}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="text-sm text-emerald-500">核心剩余生命</div>
          <div className="text-3xl font-bold text-emerald-700">{coreHealth}</div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <div className="text-sm text-sky-500">总击杀数</div>
          <div className="text-3xl font-bold text-sky-700">{enemiesKilled}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-amber-200 p-4">
          <h3 className="font-bold text-amber-800 mb-3">构筑总览</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {build.buildTags.length ? build.buildTags.map((tag) => <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{tag}</span>) : <span className="text-sm text-slate-500">无</span>}
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <div>总获得颜料：{totalPaintEarned}</div>
            <div>已选奖励：{build.selectedRewards.length}</div>
            <div>平均导演强度：{averageThreat(stats.difficultyHistory)}</div>
            <div>历史最强 Build：{historicalMeta.strongestBuild.join(' / ') || '暂无'}</div>
            <div>{isNewRecord ? '本局刷新历史纪录' : '本局未刷新历史纪录'}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-200 p-4">
          <h3 className="font-bold text-indigo-800 mb-3">奖励稀有度统计</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(stats.rewardRarityCount).map(([rarity, count]) => (
              <div key={rarity} className="flex justify-between rounded-xl bg-indigo-50 px-3 py-2">
                <span>{rarityLabels[rarity as keyof typeof rarityLabels]}</span>
                <span className="font-bold text-indigo-700">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-indigo-700">历史最高分：{historicalMeta.highestScore}</div>
          <div className="text-sm text-indigo-700">历史最高波次：{historicalMeta.highestWave}</div>
        </div>

        <div className="rounded-3xl border border-emerald-200 p-4">
          <h3 className="font-bold text-emerald-800 mb-3">塔配置统计</h3>
          <div className="space-y-2 text-sm text-emerald-700">
            <div className="flex justify-between rounded-xl bg-red-50 px-3 py-2"><span>红塔数量</span><span className="font-bold">{countByColor.red}</span></div>
            <div className="flex justify-between rounded-xl bg-blue-50 px-3 py-2"><span>蓝塔数量</span><span className="font-bold">{countByColor.blue}</span></div>
            <div className="flex justify-between rounded-xl bg-yellow-50 px-3 py-2"><span>黄塔数量</span><span className="font-bold">{countByColor.yellow}</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="rounded-3xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-800 mb-3">导演变化记录</h3>
          <div className="space-y-2 max-h-64 overflow-auto text-sm">
            {stats.difficultyHistory.length ? (
              stats.difficultyHistory.map((entry) => (
                <div key={`${entry.wave}-${entry.threatLevel}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="font-bold text-slate-700">第 {entry.wave} 波 · 威胁 {entry.threatLevel.toFixed(2)}</div>
                  <div className="text-slate-500">敌人数 {entry.enemyCount} / 生命 {entry.enemyHealth} / 速度 {entry.enemySpeed}</div>
                  <div className="text-slate-500">混合敌人 {Math.round(entry.mixedChance * 100)}% · 精英 {Math.round(entry.eliteChance * 100)}%</div>
                  <div className="text-slate-600">{entry.summary}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-500">暂无难度变化记录</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-fuchsia-200 p-4">
          <h3 className="font-bold text-fuchsia-800 mb-3">随机事件记录</h3>
          <div className="space-y-2 max-h-64 overflow-auto text-sm">
            {stats.eventHistory.length ? (
              stats.eventHistory.map((event) => (
                <div key={event.id} className="rounded-2xl bg-fuchsia-50 px-4 py-3">
                  <div className="font-bold text-fuchsia-700">{event.name}</div>
                  <div className="text-fuchsia-600">开始：第 {event.startedWave} 波 {event.endedWave ? `· 结束：第 ${event.endedWave} 波` : ''}</div>
                  <div className="text-fuchsia-700">{event.description}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-fuchsia-50 px-4 py-3 text-fuchsia-500">本局没有触发随机事件</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 p-4">
        <h3 className="font-bold text-amber-800 mb-3">已选择奖励</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {build.selectedRewards.length ? (
            build.selectedRewards.map((reward) => (
              <div key={reward.id} className="rounded-2xl bg-amber-50 px-4 py-3">
                <div className="font-bold text-amber-800">{reward.name}</div>
                <div className="text-xs text-amber-600 uppercase">{reward.rarity}</div>
                <div className="text-sm text-amber-700 mt-1">{reward.description}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-600">本局未选择奖励</div>
          )}
        </div>
      </div>
    </div>
  );
}
