import { test, expect } from '@playwright/test';

test('游戏核心流程测试', async ({ page }) => {
  // 打开首页
  await page.goto('/');

  // 验证首页加载成功
  await expect(page.locator('text=🎨 绘世守护者')).toBeVisible();

  // 进入游戏
  await page.click('text=✏️ 开始绘制冒险！');

  // 确认进入游戏页面，存在分数、波次、核心生命值区域
  await expect(page.getByText('🎨 颜料精华')).toBeVisible();
  await expect(page.getByText('波次 1/10')).toBeVisible();
  
  // 选择红色塔 (烈焰塔)
  await page.getByText('烈焰塔').click();

  // 点击可放置格子
  const gridCells = page.locator('.absolute.cursor-pointer');
  await gridCells.first().click();

  // 确认塔出现在页面中
  const towers = page.locator('.tower-brush');
  await expect(towers).toHaveCount(1);

  // 启动波次或等待敌人生成
  await page.getByText(/开始第 1 波/).click();

  // 确认战斗中状态
  await expect(page.getByText(/战斗中\.\.\./)).toBeVisible();

  // 确认分数、波次、核心生命值区域存在
  await expect(page.getByText('波次 1/10')).toBeVisible();
  await expect(page.getByText('❤️')).toBeVisible();
  await expect(page.getByText('⭐')).toBeVisible();
});
