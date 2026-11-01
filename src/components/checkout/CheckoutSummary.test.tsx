import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CheckoutSummary } from './CheckoutSummary';
import type { CartItem, ShippingService, AppliedVoucher } from '@/lib/types';
import type { AddressInput } from '@/lib/checkout-form';

const mockCart: CartItem[] = [
  {
    sku_id: 1,
    product_name: 'Tas Carrier 60L',
    product_slug: 'tas-carrier-60l',
    variant_name: 'Hijau Army',
    sku_code: 'TC60-GRN',
    unit_price: 750000,
    unit_price_display: 'Rp 750.000',
    quantity: 1,
    subtotal: 750000,
    subtotal_display: 'Rp 750.000',
    image: '/carrier.webp',
    available_stock: 5,
    is_out_of_stock: false,
  },
  {
    sku_id: 2,
    product_name: 'Kaos Senaru',
    product_slug: 'kaos-senaru',
    variant_name: 'Hitam / XL',
    sku_code: 'KS-BLK-XL',
    unit_price: 150000,
    unit_price_display: 'Rp 150.000',
    quantity: 2,
    subtotal: 300000,
    subtotal_display: 'Rp 300.000',
    image: '/kaos.webp',
    available_stock: 10,
    is_out_of_stock: false,
  },
];

const mockAddress: AddressInput = {
  recipient_name: 'Lalu Satria',
  phone: '081987654321',
  street: 'Jl. Pariwisata Senaru',
  destination_id: 101,
  city: 'Lombok Utara',
  province: 'Nusa Tenggara Barat',
  postal_code: '83354',
  district: 'Bayan',
  subdistrict: 'Senaru',
  notes: null,
};

const mockService: ShippingService = {
  courier: 'JNE',
  service: 'REG',
  cost: 45000,
  etd: '2-3 hari',
  description: 'Layanan Reguler JNE',
};

describe('CheckoutSummary component', () => {
  it('renders line items, recipient account info, and subtotal accurately without voucher/service', () => {
    render(
      <CheckoutSummary
        cart={mockCart}
        accountName="Lalu Satria"
        accountEmail="lalu@example.com"
        address={null}
        service={null}
        voucher={null}
      />,
    );

    expect(screen.getByText('Tas Carrier 60L')).toBeInTheDocument();
    expect(screen.getByText('Kaos Senaru')).toBeInTheDocument();
    expect(screen.getByText('Lalu Satria')).toBeInTheDocument();
    expect(screen.getByText('lalu@example.com')).toBeInTheDocument();

    // Total subtotal = 750.000 + 300.000 = 1.050.000
    // Total without shipping service should display em-dash "—"
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Belum dihitung')).toBeInTheDocument();
  });

  it('calculates total correctly when shipping service is selected', () => {
    render(
      <CheckoutSummary
        cart={mockCart}
        accountName="Lalu Satria"
        accountEmail="lalu@example.com"
        address={mockAddress}
        service={mockService}
        voucher={null}
      />,
    );

    // Subtotal: 1.050.000 + Ongkir: 45.000 = 1.095.000
    const totalElement = screen.getByText(/1\.095\.000/);
    expect(totalElement).toBeInTheDocument();
  });

  it('deducts voucher discount accurately from total', () => {
    const mockVoucher: AppliedVoucher = {
      code: 'RINJANI50',
      discount_amount: 50000,
      formatted_discount_amount: 'Rp 50.000',
      final_subtotal: 1000000, // 1.050.000 - 50.000
      formatted_final_subtotal: 'Rp 1.000.000',
      formatted_subtotal: 'Rp 1.050.000',
    };

    render(
      <CheckoutSummary
        cart={mockCart}
        accountName="Lalu Satria"
        accountEmail="lalu@example.com"
        address={mockAddress}
        service={mockService}
        voucher={mockVoucher}
      />,
    );

    // Final subtotal: 1.000.000 + Ongkir: 45.000 = 1.045.000
    const totalElement = screen.getByText(/1\.045\.000/);
    expect(totalElement).toBeInTheDocument();
    expect(screen.getByText(/RINJANI50/)).toBeInTheDocument();
  });
});
