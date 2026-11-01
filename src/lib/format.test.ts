import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  formatHarga,
  formatAngka,
  formatBarisPesanan,
  formatTanggal,
  formatTanggalWaktu,
} from './format';
import { PLACEHOLDER } from './placeholders';

describe('format utilities', () => {
  describe('formatRupiah', () => {
    it('formats valid integer numbers to Rupiah currency string', () => {
      const result = formatRupiah(250000);
      // Indonesian Intl formatter can use non-breaking space (U+00A0) or regular space
      const normalized = result.replace(/\u00a0/g, ' ');
      expect(normalized).toMatch(/Rp\s?250\.000/);
    });

    it('handles non-finite values gracefully by returning Rp 0', () => {
      const result = formatRupiah(NaN);
      const normalized = result.replace(/\u00a0/g, ' ');
      expect(normalized).toMatch(/Rp\s?0/);
    });
  });

  describe('formatHarga', () => {
    it('prioritizes display string when provided and non-empty', () => {
      expect(formatHarga(0, '[Harga dari Admin]')).toBe('[Harga dari Admin]');
      expect(formatHarga(15000, 'Rp 15.000 (Promo)')).toBe('Rp 15.000 (Promo)');
    });

    it('falls back to formatRupiah when display is null or empty', () => {
      const result = formatHarga(50000, null);
      const normalized = result.replace(/\u00a0/g, ' ');
      expect(normalized).toMatch(/Rp\s?50\.000/);
    });
  });

  describe('formatAngka', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatAngka(1000)).toBe('1.000');
      expect(formatAngka(1000000)).toBe('1.000.000');
    });

    it('formats 0 for non-finite values', () => {
      expect(formatAngka(Infinity)).toBe('0');
    });
  });

  describe('formatBarisPesanan', () => {
    it('returns placeholder when subtotal is 0 or non-finite', () => {
      expect(formatBarisPesanan(0)).toBe(PLACEHOLDER.price);
      expect(formatBarisPesanan(NaN)).toBe(PLACEHOLDER.price);
    });

    it('returns formatted rupiah for positive numbers', () => {
      const result = formatBarisPesanan(75000);
      const normalized = result.replace(/\u00a0/g, ' ');
      expect(normalized).toMatch(/Rp\s?75\.000/);
    });
  });

  describe('formatTanggal & formatTanggalWaktu', () => {
    it('returns em-dash for null or undefined dates', () => {
      expect(formatTanggal(null)).toBe('—');
      expect(formatTanggalWaktu(undefined)).toBe('—');
    });

    it('correctly formats an ISO date string in WITA (UTC+8)', () => {
      const iso = '2026-10-31T00:00:00Z'; // 08:00 WITA
      const formatted = formatTanggal(iso);
      expect(formatted).toContain('31 Oktober 2026');
    });
  });
});
