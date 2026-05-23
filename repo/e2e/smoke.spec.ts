import { test, expect } from '@playwright/test';

test('smoke test for Canvas Defender', async ({ page }) => {
  // 1. 打开首页
  await page.goto('/');

  // 2. 确认游戏标题或开始入口存在
  const startButton = page.locator('button', { hasText: '开始绘制冒险' });
  await expect(startButton).toBeVisible();

  // 3. 点击开始游戏
  await startButton.click();

  // 4. 确认游戏主界面出现
  await expect(page.getByText('颜料精华')).toBeVisible();

  // 5. 点击一个塔类型按钮
  const redTowerBtn = page.locator('button').filter({ hasText: '烈焰塔' });
  await expect(redTowerBtn).toBeVisible();
  await redTowerBtn.click();

  // 6. 点击一个绘制风格按钮
  const pencilStyleBtn = page.locator('button', { hasText: '铅笔' });
  await expect(pencilStyleBtn).toBeVisible();
  await pencilStyleBtn.click();

  // 7. 确认页面没有崩溃
  await expect(page.getByText('颜料精华')).toBeVisible();
});
