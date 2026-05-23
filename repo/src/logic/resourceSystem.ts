import type { Enemy } from '../types/entities';
import type { PaintColor, PaintEssence } from '../types/game';

export const canAfford = (paint: PaintEssence, cost: PaintEssence): boolean => (
  paint.red >= cost.red && paint.blue >= cost.blue && paint.yellow >= cost.yellow
);

export const spendPaint = (paint: PaintEssence, cost: PaintEssence): PaintEssence => ({
  red: paint.red - cost.red,
  blue: paint.blue - cost.blue,
  yellow: paint.yellow - cost.yellow,
});

export const gainPaint = (paint: PaintEssence, reward: PaintEssence): PaintEssence => ({
  red: paint.red + reward.red,
  blue: paint.blue + reward.blue,
  yellow: paint.yellow + reward.yellow,
});

export interface EnemyDefeatReward {
  paintGain: number;
  scoreGain: number;
  colorType: PaintColor;
}

export const calculateEnemyDefeatReward = (
  enemy: Enemy,
  randomValue: number,
): EnemyDefeatReward => {
  const palette: PaintColor[] = ['red', 'blue', 'yellow'];
  const colorType = enemy.colorType === 'mixed'
    ? palette[Math.floor(randomValue * palette.length) % palette.length]
    : enemy.colorType;

  return {
    colorType,
    paintGain: 8 + Math.floor(enemy.maxHealth / 15),
    scoreGain: 15 + Math.floor(enemy.maxHealth / 10),
  };
};
