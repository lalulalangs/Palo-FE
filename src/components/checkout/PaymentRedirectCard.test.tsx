import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { PaymentRedirectCard } from './PaymentRedirectCard';

const PAYMENT_URL = 'https://api-sandbox.doku.com/checkout/v1/payment/abc123';
const ORDER_NUMBER = 'UJN-20261031-00001';

describe('PaymentRedirectCard component', () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('menampilkan countdown 3 detik dan progress bar saat kunjungan pertama', () => {
    render(<PaymentRedirectCard paymentUrl={PAYMENT_URL} orderNumber={ORDER_NUMBER} />);

    expect(screen.getByText('Mengarahkan ke DOKU dalam 3 detik')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('mengalihkan otomatis ke DOKU dan menandai sessionStorage setelah 3 detik', () => {
    render(<PaymentRedirectCard paymentUrl={PAYMENT_URL} orderNumber={ORDER_NUMBER} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(assign).toHaveBeenCalledWith(PAYMENT_URL);
    expect(sessionStorage.getItem(`pmg_redirected_${ORDER_NUMBER}`)).toBe('true');
  });

  it('tidak mengulang redirect otomatis saat pembeli kembali dari DOKU (anti-loop)', () => {
    sessionStorage.setItem(`pmg_redirected_${ORDER_NUMBER}`, 'true');

    render(<PaymentRedirectCard paymentUrl={PAYMENT_URL} orderNumber={ORDER_NUMBER} />);

    expect(screen.getByText('Menunggu Pembayaran')).toBeInTheDocument();
    expect(screen.getByText('Lanjutkan Pembayaran')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('mengalihkan hanya sekali walau tombol Bayar Sekarang diklik ganda', () => {
    render(<PaymentRedirectCard paymentUrl={PAYMENT_URL} orderNumber={ORDER_NUMBER} />);

    const button = screen.getByRole('button', { name: /Bayar Sekarang/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(assign).toHaveBeenCalledTimes(1);
  });
});
