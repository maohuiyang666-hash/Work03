import type { Reward } from '../types/reward';
import { getRewardRarityClassName } from '../logic/rewardSystem';

interface RewardSelectionProps {
  wave: number;
  rewards: Reward[];
  onSelect: (reward: Reward) => void;
}

export function RewardSelection({ wave, rewards, onSelect }: RewardSelectionProps) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full shadow-lg border-2 border-amber-300 text-amber-800 font-bold">
          <span>🎁</span>
          <span>第 {wave} 波完成，选择 1 项战役奖励</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {rewards.map((reward) => (
          <button
            key={reward.id}
            onClick={() => onSelect(reward)}
            className={`text-left rounded-3xl border-2 bg-gradient-to-br p-5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${getRewardRarityClassName(reward.rarity)}`}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] opacity-80">{reward.rarity}</div>
                <h3 className="text-2xl font-bold">{reward.name}</h3>
              </div>
              <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold border border-white/30">{reward.type}</div>
            </div>
            <p className="text-sm leading-6 opacity-95 mb-4">{reward.description}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {reward.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium border border-white/20">
                  {tag}
                </span>
              ))}
            </div>
            <div className="inline-flex items-center rounded-full bg-black/10 px-4 py-2 text-sm font-bold border border-white/20">
              立即生效并进入下一波
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
