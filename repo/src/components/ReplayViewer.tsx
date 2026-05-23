import { ReplayData } from '../types/replay';

interface ReplayViewerProps {
  replay: ReplayData;
  onClose: () => void;
}

export const ReplayViewer = ({ replay, onClose }: ReplayViewerProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-8">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border-4 border-indigo-400">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-800">📼 战斗回放记录</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">×</button>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-xl mb-6 flex gap-4 text-sm font-bold text-indigo-800">
          <div>随机种子: {replay.seed}</div>
          <div>总动作数: {replay.actions.length}</div>
        </div>

        <div className="h-96 overflow-y-auto bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-2">
          {replay.actions.map((action, i) => (
            <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-gray-400 font-mono text-xs w-20">
                {Math.floor(action.time / 1000)}s
              </div>
              <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-bold w-16 text-center">
                波次 {action.wave}
              </div>
              <div className="font-bold text-gray-700 w-32">
                {action.type === 'PLACE_TOWER' && '🏗️ 建造塔'}
                {action.type === 'UPGRADE_TOWER' && '⬆️ 升级塔'}
                {action.type === 'SELECT_REWARD' && '🎁 选择奖励'}
                {action.type === 'START_WAVE' && '🚀 开始波次'}
                {action.type === 'EVENT_TRIGGER' && '⚠️ 触发事件'}
                {action.type === 'DIFFICULTY_CHANGE' && '📈 难度调整'}
              </div>
              <div className="text-gray-600 text-sm flex-1">
                {JSON.stringify(action.payload)}
              </div>
            </div>
          ))}
          {replay.actions.length === 0 && (
            <div className="text-center text-gray-400 py-10">暂无回放数据</div>
          )}
        </div>
      </div>
    </div>
  );
};
