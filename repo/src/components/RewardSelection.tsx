import React from 'react';
import { Reward } from '../types/reward';
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER } from '../config/rewardConfig';

interface RewardSelectionProps {
  rewards: Reward[];
  onSelectReward: (reward: Reward) => void;
  currentWave: number;
}

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return '⚪';
    case 'rare':
      return '🔵';
    case 'epic':
      return '🟣';
    case 'legendary':
      return '🟡';
    default:
      return '⚪';
  }
};

const RewardSelection: React.FC<RewardSelectionProps> = ({
  rewards,
  onSelectReward,
  currentWave
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl transform rotate-1">
        <div className="transform -rotate-1">
          <h2 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: 'cursive', color: '#92400e' }}>
            🎉 第 {currentWave} 波完成！
          </h2>
          <p className="text-center text-gray-600 mb-8">选择一个奖励继续你的冒险</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward, index) => (
              <button
                key={reward.id}
                onClick={() => onSelectReward(reward)}
                className={`p-6 rounded-2xl border-4 transition-all transform hover:scale-105 hover:shadow-xl ${RARITY_BG[reward.rarity]} ${RARITY_BORDER[reward.rarity]} group`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{getRarityIcon(reward.rarity)}</div>
                <h3 className={`text-xl font-bold mb-2 ${RARITY_COLORS[reward.rarity]}`}>
                  {reward.name}
                </h3>
                <p className="text-gray-600 text-sm">{reward.description}</p>
                <div className="mt-4 text-xs uppercase tracking-wider font-semibold opacity-60">
                  {reward.rarity.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardSelection;
