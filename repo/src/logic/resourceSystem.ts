import type { PaintEssence } from '../types/game';

/**
 * 应用颜料精华增减
 */
export function applyPaintDelta(
  current: PaintEssence,
  delta: Partial<PaintEssence>,
): PaintEssence {
  return {
    red: Math.max(0, current.red + (delta.red ?? 0)),
    blue: Math.max(0, current.blue + (delta.blue ?? 0)),
    yellow: Math.max(0, current.yellow + (delta.yellow ?? 0)),
  };
}

/**
 * 检查是否有足够的颜料来支付消耗
 */
export function canAfford(
  current: PaintEssence,
  cost: PaintEssence,
): boolean {
  return (
    current.red >= cost.red &&
    current.blue >= cost.blue &&
    current.yellow >= cost.yellow
  );
}

/**
 * 扣除颜料消耗
 */
export function deductPaint(
  current: PaintEssence,
  cost: PaintEssence,
): PaintEssence {
  return {
    red: current.red - cost.red,
    blue: current.blue - cost.blue,
    yellow: current.yellow - cost.yellow,
  };
}