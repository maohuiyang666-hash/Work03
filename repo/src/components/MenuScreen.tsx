interface MenuScreenProps {
  onStartGame: () => void;
}

export function MenuScreen({ onStartGame }: MenuScreenProps) {
  return (
    <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-amber-400 max-w-lg transform rotate-1">
      <div className="transform -rotate-1">
        <h1
          className="text-5xl font-bold text-amber-700 mb-2"
          style={{ fontFamily: 'cursive', textShadow: '3px 3px 0 #fcd34d' }}
        >
          🎨 绘世守护者
        </h1>
        <p className="text-amber-600 mb-6 text-lg italic">Canvas Defender</p>

        <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left">
          <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center">📜 游戏说明</h3>
          <ul className="text-amber-700 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-500">[红色]</span>
              <span><strong>红色颜料塔</strong>：高伤害单体攻击</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">[蓝色]</span>
              <span><strong>蓝色颜料塔</strong>：范围减速效果</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">[黄色]</span>
              <span><strong>黄色颜料塔</strong>：穿透攻击多个敌人</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-amber-200">
            <p className="text-amber-600 text-xs">提示 击败颜料怪获得颜料精华，用于建造更多防御塔！</p>
          </div>
        </div>

        <button
          onClick={onStartGame}
          className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
        >
          ✏️ 开始绘制冒险！
        </button>
      </div>
    </div>
  );
}