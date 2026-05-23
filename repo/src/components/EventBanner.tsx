import { ActiveEventState } from '../logic/campaignEventSystem';

interface EventBannerProps {
  eventState: ActiveEventState;
}

export const EventBanner = ({ eventState }: EventBannerProps) => {
  if (!eventState.event || eventState.wavesRemaining <= 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl border-2 border-purple-300 flex items-center gap-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <div className="font-bold text-sm">当前事件: {eventState.event.name}</div>
          <div className="text-xs opacity-90">{eventState.event.description}</div>
        </div>
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
          剩余 {eventState.wavesRemaining} 波
        </div>
      </div>
    </div>
  );
};
