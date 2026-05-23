import { CampaignEvent } from '../types/campaign';
import { EVENT_TEMPLATES, EventTemplate, getEventTriggerWave } from '../config/eventConfig';

let eventIdCounter = 0;

function weightedRandomSelect(templates: EventTemplate[], wave: number): EventTemplate | null {
  const available = templates.filter(t => t.minWave <= wave);
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const t of available) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }

  return available[available.length - 1];
}

export function shouldTriggerEvent(wave: number): boolean {
  return getEventTriggerWave(wave);
}

export function generateEvent(wave: number): CampaignEvent | null {
  const template = weightedRandomSelect(EVENT_TEMPLATES, wave);
  if (!template) return null;

  return {
    id: `${template.id}_${++eventIdCounter}`,
    name: template.name,
    description: template.description,
    duration: template.duration,
    remainingWaves: template.duration,
    effect: {
      ...template.effect,
      ...(template.effect.type === 'paintReduction' ? { targetColor: ['red', 'blue', 'yellow'][Math.floor(Math.random() * 3)] } : {}),
    },
    startedAtWave: wave,
  };
}

export function updateEventRemaining(event: CampaignEvent): CampaignEvent {
  return {
    ...event,
    remainingWaves: event.remainingWaves - 1,
  };
}

export function isEventExpired(event: CampaignEvent): boolean {
  return event.remainingWaves <= 0;
}

export function getEventBlockedCells(
  _events: CampaignEvent[],
  _gridSize: number,
  rng: () => number = Math.random
): Set<string> {
  const blocked = new Set<string>();
  for (const evt of _events) {
    if (evt.effect.type === 'blockBuilding' && evt.remainingWaves > 0) {
      const count = Math.floor(_gridSize * _gridSize * evt.effect.value);
      for (let i = 0; i < count; i++) {
        const x = Math.floor(rng() * _gridSize);
        const y = Math.floor(rng() * _gridSize);
        blocked.add(`${x},${y}`);
      }
    }
  }
  return blocked;
}

export function getActiveTowerBuff(events: CampaignEvent[]): { buffedTowerId: number | null; buffMultiplier: number } {
  for (const evt of events) {
    if (evt.effect.type === 'towerBuff' && evt.remainingWaves > 0) {
      return { buffedTowerId: null, buffMultiplier: evt.effect.value };
    }
  }
  return { buffedTowerId: null, buffMultiplier: 0 };
}