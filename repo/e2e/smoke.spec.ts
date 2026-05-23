import { test, expect } from '@playwright/test';

test('smoke: game loads and basic interaction works', async ({ page }) => {
  // 1. Open homepage
  await page.goto('/');

  // 2. Verify game title exists
  await expect(page.getByText('绘世守护者')).toBeVisible();

  // 3. Click start game button
  await page.getByRole('button', { name: '开始绘制冒险' }).click();

  // 4. Verify game main interface appears (paint resources panel should show)
  await expect(page.getByText('颜料精华')).toBeVisible({ timeout: 10000 });

  // 5. Click a tower type button (red)
  await page.getByText('烈焰塔').click();

  // 6. Click a style button (watercolor)
  await page.getByRole('button', { name: /水彩/ }).click();

  // 7. Verify page didn't crash
  await expect(page.getByText('颜料精华')).toBeVisible();
});
