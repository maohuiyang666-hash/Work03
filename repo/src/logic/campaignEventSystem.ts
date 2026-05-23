import { CampaignEvent, EVENT_POOL } from '../config/eventConfig';

export interface ActiveEventState {
  event: CampaignEvent | null;
  wavesRemaining: number;
}

export function rollForEvent(wave: number, seed: number): CampaignEvent | null {
  // Trigger event roughly every 3-4 waves
  if (wave > 1 && wave % 3 === 0) {
    let currentSeed = seed + wave * 12345;
    const random = () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
    
    // 60% chance to actually trigger
    if (random() > 0.4) {
      const index = Math.floor(random() * EVENT_POOL.length);
      return EVENT_POOL[index];
    }
  }
  return null;
}

export function updateEventState(currentState: ActiveEventState, wave: number, seed: number): ActiveEventState {
  if (currentState.event && currentState.wavesRemaining > 1) {
    return {
      event: currentState.event,
      wavesRemaining: currentState.wavesRemaining - 1
    };
  }
  
  const newEvent = rollForEvent(wave, seed);
  if (newEvent) {
    return {
      event: newEvent,
      wavesRemaining: newEvent.durationWaves
    };
  }
  
  return { event: null, wavesRemaining: 0 };
}
