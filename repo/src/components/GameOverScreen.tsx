interface GameOverScreenProps {
  score: number;
  enemiesKilled: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, enemiesKilled, onRestart }) => {
  return (
    <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-red-400 max-w-lg">
      <h1
        className="text-5xl font-bold text-red-600 mb-4"
        style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fca5a5' }}
      >
        💔 画布破碎
      </h1>
      <p className="text-amber-700 text-xl mb-6">颜料怪突破了防御...</p>

      <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-200">
        <div className="text-4xl font-bold text-amber-600 mb-2">最终得分: {score}</div>
        <div className="text-lg text-amber-700">击败敌人: {enemiesKilled} 只</div>
      </div>

      <button
        onClick={onRestart}
        className="px-10 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
      >
        🔄 重新开始
      </button>
    </div>
  );
};

interface VictoryScreenProps {
  score: number;
  enemiesKilled: number;
  onRestart: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ score, enemiesKilled, onRestart }) => {
  return (
    <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg">
      <h1
        className="text-5xl font-bold text-amber-600 mb-4"
        style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}
      >
        🎉 守护成功
      </h1>
      <p className="text-amber-700 text-xl mb-6">画布安全了！所有波次已被击退！</p>

      <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200">
        <div className="text-4xl font-bold text-amber-600 mb-2">最终得分: {score}</div>
        <div className="text-lg text-amber-700">击败敌人: {enemiesKilled} 只</div>
      </div>

      <button
        onClick={onRestart}
        className="px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
      >
        🔄 再玩一次
      </button>
    </div>
  );
};
