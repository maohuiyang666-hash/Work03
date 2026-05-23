import type { Enemy, ColorType } from '../types/entities';
import { CELL_SIZE, PATH } from '../config/gameConfig';
import { ENEMY_BASE_HEALTH, ENEMY_HEALTH_PER_WAVE, ENEMY_BASE_SPEED, ENEMY_SPEED_PER_WAVE, ENEMY_MAX_SPEED_BONUS, ENEMY_COLORS } from '../config/enemyConfig';

export const spawnEnemy = (wave: number, idRef: { current: number }): Enemy => {
  const colorTypes: ColorType[] = ['red', 'blue', 'yellow'];
  if (wave >= 3) colorTypes.push('mixed');
  const type = colorTypes[Math.floor(Math.random() * colorTypes.length)];

  let color: string;
  if (type === 'mixed') {
    const mixedColors = ['#8e44ad', '#16a085', '#d35400'];
    color = mixedColors[Math.floor(Math.random() * mixedColors.length)];
  } else {
    color = ENEMY_COLORS[type];
  }

  return {
    id: idRef.current++,
    x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
    y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
    health: ENEMY_BASE_HEALTH + wave * ENEMY_HEALTH_PER_WAVE,
    maxHealth: ENEMY_BASE_HEALTH + wave * ENEMY_HEALTH_PER_WAVE,
    speed: ENEMY_BASE_SPEED + Math.min(wave * ENEMY_SPEED_PER_WAVE, ENEMY_MAX_SPEED_BONUS),
    color,
    colorType: type,
    pathIndex: 0,
  };
};

export const moveEnemies = (enemies: Enemy[], delta: number): { enemies: Enemy[]; damage: number } => {
  const updatedEnemies: Enemy[] = [];
  let damage = 0;

  enemies.forEach(enemy => {
    if (enemy.pathIndex >= PATH.length - 1) {
      damage += 10;
      return;
    }

    const target = {
      x: PATH[enemy.pathIndex + 1].x * CELL_SIZE + CELL_SIZE / 2,
      y: PATH[enemy.pathIndex + 1].y * CELL_SIZE + CELL_SIZE / 2,
    };

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let newEnemy = { ...enemy };
    if (dist < 5) {
      newEnemy.pathIndex++;
    } else {
      newEnemy.x += (dx / dist) * enemy.speed * delta;
      newEnemy.y += (dy / dist) * enemy.speed * delta;
    }

    updatedEnemies.push(newEnemy);
  });

  return { enemies: updatedEnemies, damage };
};
