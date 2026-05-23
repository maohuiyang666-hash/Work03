import React from 'react';

interface MenuScreenProps {
  onStart: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStart }) => (
  <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
    <div className="transform -rotate-1">
      <h1 className="text-5xl font-bold text-amber-700 mb-2" 
          style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}>
        🎨 绘世守护者
      </h1>
      <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender</p>
      
      <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
        <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center">
          📜 游戏说明
        </h3>
        <ul className="text-amber-700 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-500">🔴</span>
            <span><strong>红色颜料塔</strong>：高伤害单体攻击</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">🔵</span>
            <span><strong>蓝色颜料塔</strong>：范围减速效果</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500">🟡</span>
            <span><strong>黄色颜料塔</strong>：穿透攻击多个敌人</span>
          </li>
        </ul>
        <div className="mt-4 pt-3 border-t border-amber-200">
          <p className="text-amber-600 text-xs">💡 击败颜料怪获得颜料精华，用于建造更多防御塔！</p>
        </div>
      </div>
      
      <button
        onClick={onStart}
        className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
      >
        ✏️ 开始绘制冒险！
      </button>
    </div>
  </div>
);

interface GameOverScreenProps {
  wave: number;
  enemiesKilled: number;
  score: number;
  collectedTowersSize: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  wave, enemiesKilled, score, collectedTowersSize, onRestart
}) => (
  <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-300 max-w-md transform -rotate-1">
    <div className="transform rotate-1">
      <h2 className="text-4xl font-bold text-red-600 mb-4" style={{ fontFamily: 'cursive' }}>
        💔 画布被污染了...
      </h2>
      <p className="text-red-400 mb-6">颜料怪占领了你的画布核心</p>
      
      <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left space-y-2">
        <div className="flex justify-between text-red-800">
          <span>🌊 坚持波次</span>
          <span className="font-bold">{wave}</span>
        </div>
        <div className="flex justify-between text-red-800">
          <span>💀 消灭敌人</span>
          <span className="font-bold">{enemiesKilled}</span>
        </div>
        <div className="flex justify-between text-red-800">
          <span>⭐ 最终分数</span>
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex justify-between text-red-800">
          <span>📖 收集图鉴</span>
          <span className="font-bold">{collectedTowersSize}/9</span>
        </div>
      </div>
      
      <button onClick={onRestart}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg">
        🎨 重新开始
      </button>
    </div>
  </div>
);

interface VictoryScreenProps {
  enemiesKilled: number;
  score: number;
  collectedTowersSize: number;
  coreHealth: number;
  onRestart: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  enemiesKilled, score, collectedTowersSize, coreHealth, onRestart
}) => (
  <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-300 max-w-md transform rotate-1">
    <div className="transform -rotate-1">
      <h2 className="text-4xl font-bold text-green-600 mb-4" style={{ fontFamily: 'cursive' }}>
        🎉 画布已守护成功！
      </h2>
      <p className="text-green-400 mb-6">你成功击退了所有颜料怪的入侵！</p>
      
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 text-left space-y-2">
        <div className="flex justify-between text-green-800">
          <span>🏆 完成波次</span>
          <span className="font-bold">10/10</span>
        </div>
        <div className="flex justify-between text-green-800">
          <span>💀 消灭敌人</span>
          <span className="font-bold">{enemiesKilled}</span>
        </div>
        <div className="flex justify-between text-green-800">
          <span>⭐ 最终分数</span>
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex justify-between text-green-800">
          <span>📖 收集图鉴</span>
          <span className="font-bold">{collectedTowersSize}/9</span>
        </div>
        <div className="flex justify-between text-green-800">
          <span>❤️ 剩余生命</span>
          <span className="font-bold">{coreHealth}</span>
        </div>
      </div>
      
      <button onClick={onRestart}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
        🎨 再来一局
      </button>
    </div>
  </div>
);
