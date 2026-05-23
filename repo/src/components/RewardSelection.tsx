import React from 'react';
import { Reward } from '../types/reward';

interface RewardSelectionProps {
  rewards: Reward[];
  onSelect: (reward: Reward) => void;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 border-gray-300 text-gray-800',
  rare: 'bg-blue-50 border-blue-300 text-blue-800',
  epic: 'bg-purple-50 border-purple-300 text-purple-800',
  legendary: 'bg-orange-50 border-orange-400 text-orange-800'
};

export const RewardSelection: React.FC<RewardSelectionProps> = ({ rewards, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border-4 border-amber-400 transform transition-all">
        <h2 className="text-3xl font-bold text-amber-800 text-center mb-6 drop-shadow-sm">
          🎁 选择波次奖励
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewards.map(reward => (
            <button
              key={reward.id}
              onClick={() => onSelect(reward)}
              className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 hover:shadow-xl flex flex-col items-center text-center ${RARITY_COLORS[reward.rarity]}`}
            >
              <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
                {reward.rarity === 'legendary' ? '🌟 传说' : reward.rarity === 'epic' ? '✨ 史诗' : reward.rarity === 'rare' ? '稀有' : '普通'}
              </div>
              <h3 className="text-xl font-bold mb-3">{reward.name}</h3>
              <p className="text-sm opacity-90 flex-1">{reward.description}</p>
              
              <div className="mt-4 px-4 py-2 rounded-full bg-white bg-opacity-50 text-xs font-bold w-full">
                点击选择
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
