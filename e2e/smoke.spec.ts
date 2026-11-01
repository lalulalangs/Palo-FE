import { test, expect } from '@playwright/test';

test.describe('Smoke E2E Test', () => {
  test('homepage responds with 200 and loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Palo Mountain Goods/i);
  });
});
