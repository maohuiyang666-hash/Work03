import React from 'react';
import { CampaignEvent } from '../types/campaign';
import { EVENT_COLORS, EVENT_ICONS } from '../config/eventConfig';

interface EventBannerProps {
  events: CampaignEvent[];
}

const EventBanner: React.FC<EventBannerProps> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2">
      {events.map(event => {
        const remaining = Math.max(0, event.duration - (Date.now() - event.startTime) / 1000);
        return (
          <div
            key={event.id}
            className={`px-6 py-3 rounded-2xl shadow-xl bg-gradient-to-r ${EVENT_COLORS[event.type]} text-white flex items-center gap-3 animate-pulse`}
          >
            <span className="text-2xl">{EVENT_ICONS[event.type]}</span>
            <div>
              <div className="font-bold">{event.name}</div>
              <div className="text-sm opacity-80">
                {event.description} · {Math.ceil(remaining)}秒
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventBanner;
