interface GameOverScreenProps {
  wave: number;
  enemiesKilled: number;
  score: number;
  collectedCount: number;
  onRestart: () => void;
}

export const GameOverScreen = ({
  wave,
  enemiesKilled,
  score,
  collectedCount,
  onRestart,
}: GameOverScreenProps) => (
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
          <span className="font-bold">{collectedCount}/9</span>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
      >
        🎨 重新开始
      </button>
    </div>
  </div>
);
