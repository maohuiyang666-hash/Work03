import { expect, test } from '@playwright/test'

test('完成最小可玩路径', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('start-game-button')).toBeVisible()
  await page.getByTestId('start-game-button').click()

  await expect(page.getByTestId('game-board')).toBeVisible()
  await page.getByTestId('tower-button-red').click()
  await page.getByTestId('grid-cell-0-0').click()

  await expect(page.locator('[data-testid^="tower-"]')).toHaveCount(1)

  await page.getByTestId('start-wave-button').click()

  await expect(page.getByTestId('status-score')).toBeVisible()
  await expect(page.getByTestId('status-wave')).toBeVisible()
  await expect(page.getByTestId('status-core-health')).toBeVisible()
})
