import React from 'react';

interface GameStatsProps {
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ wave, coreHealth, score, enemiesKilled }) => {
  return (
    <div className="flex items-center gap-6 mb-2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-amber-300">
      <div className="text-amber-800 font-bold flex items-center gap-1">
        <span className="text-xl">🌊</span>
        <span>波次 {wave}/10</span>
      </div>
      <div className="text-red-600 font-bold flex items-center gap-1">
        <span className="text-xl">❤️</span>
        <span>{coreHealth}</span>
      </div>
      <div className="text-amber-600 font-bold flex items-center gap-1">
        <span className="text-xl">⭐</span>
        <span>{score}</span>
      </div>
      <div className="text-green-600 font-bold flex items-center gap-1">
        <span className="text-xl">💀</span>
        <span>{enemiesKilled}</span>
      </div>
    </div>
  );
};
