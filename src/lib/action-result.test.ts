import { describe, it, expect } from 'vitest';
import { toActionError } from './action-result';
import { ApiError } from './api-error';

describe('toActionError', () => {
  it('maps 503 courier unavailable to kind: "courier"', () => {
    const error = new ApiError('API Kurir timeout', 503);
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('courier');
  });

  it('maps 409 price changed to kind: "price-changed" with changes and new total', () => {
    const priceChanges = [
      {
        sku_id: 10,
        sku_code: 'TD-01',
        product_name: 'Tenda Dome',
        old_price: 500000,
        new_price: 550000,
        quantity: 1,
      },
    ];
    const error = new ApiError('Harga berubah', 409, {}, {
      errorCode: 'price_changed',
      priceChanges,
      newGrandTotal: 580000,
    });

    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('price-changed');
    expect(actionError.priceChanges).toEqual(priceChanges);
    expect(actionError.newGrandTotal).toBe(580000);
  });

  it('maps 409 stock unavailable to kind: "stock"', () => {
    const error = new ApiError('Sisa stok tidak mencukupi.', 409);
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('stock');
    expect(actionError.message).toBe('Sisa stok tidak mencukupi.');
  });

  it('maps 422 shipping destination not found to kind: "address"', () => {
    const error = new ApiError('Wilayah pengiriman tidak ditemukan.', 422, {}, {
      errorCode: 'shipping_destination_not_found',
    });
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('address');
  });

  it('maps 422 with voucher error field to kind: "voucher"', () => {
    const error = new ApiError('Kode voucher tidak berlaku.', 422, {
      code: ['Voucher sudah kadaluarsa.'],
    });
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('voucher');
    expect(actionError.fieldErrors.code).toBeDefined();
  });

  it('maps 422 generic form error to kind: "validation"', () => {
    const error = new ApiError('Validasi form gagal.', 422, {
      phone: ['Nomor telepon wajib diisi.'],
    });
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('validation');
    expect(actionError.fieldErrors.phone).toBeDefined();
  });

  it('maps 429 rate limit to kind: "rate-limit" with friendly Indonesian message', () => {
    const error = new ApiError('Too Many Attempts.', 429);
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('rate-limit');
    expect(actionError.message).toContain('Terlalu banyak percobaan');
  });

  it('maps 401 or 403 to kind: "auth"', () => {
    const error = new ApiError('Unauthenticated', 401);
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('auth');
  });

  it('maps status 0 to kind: "network"', () => {
    const error = new ApiError('Network error', 0);
    const actionError = toActionError(error);
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('network');
  });

  it('maps non-ApiError exceptions safely to kind: "unknown"', () => {
    const actionError = toActionError(new Error('Unexpected exception'));
    expect(actionError.ok).toBe(false);
    expect(actionError.kind).toBe('unknown');
  });
});
