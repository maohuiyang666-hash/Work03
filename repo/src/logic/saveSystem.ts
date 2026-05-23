import { SaveData } from '../types/campaign';

const SAVE_KEY = 'canvas_defender_save_v1';

export function saveCampaign(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save campaign:', err);
  }
}

export function loadCampaign(): SaveData | null {
  try {
    const str = localStorage.getItem(SAVE_KEY);
    if (str) return JSON.parse(str) as SaveData;
  } catch (err) {
    console.error('Failed to load campaign:', err);
  }
  return null;
}

export function clearCampaign() {
  localStorage.removeItem(SAVE_KEY);
}
