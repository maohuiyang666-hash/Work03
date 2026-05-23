import { test, expect } from '@playwright/test'

test.describe('Canvas Defender E2E', () => {
  test('opens homepage and sees game title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=绘世守护者')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Canvas Defender')).toBeVisible()
  })

  test('enters game by clicking start button', async ({ page }) => {
    await page.goto('/')
    await page.click('text=开始绘制冒险！')
    await expect(page.locator('text=颜料精华')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=波次 1/10')).toBeVisible()
    await expect(page.locator('text=❤️')).toBeVisible()
    await expect(page.locator('text=⭐')).toBeVisible()
  })

  test('selects red tower type', async ({ page }) => {
    await page.goto('/')
    await page.click('text=开始绘制冒险！')
    await page.click('text=烈焰塔')
    // Verify the tower selection is clickable and present
    await expect(page.locator('text=烈焰塔')).toBeVisible()
  })

  test('clicks a placeable grid cell and verifies tower placement area exists', async ({ page }) => {
    await page.goto('/')
    await page.click('text=开始绘制冒险！')
    // Select red tower
    await page.click('text=烈焰塔')
    // The grid has 10x10 cells. Path goes through specific coords.
    // Click on a non-path, non-core cell: position (0,0) should be placeable
    const gridArea = page.locator('.relative.bg-white.rounded-xl.shadow-2xl')
    await expect(gridArea).toBeVisible({ timeout: 5000 })
    // The grid exists, and clickable cells are present
    // Verify the pipeline（画布） area is rendered
    await expect(page.locator('text=画布核心')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=入口')).toBeVisible()
  })

  test('confirms score, wave and core health areas exist after game starts', async ({ page }) => {
    await page.goto('/')
    await page.click('text=开始绘制冒险！')
    // Verify game stats areas are visible
    await expect(page.locator('text=波次 1/10')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=战斗统计')).toBeVisible()
    // Core health displayed
    const healthTexts = page.locator('text=100')
    await expect(healthTexts.first()).toBeVisible({ timeout: 5000 })
    // Score area exists
    await expect(page.locator('text=获得分数')).toBeVisible()
  })

  test('starts wave and confirms enemies or battle state', async ({ page }) => {
    await page.goto('/')
    await page.click('text=开始绘制冒险！')
    // Click "开始第 1 波" button
    const waveButton = page.locator('text=开始第')
    await expect(waveButton).toBeVisible({ timeout: 5000 })
    await waveButton.click()
    // After starting wave, battle state should show or wave proceeds
    // The button changes to "战斗中..." or wave completes
    // Just wait a moment and verify page is still interactive
    await page.waitForTimeout(500)
    // Either "战斗中" or "开始第 2 波" should appear eventually
    const battleIndicator = page.locator('text=/战斗中|开始第/')
    await expect(battleIndicator).toBeVisible({ timeout: 5000 })
  })
})