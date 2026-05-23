import { describeEventImpact } from '../logic/campaignEventSystem';
import type { ActiveCampaignEvent } from '../types/campaign';

interface EventBannerProps {
  activeEvent: ActiveCampaignEvent | null;
}

export function EventBanner({ activeEvent }: EventBannerProps) {
  if (!activeEvent) return null;

  return (
    <div className="mb-3 rounded-2xl border-2 border-fuchsia-200 bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-3 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-100">随机事件</div>
          <div className="text-xl font-bold">{activeEvent.name}</div>
          <div className="text-sm text-fuchsia-50">{describeEventImpact(activeEvent)}</div>
        </div>
        <div className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold">
          剩余 {activeEvent.remainingWaves} 波
        </div>
      </div>
    </div>
  );
}
