import { DifficultyState, CampaignState } from '../types/campaign';

export function updateDifficulty(
  currentDifficulty: DifficultyState,
  wave: number,
  coreHealth: number,
  lastWaveDuration: number,
  enemiesReachedCore: boolean,
  buildStrength: number // simple metric, e.g. number of rewards
): DifficultyState {
  
  let perfScore = 0;
  if (!enemiesReachedCore) perfScore += 1;
  if (coreHealth > 80) perfScore += 1;
  if (lastWaveDuration < 20 + wave * 2) perfScore += 1; // cleared fast
  
  let newHealthMult = currentDifficulty.healthMultiplier + 0.15;
  let newSpeedMult = currentDifficulty.speedMultiplier + 0.05;
  let newCountMult = currentDifficulty.countMultiplier + 0.1;
  
  if (perfScore >= 2) {
    // Doing too well, ramp up
    newHealthMult += 0.1;
    newSpeedMult += 0.05;
    newCountMult += 0.1;
  } else if (perfScore === 0) {
    // Struggling, ease off
    newHealthMult -= 0.05;
    newSpeedMult -= 0.02;
    newCountMult -= 0.05;
  }

  return {
    healthMultiplier: Math.max(1, newHealthMult),
    speedMultiplier: Math.max(1, newSpeedMult),
    countMultiplier: Math.max(1, newCountMult),
    mixedProb: Math.min(0.8, wave * 0.08),
    eliteProb: Math.min(0.5, wave * 0.03),
    rewardCount: 3
  };
}

export const INITIAL_DIFFICULTY: DifficultyState = {
  healthMultiplier: 1,
  speedMultiplier: 1,
  countMultiplier: 1,
  mixedProb: 0,
  eliteProb: 0,
  rewardCount: 3
};
