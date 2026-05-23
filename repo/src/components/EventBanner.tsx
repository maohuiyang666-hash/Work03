import { useState, useEffect } from 'react';
import { CampaignEvent } from '../types/campaign';

interface Props {
  events: CampaignEvent[];
}

export default function EventBanner({ events }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [events.length]);

  const activeEvents = events.filter(e => !e.remainingWaves || e.remainingWaves > 0);

  if (activeEvents.length === 0 || !visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 space-y-1">
      {activeEvents.map(event => (
        <div key={event.id}
          className={`px-6 py-3 rounded-2xl shadow-2xl border-2 text-center animate-pulse
            ${event.effect.type === 'projectileSpeed' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-300 text-white' :
              event.effect.type === 'enemyHealth' ? 'bg-gradient-to-r from-red-700 to-red-900 border-red-500 text-white' :
              event.effect.type === 'blockBuilding' ? 'bg-gradient-to-r from-gray-600 to-gray-800 border-gray-400 text-white' :
              event.effect.type === 'towerBuff' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300 text-yellow-900' :
              'bg-gradient-to-r from-orange-400 to-red-500 border-orange-300 text-white'
            }`}
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">
              {event.effect.type === 'projectileSpeed' ? '🌪️' :
               event.effect.type === 'enemyHealth' ? '💀' :
               event.effect.type === 'blockBuilding' ? '🕳️' :
               event.effect.type === 'towerBuff' ? '✨' : '⚠️'}
            </span>
            <div>
              <div className="font-bold text-sm">{event.name}</div>
              <div className="text-xs opacity-90">{event.description}</div>
              <div className="text-xs mt-0.5 opacity-75">剩余 {event.remainingWaves} 波</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}