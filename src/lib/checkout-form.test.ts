import { describe, it, expect } from 'vitest';
import {
  readAddress,
  isPaymentMethod,
  addressRegion,
} from './checkout-form';
import type { ShippingDestination } from './types';

describe('checkout-form helpers', () => {
  describe('isPaymentMethod', () => {
    it('accepts valid payment methods defined in PAYMENT_METHODS', () => {
      expect(isPaymentMethod('online')).toBe(true);
    });

    it('rejects invalid or unknown payment methods', () => {
      expect(isPaymentMethod('bitcoin')).toBe(false);
      expect(isPaymentMethod('')).toBe(false);
      expect(isPaymentMethod('paypal')).toBe(false);
    });
  });

  describe('readAddress', () => {
    it('returns address object when all mandatory fields are valid', () => {
      const formData = new FormData();
      formData.set('recipient_name', 'Budi Santoso');
      formData.set('phone', '081234567890');
      formData.set('street', 'Jl. Pariwisata Senaru No. 12');
      formData.set('destination_id', '140');
      formData.set('city', 'Lombok Utara');
      formData.set('province', 'Nusa Tenggara Barat');
      formData.set('postal_code', '83354');
      formData.set('district', 'Bayan');
      formData.set('subdistrict', 'Senaru');
      formData.set('notes', 'Dekat pos pendakian');

      const result = readAddress(formData);
      expect('address' in result).toBe(true);
      if ('address' in result) {
        expect(result.address.recipient_name).toBe('Budi Santoso');
        expect(result.address.phone).toBe('081234567890');
        expect(result.address.destination_id).toBe(140);
        expect(result.address.notes).toBe('Dekat pos pendakian');
      }
    });

    it('collects field errors when mandatory fields are missing or empty', () => {
      const formData = new FormData();
      formData.set('recipient_name', '   ');
      formData.set('phone', '');
      formData.set('street', '');
      formData.set('destination_id', '0');
      formData.set('city', '');
      formData.set('province', '');

      const result = readAddress(formData);
      expect('errors' in result).toBe(true);
      if ('errors' in result) {
        expect(result.errors.recipient_name).toBeDefined();
        expect(result.errors.phone).toBeDefined();
        expect(result.errors.street).toBeDefined();
        expect(result.errors.destination_id).toBeDefined();
        expect(result.errors.city).toBeDefined();
        expect(result.errors.province).toBeDefined();
      }
    });

    it('treats empty optional fields as null', () => {
      const formData = new FormData();
      formData.set('recipient_name', 'Ahmad');
      formData.set('phone', '0811111111');
      formData.set('street', 'Jl. Utama');
      formData.set('destination_id', '50');
      formData.set('city', 'Mataram');
      formData.set('province', 'NTB');
      formData.set('postal_code', '   ');
      formData.set('notes', '');

      const result = readAddress(formData);
      expect('address' in result).toBe(true);
      if ('address' in result) {
        expect(result.address.postal_code).toBeNull();
        expect(result.address.notes).toBeNull();
      }
    });
  });

  describe('addressRegion', () => {
    it('extracts region fields from destination object', () => {
      const destination: ShippingDestination = {
        id: 101,
        subdistrict_name: 'Senaru',
        district_name: 'Bayan',
        city_name: 'Lombok Utara',
        province_name: 'Nusa Tenggara Barat',
        zip_code: '83354',
        label: 'Senaru, Bayan, Lombok Utara, Nusa Tenggara Barat (83354)',
      };

      const region = addressRegion(destination);
      expect(region.destination_id).toBe(101);
      expect(region.subdistrict).toBe('Senaru');
      expect(region.district).toBe('Bayan');
      expect(region.city).toBe('Lombok Utara');
      expect(region.province).toBe('Nusa Tenggara Barat');
      expect(region.postal_code).toBe('83354');
    });

    it('returns empty region reset when destination is null', () => {
      const region = addressRegion(null);
      expect(region.destination_id).toBe(0);
      expect(region.subdistrict).toBeNull();
      expect(region.district).toBeNull();
      expect(region.city).toBe('');
      expect(region.province).toBe('');
      expect(region.postal_code).toBeNull();
    });
  });
});
