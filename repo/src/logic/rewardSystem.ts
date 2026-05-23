import { Reward } from '../types/reward';
import { REWARD_POOL } from '../config/rewardConfig';

export function getRandomRewards(count: number, currentRewards: Reward[], seed: number): Reward[] {
  // A simple seeded random function to ensure determinism
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  const available = REWARD_POOL.filter(r => !currentRewards.some(cr => cr.id === r.id));
  const result: Reward[] = [];
  
  for (let i = 0; i < count; i++) {
    if (available.length === 0) break;
    const index = Math.floor(random() * available.length);
    result.push(available.splice(index, 1)[0]);
  }
  
  return result;
}
