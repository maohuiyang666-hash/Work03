import { test, expect } from '@playwright/test';

test('smoke - game launches and basic interaction works', async ({ page }) => {
  // 1. 打开首页
  await page.goto('/');

  // 2. 确认游戏标题或开始入口存在
  await expect(page.locator('h1')).toContainText('绘世守护者');
  await expect(page.getByText('Canvas Defender')).toBeVisible();

  // 3. 点击开始游戏
  await page.getByText('开始绘制冒险').click();

  // 4. 确认游戏主界面出现
  await expect(page.getByText('颜料精华')).toBeVisible();
  await expect(page.getByText('绘制防御塔')).toBeVisible();

  // 5. 点击一个塔类型按钮
  await page.getByText('烈焰塔').click();

  // 6. 点击一个绘制风格按钮
  await page.getByText('铅笔').click();

  // 7. 确认页面没有崩溃
  await expect(page.getByText('笔触风格')).toBeVisible();
  await expect(page.getByText('颜料精华')).toBeVisible();
});