import { SaveData, CampaignState, PlayerBuild, CampaignStats } from '../types/campaign';

const STORAGE_KEY = 'canvas_defender_save';
const CURRENT_VERSION = 1;

export function saveCampaign(campaign: CampaignState, build: PlayerBuild, stats: CampaignStats): boolean {
  try {
    const data: SaveData = {
      version: CURRENT_VERSION,
      savedAt: Date.now(),
      campaign,
      build,
      stats,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadCampaign(): { campaign: CampaignState; build: PlayerBuild; stats: CampaignStats } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: SaveData = JSON.parse(raw);
    if (!data || data.version !== CURRENT_VERSION) return null;

    return {
      campaign: data.campaign,
      build: data.build,
      stats: data.stats,
    };
  } catch {
    return null;
  }
}

export function deleteCampaign(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasCampaignSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getDefaultStats(): CampaignStats {
  return {
    highScore: 0,
    maxWave: 0,
    bestBuild: null,
    totalGames: 0,
    totalEnemiesKilled: 0,
  };
}

export function updateStatsAfterGame(
  oldStats: CampaignStats,
  score: number,
  wave: number,
  enemiesKilled: number,
  buildTags: string[],
  buildStats: { redPower: number; blueControl: number; yellowSpeed: number; economy: number; defense: number }
): CampaignStats {
  return {
    highScore: Math.max(oldStats.highScore, score),
    maxWave: Math.max(oldStats.maxWave, wave),
    bestBuild: score > oldStats.highScore
      ? { tags: buildTags, stats: buildStats }
      : oldStats.bestBuild,
    totalGames: oldStats.totalGames + 1,
    totalEnemiesKilled: oldStats.totalEnemiesKilled + enemiesKilled,
  };
}