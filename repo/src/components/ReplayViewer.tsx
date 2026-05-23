import { useEffect, useMemo, useState } from 'react';
import type { ReplayData } from '../types/replay';

interface ReplayViewerProps {
  replay: ReplayData | null;
}

const SPEED_OPTIONS = [1, 2, 4];

export function ReplayViewer({ replay }: ReplayViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cursor, setCursor] = useState(0);
  const [selectedWave, setSelectedWave] = useState<number | 'all'>('all');

  const filteredActions = useMemo(() => {
    if (!replay) return [];
    return replay.actions.filter((action) => selectedWave === 'all' || action.wave === selectedWave);
  }, [replay, selectedWave]);

  const availableWaves = useMemo(() => {
    if (!replay) return [] as number[];
    return Array.from(new Set(replay.actions.map((action) => action.wave))).sort((a, b) => a - b);
  }, [replay]);

  useEffect(() => {
    setCursor(0);
    setIsPlaying(false);
  }, [selectedWave, replay?.actions.length]);

  useEffect(() => {
    if (!isPlaying || filteredActions.length === 0) return;
    if (cursor >= filteredActions.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCursor((value) => Math.min(value + 1, filteredActions.length - 1));
    }, 900 / speed);

    return () => window.clearTimeout(timer);
  }, [cursor, filteredActions.length, isPlaying, speed]);

  if (!replay) {
    return (
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-lg">
        <h3 className="text-xl font-bold text-amber-800 mb-2">回放记录</h3>
        <p className="text-sm text-amber-600">当前没有可播放的战役回放。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-amber-800">战役回放</h3>
          <p className="text-sm text-amber-600">种子 {replay.seed} · 动作 {replay.actions.length} 条</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsPlaying((value) => !value)}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow"
          >
            {isPlaying ? '暂停' : '播放'}
          </button>
          {SPEED_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => setSpeed(value)}
              className={`rounded-full px-3 py-2 text-sm font-bold ${speed === value ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'}`}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setSelectedWave('all')}
          className={`rounded-full px-3 py-1 text-xs font-bold ${selectedWave === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          全部波次
        </button>
        {availableWaves.map((wave) => (
          <button
            key={wave}
            onClick={() => setSelectedWave(wave)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${selectedWave === wave ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            第 {wave} 波
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={Math.max(filteredActions.length - 1, 0)}
          value={cursor}
          onChange={(event) => setCursor(Number(event.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      <div className="space-y-2 max-h-80 overflow-auto">
        {filteredActions.length ? (
          filteredActions.map((action, index) => (
            <div
              key={`${action.time}-${index}`}
              className={`rounded-2xl border px-4 py-3 text-sm ${index <= cursor ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-bold text-amber-800">{action.type}</span>
                <span className="text-xs text-slate-500">第 {action.wave} 波</span>
              </div>
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">{JSON.stringify(action.payload, null, 2)}</pre>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">没有符合当前筛选条件的回放动作。</div>
        )}
      </div>
    </div>
  );
}
