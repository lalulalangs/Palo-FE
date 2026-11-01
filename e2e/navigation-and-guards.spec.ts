import { test, expect } from '@playwright/test';

test.describe('Navigation and Route Guards E2E', () => {
  test('unauthenticated visitor accessing /checkout is prompted to log in with redirect_to param', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('heading', { name: /masuk ke akunmu/i })).toBeVisible();
    const loginLink = page.getByRole('link', { name: /masuk untuk checkout/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', /\/masuk\?redirect_to=%2Fcheckout/);
  });

  test('unauthenticated visitor accessing /me is redirected to /masuk with redirect_to param', async ({ page }) => {
    await page.goto('/me');
    await expect(page).toHaveURL(/\/masuk\?redirect_to=%2Fme/);
    await expect(page.getByRole('heading', { name: /selamat datang kembali/i })).toBeVisible();
  });

  test('visitor can navigate to /lacak and search order number', async ({ page }) => {
    await page.goto('/lacak');
    await expect(page).toHaveURL(/\/lacak/);
    const input = page.getByLabel(/nomor pesanan/i);
    await expect(input).toBeVisible();
  });

  test('header contains navigation links and cart icon', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: /produk/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /keranjang/i })).toBeVisible();
  });
});
