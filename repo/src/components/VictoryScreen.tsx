interface VictoryScreenProps {
  enemiesKilled: number;
  score: number;
  coreHealth: number;
  collectedCount: number;
  onRestart: () => void;
}

export function VictoryScreen({
  enemiesKilled,
  score,
  coreHealth,
  collectedCount,
  onRestart,
}: VictoryScreenProps) {
  return (
    <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-300 max-w-md transform rotate-1">
      <div className="transform -rotate-1">
        <h2
          className="text-4xl font-bold text-green-600 mb-4"
          style={{ fontFamily: 'cursive' }}
        >
          🎉 画布已守护成功！
        </h2>
        <p className="text-green-400 mb-6">你成功击退了所有颜料怪的入侵！</p>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-green-800">
            <span>📊 完成波次</span>
            <span className="font-bold">10/10</span>
          </div>
          <div className="flex justify-between text-green-800">
            <span>⚡ 消灭敌人</span>
            <span className="font-bold">{enemiesKilled}</span>
          </div>
          <div className="flex justify-between text-green-800">
            <span>🏆 最终分数</span>
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex justify-between text-green-800">
            <span>📚 收集图鉴</span>
            <span className="font-bold">{collectedCount}/9</span>
          </div>
          <div className="flex justify-between text-green-800">
            <span>🛡️ 剩余生命</span>
            <span className="font-bold">{coreHealth}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
        >
          🔄 再来一局
        </button>
      </div>
    </div>
  );
}