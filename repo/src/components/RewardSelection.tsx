import { Reward } from '../types/reward';
import { getRarityLabelMap } from '../logic/buildSystem';

interface Props {
  rewards: Reward[];
  onSelect: (reward: Reward) => void;
  wave: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-500 border-gray-400',
  rare: 'from-blue-400 to-blue-600 border-blue-400',
  epic: 'from-purple-500 to-purple-700 border-purple-500',
  legendary: 'from-yellow-400 to-orange-500 border-yellow-400',
};

const RARITY_GLOW: Record<string, string> = {
  common: '',
  rare: 'shadow-blue-300/50',
  epic: 'shadow-purple-400/50',
  legendary: 'shadow-yellow-400/50',
};

export default function RewardSelection({ rewards, onSelect, wave }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-amber-50 rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-2xl w-full mx-4">
        <h2 className="text-3xl font-bold text-amber-800 text-center mb-2" style={{ fontFamily: 'cursive' }}>
          🎁 选择奖励
        </h2>
        <p className="text-center text-amber-600 mb-6">
          第 {wave} 波已完成！选择一项奖励后进入下一波
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {rewards.map((reward) => (
            <button
              key={reward.id}
              onClick={() => onSelect(reward)}
              className={`relative p-4 rounded-2xl border-2 bg-white transition-all hover:scale-105 hover:shadow-xl cursor-pointer
                ${RARITY_COLORS[reward.rarity] || 'border-gray-300'}
                ${RARITY_GLOW[reward.rarity] || ''}
              `}
            >
              <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white
                bg-gradient-to-r ${RARITY_COLORS[reward.rarity] || 'from-gray-400 to-gray-500'}`}
              >
                {getRarityLabelMap(reward.rarity)}
              </div>

              <div className="text-3xl mb-2">
                {reward.type === 'towerDamage' ? '🔥' :
                 reward.type === 'towerRange' ? '👁️' :
                 reward.type === 'towerAttackSpeed' ? '⚡' :
                 reward.type === 'bonusPaint' ? '💰' :
                 reward.type === 'projectileSpeed' ? '💨' :
                 reward.type === 'coreHeal' ? '❤️' :
                 reward.type === 'splitProjectile' ? '💥' : '🌈'}
              </div>

              <h3 className="font-bold text-sm text-gray-800 mb-1">{reward.name}</h3>
              <p className="text-xs text-gray-500 leading-tight">{reward.description}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-amber-400">选择一个奖励来强化你的防御</p>
      </div>
    </div>
  );
}