import { SaveData, CampaignState, CampaignStats } from '../types/campaign';
import { PlayerBuild } from '../types/reward';
import { PaintEssence } from '../App';

const SAVE_KEY = 'canvas-defender-save';
const STATS_KEY = 'canvas-defender-stats';
const SAVE_VERSION = 1;

export class SaveSystem {
  static saveGame(
    wave: number,
    coreHealth: number,
    paint: PaintEssence,
    score: number,
    enemiesKilled: number,
    towersCount: number,
    build: PlayerBuild,
    difficulty: any,
    replayActions: any[]
  ): void {
    try {
      const campaign: CampaignState = {
        wave,
        coreHealth,
        paint,
        score,
        enemiesKilled,
        towersCount,
        lastWaveDuration: 0,
        lastWaveHadLeaker: false
      };

      const saveData: SaveData = {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        campaign,
        build,
        difficulty,
        stats: this.loadStats(),
        replayActions
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  static loadGame(): SaveData | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return null;

      const saveData: SaveData = JSON.parse(saved);

      if (saveData.version !== SAVE_VERSION) {
        console.warn('Save data version mismatch, migrating...');
        return this.migrateSave(saveData);
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  static clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static loadStats(): CampaignStats {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (!saved) {
        return {
          highestWave: 0,
          highestScore: 0,
          totalKills: 0,
          totalGames: 0,
          bestBuild: null
        };
      }
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load stats:', error);
      return {
        highestWave: 0,
        highestScore: 0,
        totalKills: 0,
        totalGames: 0,
        bestBuild: null
      };
    }
  }

  static updateStats(
    finalWave: number,
    finalScore: number,
    totalKills: number,
    finalBuild: PlayerBuild
  ): void {
    try {
      const stats = this.loadStats();
      const newStats: CampaignStats = {
        highestWave: Math.max(stats.highestWave, finalWave),
        highestScore: Math.max(stats.highestScore, finalScore),
        totalKills: stats.totalKills + totalKills,
        totalGames: stats.totalGames + 1,
        bestBuild: finalScore > stats.highestScore ? finalBuild : stats.bestBuild
      };

      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  private static migrateSave(saveData: SaveData): SaveData | null {
    if (saveData.version < SAVE_VERSION) {
      return {
        ...saveData,
        version: SAVE_VERSION
      };
    }
    return saveData;
  }
}
