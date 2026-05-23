import { test, expect } from '@playwright/test'

test.describe('Canvas Defender E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('打开首页', async ({ page }) => {
    // 验证标题
    await expect(page.locator('text=绘世守护者')).toBeVisible()
    // 验证开始按钮存在
    await expect(page.locator('text=开始绘制冒险')).toBeVisible()
  })

  test('进入游戏', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 验证游戏 UI 出现
    await expect(page.locator('text=波次')).toBeVisible()
    await expect(page.locator('text=颜料精华')).toBeVisible()
  })

  test('选择红色塔', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    await page.click('text=烈焰塔')
    // 验证红色塔被选中
    const redTowerButton = page.locator('button:has-text("烈焰塔")')
    await expect(redTowerButton).toHaveClass(/border-gray-800/)
  })

  test('点击可放置格子', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 选择红色塔
    await page.click('text=烈焰塔')
    // 点击一个可放置的格子 (0,0 位置)
    const cell = page.locator('.absolute.cursor-pointer').first()
    await cell.click()
  })

  test('确认塔出现在页面中', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    await page.click('text=烈焰塔')
    const cell = page.locator('.absolute.cursor-pointer').first()
    await cell.click()
    // 验证塔图标出现 (tower-brush 类)
    await expect(page.locator('.tower-brush').first()).toBeVisible()
  })

  test('启动波次', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 点击开始波次按钮
    await page.click('text=开始第 1 波')
    // 验证战斗中状态
    await expect(page.locator('text=战斗中')).toBeVisible()
  })

  test('确认分数、波次、核心生命值区域存在', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 验证顶部状态栏
    await expect(page.locator('text=波次 1/10')).toBeVisible()
    await expect(page.locator('text=💎')).toBeVisible()
    await expect(page.locator('text=⭐')).toBeVisible()
  })

  test('选择绘制风格', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 点击水彩风格
    await page.click('text=水彩')
    const watercolorButton = page.locator('button:has-text("水彩")')
    await expect(watercolorButton).toHaveClass(/bg-amber-400/)
  })

  test('跳过波次', async ({ page }) => {
    await page.click('text=开始绘制冒险')
    // 点击跳过按钮
    const skipButton = page.locator('text=跳过')
    if (await skipButton.isVisible()) {
      await skipButton.click()
    }
    // 验证波次增加
    await expect(page.locator('text=波次 2/10')).toBeVisible()
  })
})
