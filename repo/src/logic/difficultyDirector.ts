import { DifficultyDirector, CampaignState, DifficultySnapshot } from '../types/campaign';
import { BuildStats } from '../types/reward';

export class DifficultyDirectorSystem {
  private static readonly MIN_DIFFICULTY = 0.5;
  private static readonly MAX_DIFFICULTY = 3.0;
  private static readonly ADJUSTMENT_SMOOTHING = 0.3;

  static initialize(): DifficultyDirector {
    return {
      currentDifficulty: 1.0,
      enemyMultiplier: 1.0,
      healthMultiplier: 1.0,
      speedMultiplier: 1.0,
      mixedEnemyChance: 0.1,
      eliteEnemyChance: 0.02,
      rewardMultiplier: 1.0,
      history: [{ wave: 0, difficulty: 1.0, timestamp: Date.now() }]
    };
  }

  static adjustDifficulty(
    director: DifficultyDirector,
    campaignState: CampaignState,
    buildStats: BuildStats
  ): DifficultyDirector {
    const difficultyFactors = this.calculateDifficultyFactors(campaignState, buildStats);
    const targetDifficulty = this.calculateTargetDifficulty(difficultyFactors);

    const newDifficulty = this.smoothAdjustment(
      director.currentDifficulty,
      targetDifficulty
    );

    const newDirector = {
      ...director,
      currentDifficulty: newDifficulty,
      enemyMultiplier: Math.pow(newDifficulty, 0.8),
      healthMultiplier: Math.pow(newDifficulty, 0.6),
      speedMultiplier: 1 + (newDifficulty - 1) * 0.3,
      mixedEnemyChance: Math.min(0.4, 0.1 + (newDifficulty - 1) * 0.15),
      eliteEnemyChance: Math.min(0.15, 0.02 + (newDifficulty - 1) * 0.06),
      rewardMultiplier: 1 + (newDifficulty - 1) * 0.2,
      history: [
        ...director.history,
        {
          wave: campaignState.wave,
          difficulty: newDifficulty,
          timestamp: Date.now()
        }
      ]
    };

    return newDirector;
  }

  private static calculateDifficultyFactors(
    campaignState: CampaignState,
    buildStats: BuildStats
  ): { [key: string]: number } {
    const healthFactor = Math.max(0, 1 - campaignState.coreHealth / 100);
    const waveFactor = Math.min(1, campaignState.wave / 20);
    const leakerFactor = campaignState.lastWaveHadLeaker ? 0.3 : 0;
    const buildPower = Object.values(buildStats).reduce((a, b) => a + b, 0) / 5;
    const buildFactor = Math.min(0.5, buildPower * 0.3);
    const killFactor = Math.min(0.3, campaignState.enemiesKilled / 50);

    return {
      healthFactor,
      waveFactor,
      leakerFactor,
      buildFactor,
      killFactor
    };
  }

  private static calculateTargetDifficulty(factors: { [key: string]: number }): number {
    const baseDifficulty = 1.0;
    const difficultyChange =
      factors.healthFactor * 0.3 +
      factors.waveFactor * 0.4 +
      factors.leakerFactor * 0.2 +
      factors.buildFactor * 0.5 +
      factors.killFactor * 0.2;

    return Math.min(
      this.MAX_DIFFICULTY,
      Math.max(this.MIN_DIFFICULTY, baseDifficulty + difficultyChange)
    );
  }

  private static smoothAdjustment(current: number, target: number): number {
    return current + (target - current) * this.ADJUSTMENT_SMOOTHING;
  }

  static getEnemyCount(director: DifficultyDirector, wave: number): number {
    const baseCount = 5 + wave * 2;
    return Math.floor(baseCount * director.enemyMultiplier);
  }

  static getEnemyHealth(director: DifficultyDirector, baseHealth: number): number {
    return Math.floor(baseHealth * director.healthMultiplier);
  }

  static getEnemySpeed(director: DifficultyDirector, baseSpeed: number): number {
    return baseSpeed * director.speedMultiplier;
  }

  static isMixedEnemy(director: DifficultyDirector): boolean {
    return Math.random() < director.mixedEnemyChance;
  }

  static isEliteEnemy(director: DifficultyDirector): boolean {
    return Math.random() < director.eliteEnemyChance;
  }

  static getPaintReward(director: DifficultyDirector, baseReward: number): number {
    return Math.floor(baseReward * director.rewardMultiplier);
  }
}
