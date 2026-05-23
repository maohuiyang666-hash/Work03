import { EVENT_POOL } from '../config/eventConfig';
import type { ActiveCampaignEvent, CampaignEventDefinition, EventHistoryEntry } from '../types/campaign';
import type { Position, Tower, TowerType } from '../types/game';

const createBlockedCells = (random: () => number): Position[] => {
  const blocked = new Set<string>();
  while (blocked.size < 5) {
    const x = 1 + Math.floor(random() * 8);
    const y = Math.floor(random() * 10);
    const key = `${x}-${y}`;
    if (y === 4 && x >= 0 && x <= 9) continue;
    blocked.add(key);
  }
  return Array.from(blocked).map((entry) => {
    const [x, y] = entry.split('-').map(Number);
    return { x, y };
  });
};

const createHighlightedTowerIds = (towers: Tower[], random: () => number): number[] => {
  if (!towers.length) return [];
  const shuffled = [...towers].sort(() => random() - 0.5);
  return shuffled.slice(0, Math.min(2, towers.length)).map((tower) => tower.id);
};

export const shouldTriggerEvent = (wave: number): boolean => wave > 1 && wave % 3 === 0;

export const rollCampaignEvent = (wave: number, towers: Tower[], random: () => number): ActiveCampaignEvent => {
  const definition = EVENT_POOL[Math.floor(random() * EVENT_POOL.length)] as CampaignEventDefinition;
  const reducedPaintColor = (['red', 'blue', 'yellow'] as const)[Math.floor(random() * 3)];
  const blockedCells = definition.id === 'mapRift' ? createBlockedCells(random) : [];
  const highlightedTowerIds = definition.id === 'inspirationBurst' ? createHighlightedTowerIds(towers, random) : [];

  return {
    ...definition,
    effect: {
      ...definition.effect,
      reducedPaintColor: definition.id === 'paintDrought' ? reducedPaintColor : definition.effect.reducedPaintColor,
    },
    instanceId: `${definition.id}-${wave}-${Math.floor(random() * 100000)}`,
    startedWave: wave,
    endsAfterWave: wave + definition.durationWaves - 1,
    remainingWaves: definition.durationWaves,
    blockedCells,
    highlightedTowerIds,
  };
};

export const progressCampaignEvent = (
  activeEvent: ActiveCampaignEvent | null,
  completedWave: number,
): { nextEvent: ActiveCampaignEvent | null; endedEvent: EventHistoryEntry | null } => {
  if (!activeEvent) {
    return { nextEvent: null, endedEvent: null };
  }

  const remainingWaves = activeEvent.endsAfterWave - completedWave;

  if (remainingWaves <= 0) {
    return {
      nextEvent: null,
      endedEvent: {
        id: activeEvent.instanceId,
        name: activeEvent.name,
        startedWave: activeEvent.startedWave,
        endedWave: completedWave,
        description: activeEvent.description,
      },
    };
  }

  return {
    nextEvent: {
      ...activeEvent,
      remainingWaves,
    },
    endedEvent: null,
  };
};

export const eventBlocksPlacement = (x: number, y: number, activeEvent: ActiveCampaignEvent | null): boolean => {
  if (!activeEvent || activeEvent.id !== 'mapRift') return false;
  return activeEvent.blockedCells.some((cell) => cell.x === x && cell.y === y);
};

export const getProjectileSpeedMultiplierFromEvent = (activeEvent: ActiveCampaignEvent | null): number => {
  if (!activeEvent) return 1;
  return activeEvent.effect.projectileSpeedMultiplier ?? 1;
};

export const getEnemyHealthMultiplierFromEvent = (activeEvent: ActiveCampaignEvent | null): number => {
  if (!activeEvent) return 1;
  return activeEvent.effect.enemyHealthMultiplier ?? 1;
};

export const getPaintRewardMultiplierFromEvent = (color: TowerType, activeEvent: ActiveCampaignEvent | null): number => {
  if (!activeEvent || activeEvent.id !== 'paintDrought') return 1;
  if (activeEvent.effect.reducedPaintColor !== color) return 1;
  return activeEvent.effect.reducedPaintMultiplier ?? 1;
};

export const getTowerEventBuff = (towerId: number, activeEvent: ActiveCampaignEvent | null): { damageMultiplier: number; rangeBonus: number } => {
  if (!activeEvent || activeEvent.id !== 'inspirationBurst') {
    return { damageMultiplier: 1, rangeBonus: 0 };
  }

  if (!activeEvent.highlightedTowerIds.includes(towerId)) {
    return { damageMultiplier: 1, rangeBonus: 0 };
  }

  return {
    damageMultiplier: activeEvent.effect.inspirationDamageMultiplier ?? 1,
    rangeBonus: activeEvent.effect.inspirationRangeBonus ?? 0,
  };
};

export const describeEventImpact = (activeEvent: ActiveCampaignEvent): string => {
  if (activeEvent.id === 'paintDrought') {
    const colorName: Record<TowerType, string> = { red: '红色', blue: '蓝色', yellow: '黄色' };
    return `${activeEvent.name}：${colorName[activeEvent.effect.reducedPaintColor as TowerType]}颜料收益下降。`;
  }

  return activeEvent.description;
};
