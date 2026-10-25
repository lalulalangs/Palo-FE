"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { placeOrderAction, quoteShippingAction } from "@/actions/checkout";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { AddressForm, type AddressSubmitResult } from "@/components/checkout/AddressForm";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { ShippingRatePicker } from "@/components/checkout/ShippingRatePicker";
import { VoucherField } from "@/components/checkout/VoucherField";
import { buttonClass } from "@/components/ui/Button";
import type { ActionError } from "@/lib/action-result";
import {
  addressRegion,
  type AddressFieldErrors,
  type AddressInput,
} from "@/lib/checkout-form";
import { formatHarga } from "@/lib/format";
import type {
  AppliedVoucher,
  CartItem,
  PaymentMethod,
  ShippingService,
  Voucher,
} from "@/lib/types";

/**
 * Alur checkout tiga langkah (PRD §3.6).
 *
 * Langkah: (1) alamat → (2) ongkir → (3) pembayaran & konfirmasi.
 *
 * Tiga aturan yang dijaga di sini dan tidak boleh dilanggar:
 *
 * 1. **503 dari kurir memblokir, bukan menampilkan ongkir default.**
 *    PRD §3.8 AC. Karena itu galat `kind: "courier"` menghentikan navigasi ke
 *    langkah 2, dan tombol "Buat Pesanan" tidak pernah aktif tanpa quote yang
 *    sukses.
 * 2. **Item dan ongkir berasal dari server.** Halaman ini menerima `cart` hanya
 *    untuk ditampilkan; item yang benar-benar dipesan diambil Server Action
 *    dari `GET /cart`. Nilai ongkir yang dikirim balik hanya pencocokan —
 *    `CreateOrder` memakai quote terverifikasi sendiri.
 * 3. **Tidak ada "Ambil di Gerai".** OD-05 masih DITUNDA; menampilkan opsi
 *    pickup berarti mengiklankan kebijakan yang belum disetujui pemilik.
 */
const STEPS = [
  { id: "alamat", label: "Alamat pengiriman" },
  { id: "ongkir", label: "Metode pengiriman" },
  { id: "bayar", label: "Pembayaran" },
] as const;

export function CheckoutFlow({
  cart,
  defaultAddress,
  userName,
  userEmail,
  vouchers,
}: {
  cart: CartItem[];
  defaultAddress: AddressInput;
  userName: string;
  userEmail: string;
  /** Kode yang sedang berlaku (`GET /vouchers`); `[]` bila gagal dimuat. */
  vouchers: Voucher[];
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressInput>(defaultAddress);
  const [addressErrors, setAddressErrors] = useState<AddressFieldErrors>({});
  /**
   * Dinaikkan hanya saat pilihan wilayah harus dikosongkan (422
   * `shipping_destination_not_found`). `AddressForm` memakai `defaults` sebagai
   * state awal, jadi remount adalah cara paling sederhana mengisi ulang form
   * tanpa sinkronisasi dua arah antara induk dan form.
   */
  const [addressFormKey, setAddressFormKey] = useState(0);

  const [services, setServices] = useState<ShippingService[]>([]);
  const [selectedService, setSelectedService] = useState<ShippingService | null>(
    null,
  );
  const [destinationCity, setDestinationCity] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  // Satu sumber kebenaran: yang tampil di ringkasan = yang diterapkan server.
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);

  const [isQuoting, startQuoting] = useTransition();
  const [isPlacing, startPlacing] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [addressError, setAddressError] = useState<ActionError | null>(null);
  const [shippingError, setShippingError] = useState<ActionError | null>(null);
  const [orderError, setOrderError] = useState<ActionError | null>(null);

  const busy = isQuoting || isPlacing || isRedirecting;

  function handleAddressSubmit(result: AddressSubmitResult) {
    setAddressError(null);

    if (!result.ok) {
      setAddressErrors(result.errors);
      return;
    }

    setAddressErrors({});
    setAddress(result.address);
    setServices([]);
    setSelectedService(null);
    setShippingError(null);

    startQuoting(async () => {
      const quote = await quoteShippingAction(result.address);
      if (isActionErrorLike(quote)) {
        // 422 `shipping_destination_not_found`: wilayah tujuan belum pasti bagi
        // kurir, jadi pilihan wilayah dikosongkan dan pembeli memilih ulang dari
        // hasil pencarian. Isian lain tetap; voucher tidak disentuh.
        if (quote.kind === "address") {
          setAddress({ ...result.address, ...addressRegion(null) });
          setAddressFormKey((key) => key + 1);
        }
        setShippingError(quote);
        return;
      }
      setServices(quote.services);
      setDestinationCity(quote.destinationCity);
      setSelectedService(quote.services[0] ?? null);
      setStep(1);
    });
  }

  function submitOrder(acknowledgePriceChange = false) {
    if (!selectedService) {
      setOrderError({
        ok: false,
        kind: "validation",
        message: "Pilih metode pengiriman terlebih dahulu.",
        fieldErrors: {},
      });
      return;
    }
    if (!paymentMethod) {
      setOrderError({
        ok: false,
        kind: "validation",
        message: "Pilih metode pembayaran terlebih dahulu.",
        fieldErrors: {},
      });
      return;
    }

    // Snapshot harga yang SEDANG terlihat pembeli di halaman ini. Dikirim
    // sebagai `price_seen` supaya backend bisa mendeteksi perubahan harga sejak
    // halaman dirender (cart di server tidak menyimpan harga, lihat
    // `cartLineItems()`).
    const priceSeen: Record<number, number> = {};
    for (const item of cart) {
      priceSeen[item.sku_id] = item.unit_price;
    }

    setOrderError(null);
    startPlacing(async () => {
      const result = await placeOrderAction({
        address,
        service: selectedService,
        paymentMethod,
        voucherCode: voucher?.code ?? null,
        acknowledgePriceChange,
        priceSeen,
      });

      if (isActionErrorLike(result)) {
        // S10: server menolak voucher-nya, jadi diskon lama tidak boleh
        // menetap di layar setelah pesanan gagal dibuat.
        if (result.kind === "voucher") setVoucher(null);
        setOrderError(result);
        return;
      }

      setIsRedirecting(true);

      /*
       * Pesanan dibuat → pembeli langsung dibawa ke halaman pembayaran
       * gateway. Sebelumnya mereka berhenti di halaman instruksi yang tidak
       * berisi nomor VA/QR apa pun untuk DOKU Checkout (host-to-host), jadi
       * pesanan "menunggu pembayaran" tanpa jalan untuk membayar.
       *
       * Navigasi dilakukan dengan `window.location.assign`, bukan `router.push`:
       * tujuannya situs lain (staging.doku.com), dan router Next hanya untuk
       * rute internal. `?order=` tetap diteruskan supaya pembeli mendarat
       * kembali di halaman pesanan bila gateway mengembalikan mereka tanpa
       * parameter.
       */
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }

      // Cadangan: tidak ada URL pembayaran (mis. gateway bermasalah). Halaman
      // hasil tetap berguna karena menampilkan instruksi & status terbaru.
      router.push(
        `/checkout/berhasil?order=${encodeURIComponent(result.order.order_number)}`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <CheckoutSteps steps={STEPS} current={step} />

      <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
        <div className="desktop:col-span-7">
          {/* ---- Langkah 1: alamat ---- */}
          {step === 0 ? (
            <section
              aria-labelledby="langkah-alamat"
              className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
            >
              <h2
                id="langkah-alamat"
                className="text-headline-sm text-brand-deep"
              >
                Alamat pengiriman
              </h2>
              <p className="mt-1 text-caption text-text-secondary">
                Dipakai kurir untuk mengirim paket dan menghitung ongkir.
              </p>

              <div className="mt-5">
                <AddressForm
                  key={addressFormKey}
                  defaults={address}
                  errors={addressErrors}
                  quoteError={shippingError}
                  disabled={busy}
                  isPending={isQuoting}
                  onSubmit={handleAddressSubmit}
                />
              </div>

              {addressError ? (
                <div role="alert" className="mt-4">
                  <PlaceholderNotice
                    title="Alamat belum bisa diproses"
                    body={addressError.message}
                    variant="paper"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ---- Langkah 2: ongkir ---- */}
          {step === 1 ? (
            <section
              aria-labelledby="langkah-ongkir"
              className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2
                    id="langkah-ongkir"
                    className="text-headline-sm text-brand-deep"
                  >
                    Metode pengiriman
                  </h2>
                  <p className="mt-1 text-caption text-text-secondary">
                    Ke {destinationCity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShippingError(null);
                    setStep(0);
                  }}
                  className="min-h-11 rounded-md px-3 text-label-sm font-semibold text-brand-forest underline underline-offset-4"
                >
                  Ubah alamat
                </button>
              </div>

              {isQuoting ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-4 text-caption text-text-secondary"
                >
                  Menghitung ongkir dari layanan kurir…
                </p>
              ) : null}

              {services.length > 0 ? (
                <div className="mt-4">
                  <ShippingRatePicker
                    services={services}
                    selectedKey={
                      selectedService
                        ? `${selectedService.courier} ${selectedService.service}`
                        : null
                    }
                    destinationCity={destinationCity}
                    onSelect={setSelectedService}
                    disabled={busy}
                  />
                </div>
              ) : null}

              {/*
                Galat quote TIDAK dirender di sini: `handleAddressSubmit` tidak
                pernah memindahkan `step` saat quote gagal, jadi pembeli tetap
                di langkah 1. Blok yang dulu ada di sini mati dan sudah pindah
                ke `AddressForm` (`quoteError`), di tempat pembeli menekan tombol.
              */}

              <button
                type="button"
                onClick={() => {
                  setOrderError(null);
                  setStep(2);
                }}
                disabled={busy || selectedService === null}
                className={buttonClass({
                  size: "lg",
                  fullWidth: true,
                  className: "mt-5",
                })}
              >
                Lanjut ke pembayaran
              </button>
            </section>
          ) : null}

          {/* ---- Langkah 3: pembayaran ---- */}
          {step === 2 ? (
            <section
              aria-labelledby="langkah-bayar"
              className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2
                  id="langkah-bayar"
                  className="text-headline-sm text-brand-deep"
                >
                  Metode pembayaran
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOrderError(null);
                    setStep(1);
                  }}
                  className="min-h-11 rounded-md px-3 text-label-sm font-semibold text-brand-forest underline underline-offset-4"
                >
                  Ubah pengiriman
                </button>
              </div>

              <div className="mt-4">
                <PaymentMethodPicker
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  disabled={busy}
                />
              </div>

              <div className="mt-6">
                <VoucherField
                  vouchers={vouchers}
                  subtotal={cart.reduce((total, item) => total + item.subtotal, 0)}
                  applied={voucher}
                  onAppliedChange={setVoucher}
                  disabled={busy}
                />
              </div>

              {/*
                409 `price_changed`: backend menolak order karena harga berubah
                sejak keranjang dibuka. Daftar perubahan ditampilkan apa adanya,
                dan pembeli harus menyetujuinya sebelum order dikirim ulang
                dengan `acknowledge_price_change: true` (PRD §3.6).
              */}
              {orderError?.kind === "price-changed" ? (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-feedback-warn/40 bg-surface-paper p-4"
                >
                  <h3 className="text-title-md font-semibold text-text-primary">
                    Harga berubah sejak keranjang dibuka
                  </h3>
                  <p className="mt-1 text-caption leading-relaxed text-text-secondary">
                    {orderError.message}
                  </p>

                  {orderError.priceChanges &&
                  orderError.priceChanges.length > 0 ? (
                    <ul className="mt-3 divide-y divide-border-soft">
                      {orderError.priceChanges.map((change) => (
                        <li
                          key={change.sku_code}
                          className="flex items-baseline justify-between gap-3 py-2"
                        >
                          <span className="min-w-0">
                            <span className="block text-title-sm text-text-primary">
                              {change.product_name}
                            </span>
                            <span className="block text-caption text-text-secondary">
                              {change.sku_code} · {change.quantity} pcs
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-caption text-text-secondary line-through">
                              {formatHarga(change.old_price, null)}
                            </span>
                            <span className="block text-title-sm font-semibold text-text-primary">
                              {formatHarga(change.new_price, null)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {typeof orderError.newGrandTotal === "number" ? (
                    <p className="mt-3 text-title-md font-semibold text-brand-forest">
                      Total baru: {formatHarga(orderError.newGrandTotal, null)}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 tablet:flex-row">
                    <button
                      type="button"
                      onClick={() => submitOrder(true)}
                      disabled={busy}
                      className={buttonClass({ size: "lg", fullWidth: true })}
                    >
                      Setuju &amp; lanjutkan
                    </button>
                    <Link
                      href="/keranjang"
                      className={buttonClass({ variant: "ghost", size: "lg" })}
                    >
                      Tinjau keranjang
                    </Link>
                  </div>
                </div>
              ) : orderError ? (
                <div role="alert" className="mt-4">
                  <PlaceholderNotice
                    title={
                      orderError.kind === "stock"
                        ? "Stok tidak lagi mencukupi"
                        : orderError.kind === "voucher"
                          ? "Voucher tidak dapat dipakai"
                          : orderError.kind === "rate-limit"
                            ? "Terlalu banyak percobaan"
                            : "Pesanan belum dapat dibuat"
                    }
                    body={`${orderError.message}${
                      orderError.kind === "stock"
                        ? " Kembali ke keranjang untuk menyesuaikan jumlah."
                        : ""
                    }`}
                    variant="paper"
                  />
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
                <button
                  type="button"
                  onClick={() => submitOrder()}
                  disabled={busy || !paymentMethod || !selectedService}
                  className={buttonClass({ size: "lg", fullWidth: true })}
                >
                  {isPlacing
                    ? "Membuat pesanan…"
                    : isRedirecting
                      ? "Membuka halaman pesanan…"
                      : "Buat Pesanan"}
                </button>
                <Link
                  href="/keranjang"
                  className={buttonClass({ variant: "ghost", size: "lg" })}
                >
                  Kembali ke keranjang
                </Link>
              </div>

              <p className="mt-3 text-caption leading-relaxed text-text-secondary">
                Harga, stok, dan voucher divalidasi ulang oleh server saat tombol
                ditekan, memakai nilai terbaru — bukan angka yang dikirim dari
                peramban ini (PRD §3.6).
              </p>
            </section>
          ) : null}
        </div>

        {/* ---- Ringkasan ---- */}
        <div className="desktop:col-span-5">
          <CheckoutSummary
            cart={cart}
            accountName={userName}
            accountEmail={userEmail}
            address={step >= 1 ? address : null}
            service={selectedService}
            paymentMethod={paymentMethod}
            voucher={voucher}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Pengecek bentuk untuk hasil Server Action.
 *
 * Hasil aksi berbentuk union `GuestResultHandoff | ActionError` (atau
 * `ShippingQuoteResult | ActionError`) sehingga pengecekan `ok === false`
 * diperlukan untuk memperkecil tipe sebelum dibaca. Sengaja ditulis lokal
 * supaya komponen ini tidak menarik helper runtime ke bundle client.
 */
function isActionErrorLike(value: unknown): value is ActionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === false
  );
}
