import { test, expect } from '@playwright/test'

test.describe('Canvas Defender E2E Tests', () => {
  test('should navigate through minimal playable path', async ({ page }) => {
    // Open homepage
    await page.goto('/')
    
    // Enter game
    await page.getByText('✏️ 开始绘制冒险！').click()
    await expect(page.getByText('🎨 颜料精华')).toBeVisible()
    
    // Select red tower
    await page.getByText('烈焰塔').click()
    
    // Click on a valid place (not on path) - let's pick (1, 1)
    const grid = page.locator('.relative.bg-white.rounded-xl')
    await grid.click({ position: { x: 75, y: 75 } })
    
    // Verify tower appears (check that towers are rendered)
    await expect(page.locator('.tower-brush')).toHaveCount(1)
    
    // Verify score, wave, health areas exist
    await expect(page.getByText(/波次 \d+\/10/)).toBeVisible()
    await expect(page.getByText(/^\d+$/).filter({ hasText: '100' })).toBeVisible()
    await expect(page.getByText('⭐').first()).toBeVisible()
    
    // Try to start wave
    const startWaveButton = page.getByText(/开始第 \d+ 波/)
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click()
      await expect(page.getByText('⚔️ 战斗中...')).toBeVisible()
    }
  })
})
