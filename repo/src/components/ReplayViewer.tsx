import { useState, useEffect, useRef } from 'react';
import { ReplayData, PlaybackSpeed } from '../types/replay';

interface Props {
  replay: ReplayData;
  onClose: () => void;
}

export default function ReplayViewer({ replay, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [selectedWave, setSelectedWave] = useState(1);
  const timerRef = useRef<number | null>(null);

  const maxWave = Math.max(1, ...replay.actions.map(a => a.wave), 1);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && currentIndex < replay.actions.length) {
      timerRef.current = window.setInterval(() => {
        setCurrentIndex(i => {
          if (i >= replay.actions.length - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, currentIndex, replay.actions.length]);

  const jumpToWave = (wave: number) => {
    setSelectedWave(wave);
    const idx = replay.actions.findIndex(a => a.wave === wave);
    if (idx >= 0) setCurrentIndex(idx);
  };

  const togglePlay = () => setIsPlaying(p => !p);
  const stepForward = () => setCurrentIndex(i => Math.min(i + 1, replay.actions.length - 1));
  const stepBack = () => setCurrentIndex(i => Math.max(0, i - 1));

  const actionTypeLabel = (type: string): string => {
    switch (type) {
      case 'PLACE_TOWER': return '放置防御塔';
      case 'UPGRADE_TOWER': return '升级防御塔';
      case 'SELECT_REWARD': return '选择奖励';
      case 'START_WAVE': return '开始波次';
      case 'END_WAVE': return '波次结束';
      case 'TRIGGER_EVENT': return '触发事件';
      case 'DIFFICULTY_CHANGE': return '难度调整';
      case 'GAME_START': return '游戏开始';
      case 'GAME_END': return '游戏结束';
      default: return type;
    }
  };

  const currentAction = replay.actions[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-amber-400 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-800" style={{ fontFamily: 'cursive' }}>
            ▶️ 战斗回放
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 mb-4">
          <div className="flex gap-4 text-sm">
            <span>⭐ {replay.finalStats.score}分</span>
            <span>🌊 第{replay.finalStats.wave}波</span>
            <span>💀 {replay.finalStats.enemiesKilled}击杀</span>
            <span>❤️ {replay.finalStats.coreHealth}生命</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {replay.finalStats.buildTags.map(t => (
              <span key={t} className="px-1.5 py-0.5 text-xs bg-amber-200 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4 items-center flex-wrap">
          <button onClick={togglePlay} className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600">
            {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
          </button>
          <button onClick={stepBack} className="px-3 py-2 bg-gray-200 rounded-full">⏮</button>
          <button onClick={stepForward} className="px-3 py-2 bg-gray-200 rounded-full">⏭</button>

          {([1, 2, 4, 8] as PlaybackSpeed[]).map(s => (
            <button key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 rounded-full text-sm font-bold ${speed === s ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            >
              {s}x
            </button>
          ))}

          <select
            value={selectedWave}
            onChange={e => jumpToWave(Number(e.target.value))}
            className="px-3 py-2 rounded-full border border-amber-300 text-sm"
          >
            {Array.from({ length: maxWave }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>第{w}波</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-xl p-3 bg-gray-50 min-h-[300px]">
          <div className="text-xs text-gray-400 mb-2">
            步骤 {currentIndex + 1}/{replay.actions.length}
          </div>

          {currentAction && (
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-amber-400 mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-amber-700">{actionTypeLabel(currentAction.type)}</span>
                <span className="text-gray-400">波{currentAction.wave}</span>
              </div>
              <div className="text-xs text-gray-500">
                时间: {(currentAction.time / 1000).toFixed(1)}s
              </div>
              {currentAction.payload && (
                <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                  {JSON.stringify(currentAction.payload, null, 1)}
                </pre>
              )}
            </div>
          )}

          <div className="space-y-1">
            {replay.actions.map((a, i) => (
              <div
                key={i}
                className={`text-xs p-1.5 rounded cursor-pointer ${
                  i === currentIndex ? 'bg-amber-100 font-bold' :
                  i < currentIndex ? 'opacity-50' : 'hover:bg-gray-100'
                }`}
                onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
              >
                <span className="text-gray-400">[{a.wave}]</span>{' '}
                {actionTypeLabel(a.type)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}