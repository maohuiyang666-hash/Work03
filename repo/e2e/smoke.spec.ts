import { expect, test } from '@playwright/test'

test('冒烟测试 - 验证游戏基本功能', async ({ page }) => {
  // 1. 打开首页
  await page.goto('/')

  // 2. 确认游戏标题或开始入口存在
  await expect(page.getByText('绘世守护者')).toBeVisible()
  await expect(page.getByTestId('start-game-button')).toBeVisible()

  // 3. 点击开始游戏
  await page.getByTestId('start-game-button').click()

  // 4. 确认游戏主界面出现
  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByTestId('game-status-bar')).toBeVisible()

  // 5. 点击一个塔类型按钮
  await page.getByTestId('tower-button-red').click()
  await expect(page.getByTestId('tower-button-red')).toHaveAttribute('aria-pressed', 'true')

  // 6. 点击一个绘制风格按钮
  await page.getByTestId('style-button-watercolor').click()
  await expect(page.getByTestId('style-button-watercolor')).toHaveAttribute('aria-pressed', 'true')

  // 7. 确认页面没有崩溃 - 通过检查关键元素是否仍可见
  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByTestId('resource-red-value')).toBeVisible()
  await expect(page.getByTestId('resource-blue-value')).toBeVisible()
  await expect(page.getByTestId('resource-yellow-value')).toBeVisible()
})
