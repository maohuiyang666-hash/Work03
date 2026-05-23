import type { HistoricalMeta, SaveData } from '../types/campaign';

const ACTIVE_SAVE_KEY = 'canvas-defender-campaign-save';
const META_KEY = 'canvas-defender-campaign-meta';
const SAVE_VERSION = 1;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getSaveVersion = () => SAVE_VERSION;

export const loadCampaignSave = (): SaveData | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(ACTIVE_SAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== SAVE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveCampaign = (saveData: SaveData): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACTIVE_SAVE_KEY, JSON.stringify(saveData));
};

export const clearCampaignSave = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACTIVE_SAVE_KEY);
};

export const loadHistoricalMeta = (): HistoricalMeta => {
  if (!isBrowser()) {
    return {
      highestScore: 0,
      highestWave: 0,
      strongestBuild: [],
      latestReplay: null,
    };
  }

  const raw = window.localStorage.getItem(META_KEY);
  if (!raw) {
    return {
      highestScore: 0,
      highestWave: 0,
      strongestBuild: [],
      latestReplay: null,
    };
  }

  try {
    return JSON.parse(raw) as HistoricalMeta;
  } catch {
    return {
      highestScore: 0,
      highestWave: 0,
      strongestBuild: [],
      latestReplay: null,
    };
  }
};

export const saveHistoricalMeta = (meta: HistoricalMeta): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
};
