import type { ActiveCampaignEvent } from '../types/campaign';
import type { PlayerBuild } from '../types/reward';

interface BuildPanelProps {
  build: PlayerBuild;
  activeEvent: ActiveCampaignEvent | null;
}

export function BuildPanel({ build, activeEvent }: BuildPanelProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-72">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        🧬 构筑面板
      </h3>

      <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
        {build.buildTags.length ? (
          build.buildTags.map((tag) => (
            <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-amber-500">暂未形成明确流派</span>
        )}
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2">
          <span>红塔强度</span>
          <span className="font-bold text-red-600">{build.buildStats.redPower}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2">
          <span>蓝塔控制</span>
          <span className="font-bold text-blue-600">{build.buildStats.blueControl}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-yellow-50 px-3 py-2">
          <span>黄塔连射</span>
          <span className="font-bold text-yellow-600">{build.buildStats.yellowSpeed}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2">
          <span>经济运营</span>
          <span className="font-bold text-emerald-600">{build.buildStats.economy}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-violet-50 px-3 py-2">
          <span>核心防御</span>
          <span className="font-bold text-violet-600">{build.buildStats.defense}</span>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 mb-4">
        <h4 className="font-bold text-amber-800 mb-2 text-sm">当前强化</h4>
        <div className="space-y-1 text-xs text-amber-700">
          <div>塔伤害倍率 ×{build.modifiers.damageMultiplier.toFixed(2)}</div>
          <div>塔范围加成 +{build.modifiers.rangeBonus.toFixed(2)}</div>
          <div>塔攻速倍率 ×{build.modifiers.attackSpeedMultiplier.toFixed(2)}</div>
          <div>子弹速度倍率 ×{build.modifiers.projectileSpeedMultiplier.toFixed(2)}</div>
          <div>击杀额外颜料 +{build.modifiers.bonusPaintOnKill}</div>
          <div>分裂弹 +{build.modifiers.splitShots}</div>
          <div>额外命中 +{build.modifiers.chainHits}</div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-4 min-h-[88px]">
        <h4 className="font-bold text-slate-700 mb-2 text-sm">已选奖励</h4>
        <div className="space-y-1 text-xs text-slate-600 max-h-32 overflow-auto">
          {build.selectedRewards.length ? (
            build.selectedRewards.map((reward) => <div key={reward.id}>• {reward.name}</div>)
          ) : (
            <div>尚未选择奖励</div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-3">
        <h4 className="font-bold text-indigo-700 mb-2 text-sm">特殊强化 / 事件</h4>
        <div className="space-y-1 text-xs text-indigo-700">
          {build.unlockedSpecials.length ? build.unlockedSpecials.map((item) => <div key={item}>• {item}</div>) : <div>暂未解锁特殊强化</div>}
          {activeEvent ? <div>• 当前事件：{activeEvent.name}</div> : <div>• 当前无随机事件</div>}
        </div>
      </div>
    </div>
  );
}
