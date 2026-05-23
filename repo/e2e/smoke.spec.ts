import { expect, test } from '@playwright/test';

test('首页可以启动并完成最基础交互', async ({ page }: { page: any }) => {
  const pageErrors: Error[] = [];

  page.on('pageerror', (error: Error) => {
    pageErrors.push(error);
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /绘世守护者/i })).toBeVisible();

  await page.getByRole('button', { name: /开始绘制冒险/i }).click();

  await expect(page.getByText('颜料精华')).toBeVisible();
  await expect(page.getByText('绘制防御塔')).toBeVisible();

  await page.getByRole('button', { name: /烈焰塔/i }).click();
  await page.getByRole('button', { name: /水彩/i }).click();

  await expect(page.getByRole('button', { name: /烈焰塔/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /水彩/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /开始第 1 波/i })).toBeVisible();

  expect(pageErrors).toHaveLength(0);
});
