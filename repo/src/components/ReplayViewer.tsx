import React, { useState, useEffect, useRef } from 'react';
import { ReplayData } from '../types/replay';
import { RARITY_COLORS, RARITY_BG } from '../config/rewardConfig';

interface ReplayViewerProps {
  replayData: ReplayData;
  onClose: () => void;
}

const ReplayViewer: React.FC<ReplayViewerProps> = ({ replayData, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentWave, setCurrentWave] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentActions = () => {
    return replayData.actions.filter(a => a.time <= currentTime);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const seekToWave = (wave: number) => {
    const waveAction = replayData.actions.find(a => a.type === 'START_WAVE' && a.wave === wave);
    if (waveAction) {
      setCurrentTime(waveAction.time);
      setCurrentWave(waveAction.wave);
    }
  };

  const seekToAction = (index: number) => {
    if (index >= 0 && index < replayData.actions.length) {
      setSelectedActionIndex(index);
      setCurrentTime(replayData.actions[index].time);
      setCurrentWave(replayData.actions[index].wave);
    }
  };

  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        const now = Date.now();
        const delta = (now - lastUpdateRef.current) * speed;
        lastUpdateRef.current = now;

        setCurrentTime(prev => {
          const newTime = prev + delta;
          if (newTime >= replayData.duration) {
            setIsPlaying(false);
            return replayData.duration;
          }
          return newTime;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      lastUpdateRef.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, replayData.duration]);

  useEffect(() => {
    const currentAction = replayData.actions.find(a => a.time > currentTime);
    if (currentAction) {
      setCurrentWave(currentAction.wave);
    }
  }, [currentTime, replayData.actions]);

  const currentActions = getCurrentActions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'cursive' }}>
            🎬 战役回放
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl">
          <div className="text-center">
            <div className="text-sm text-gray-600">最终波次</div>
            <div className="text-2xl font-bold text-amber-600">{replayData.finalWave}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">最终分数</div>
            <div className="text-2xl font-bold text-purple-600">{replayData.finalScore}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">总时长</div>
            <div className="text-2xl font-bold text-blue-600">{formatTime(replayData.duration)}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </button>
            <div className="flex gap-1">
              {[0.5, 1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${speed === s ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="text-lg font-mono text-gray-700 ml-auto">
              {formatTime(currentTime)} / {formatTime(replayData.duration)}
            </div>
          </div>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
              style={{ width: `${(currentTime / replayData.duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">📜 操作记录</h3>
            <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
              {replayData.actions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => seekToAction(index)}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${selectedActionIndex === index ? 'bg-amber-100 border-2 border-amber-400' : 'hover:bg-gray-100'} ${action.time <= currentTime ? '' : 'opacity-50'}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {action.type === 'PLACE_TOWER' && '🏗️ 放置塔'}
                      {action.type === 'UPGRADE_TOWER' && '⬆️ 升级塔'}
                      {action.type === 'SELECT_REWARD' && '🎁 选择奖励'}
                      {action.type === 'START_WAVE' && '🌊 开始波次'}
                      {action.type === 'EVENT_TRIGGER' && '🎲 事件触发'}
                      {action.type === 'DIFFICULTY_CHANGE' && '📊 难度变化'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      波次 {action.wave} · {formatTime(action.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">🎁 获得的奖励</h3>
            <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
              {replayData.selectedRewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className={`p-3 rounded-lg ${RARITY_BG[reward.rarity]} ${RARITY_COLORS[reward.rarity]}`}
                >
                  <div className="font-bold">{reward.name}</div>
                  <div className="text-sm opacity-70">{reward.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {replayData.difficultyHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">📈 难度变化</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex flex-wrap gap-2">
                {replayData.difficultyHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => seekToWave(item.wave)}
                    className="px-3 py-1 bg-white rounded-lg border-2 border-gray-200 hover:border-amber-400 transition-all text-sm"
                  >
                    波次 {item.wave}: {item.difficulty.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {replayData.eventHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">🎲 事件记录</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex flex-wrap gap-2">
                {replayData.eventHistory.map((item, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg text-sm font-medium"
                  >
                    波次 {item.wave}: {item.event}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplayViewer;
