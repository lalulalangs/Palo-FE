import { describe, it, expect } from 'vitest';
import {
  parseCatalogParams,
  buildCatalogSearchParams,
  catalogHref,
  PER_PAGE,
} from './catalog-query';

describe('catalog-query', () => {
  describe('parseCatalogParams', () => {
    it('uses standard defaults when searchParams is empty', () => {
      const params = parseCatalogParams({});
      expect(params).toEqual({
        q: null,
        category: null,
        minPrice: null,
        maxPrice: null,
        sort: 'latest',
        inStock: false,
        page: 1,
        perPage: PER_PAGE,
      });
    });

    it('parses valid query string parameters', () => {
      const params = parseCatalogParams({
        q: 'tenda',
        category: 'tenda-kemah',
        min_price: '100000',
        max_price: '500000',
        sort: 'price_asc',
        in_stock: '1',
        page: '3',
      });

      expect(params.q).toBe('tenda');
      expect(params.category).toBe('tenda-kemah');
      expect(params.minPrice).toBe(100000);
      expect(params.maxPrice).toBe(500000);
      expect(params.sort).toBe('price_asc');
      expect(params.inStock).toBe(true);
      expect(params.page).toBe(3);
    });

    it('gracefully handles arrays, invalid numbers, and unknown sort keys', () => {
      const params = parseCatalogParams({
        q: ['ransel', 'tenda'], // array: takes first
        min_price: '-500', // negative: null
        max_price: 'bukan_angka', // non-number: null
        sort: 'hacked_injection', // invalid sort: defaults to 'latest'
        in_stock: '0', // not '1': false
        page: '-10', // invalid page: defaults to 1
      });

      expect(params.q).toBe('ransel');
      expect(params.minPrice).toBeNull();
      expect(params.maxPrice).toBeNull();
      expect(params.sort).toBe('latest');
      expect(params.inStock).toBe(false);
      expect(params.page).toBe(1);
    });
  });

  describe('buildCatalogSearchParams', () => {
    it('omits defaults to keep URL clean', () => {
      const current = parseCatalogParams({});
      const searchParams = buildCatalogSearchParams(current, {});
      expect(searchParams.toString()).toBe('');
    });

    it('includes non-default overrides', () => {
      const current = parseCatalogParams({});
      const searchParams = buildCatalogSearchParams(current, {
        category: 'apparel',
        sort: 'price_desc',
        page: 2,
        inStock: true,
      });

      expect(searchParams.get('category')).toBe('apparel');
      expect(searchParams.get('sort')).toBe('price_desc');
      expect(searchParams.get('page')).toBe('2');
      expect(searchParams.get('in_stock')).toBe('1');
    });
  });

  describe('catalogHref', () => {
    it('generates /produk URL with query string', () => {
      const href = catalogHref({ category: 'jaket', page: '2' });
      expect(href).toContain('/produk?');
      expect(href).toContain('category=jaket');
      expect(href).toContain('page=2');
    });
  });
});
