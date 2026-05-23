import { Enemy, EnemyColorType } from '../types';
import { PATH, CELL_SIZE, ENEMY_COLORS } from '../config';

export const spawnEnemy = (id: number, wave: number): Enemy => {
  const colorTypes: Array<EnemyColorType> = ['red', 'blue', 'yellow'];
  if (wave >= 3) colorTypes.push('mixed');
  const type = colorTypes[Math.floor(Math.random() * colorTypes.length)];
  
  const colors = ENEMY_COLORS;
  let colorValue = colors[type];
  if (Array.isArray(colorValue)) {
    colorValue = colorValue[Math.floor(Math.random() * colorValue.length)];
  }

  return {
    id,
    x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
    y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
    health: 40 + wave * 15,
    maxHealth: 40 + wave * 15,
    speed: 35 + Math.min(wave * 3, 25),
    color: colorValue as string,
    colorType: type,
    pathIndex: 0,
  };
};

export const moveEnemies = (
  enemies: Enemy[],
  delta: number
): { updatedEnemies: Enemy[]; damageToCore: number } => {
  const updatedEnemies: Enemy[] = [];
  let damageToCore = 0;

  enemies.forEach(enemy => {
    // Note: copy enemy to avoid mutating react state directly
    const e = { ...enemy };
    if (e.pathIndex >= PATH.length - 1) {
      damageToCore += 10;
      return;
    }

    const target = {
      x: PATH[e.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[e.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
    };

    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      e.pathIndex++;
    } else {
      e.x += (dx / dist) * e.speed * delta;
      e.y += (dy / dist) * e.speed * delta;
    }

    updatedEnemies.push(e);
  });

  return { updatedEnemies, damageToCore };
};
