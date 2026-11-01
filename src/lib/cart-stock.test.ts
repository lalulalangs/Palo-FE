import { describe, it, expect } from 'vitest';
import { stockStateOf } from './cart-stock';
import type { CartItem } from './types';

function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    sku_id: 1,
    product_name: 'Kaos Rinjani Senaru',
    product_slug: 'kaos-rinjani-senaru',
    variant_name: 'Hitam / L',
    sku_code: 'KRS-BLK-L',
    unit_price: 150000,
    unit_price_display: 'Rp 150.000',
    quantity: 2,
    subtotal: 300000,
    subtotal_display: 'Rp 300.000',
    image: '/storage/media/kaos.webp',
    available_stock: 10,
    is_out_of_stock: false,
    ...overrides,
  };
}

describe('stockStateOf', () => {
  it('returns "cukup" when quantity is within available stock and not out of stock', () => {
    const item = createMockCartItem({ quantity: 2, available_stock: 5, is_out_of_stock: false });
    expect(stockStateOf(item)).toBe('cukup');
  });

  it('returns "cukup" when quantity is exactly equal to available stock', () => {
    const item = createMockCartItem({ quantity: 5, available_stock: 5, is_out_of_stock: false });
    expect(stockStateOf(item)).toBe('cukup');
  });

  it('returns "kurang" when quantity exceeds available stock but available stock > 0', () => {
    const item = createMockCartItem({ quantity: 6, available_stock: 5, is_out_of_stock: false });
    expect(stockStateOf(item)).toBe('kurang');
  });

  it('returns "habis" when available stock is 0', () => {
    const item = createMockCartItem({ quantity: 1, available_stock: 0, is_out_of_stock: false });
    expect(stockStateOf(item)).toBe('habis');
  });

  it('returns "habis" when is_out_of_stock flag is true even if available_stock > 0', () => {
    const item = createMockCartItem({ quantity: 1, available_stock: 10, is_out_of_stock: true });
    expect(stockStateOf(item)).toBe('habis');
  });

  it('prioritizes "habis" over "kurang" when available stock is 0 and quantity > 0', () => {
    const item = createMockCartItem({ quantity: 5, available_stock: 0, is_out_of_stock: false });
    expect(stockStateOf(item)).toBe('habis');
  });
});
