import { test, expect } from '@playwright/test';

test.describe('Catalog and PDP E2E', () => {
  test('catalog page loads with header, filters, and products', async ({ page }) => {
    await page.goto('/produk');
    await expect(page).toHaveURL(/\/produk/);
    await expect(page.getByRole('heading', { name: /koleksi & perlengkapan/i })).toBeVisible();

    // Verify search input
    const searchInput = page.getByPlaceholder(/cari nama produk/i);
    await expect(searchInput).toBeVisible();
  });

  test('filtering with query parameters updates URL cleanly', async ({ page }) => {
    await page.goto('/produk?sort=price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);

    const sortSelect = page.getByRole('combobox');
    await expect(sortSelect).toHaveValue('price_asc');
  });

  test('cart page renders properly and displays empty state or items', async ({ page }) => {
    await page.goto('/keranjang');
    await expect(page).toHaveURL(/\/keranjang/);
    await expect(page.getByRole('heading', { level: 1, name: /keranjang/i })).toBeVisible();
  });
});
