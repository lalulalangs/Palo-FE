"use client";

import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/types";

/**
 * Pemilih metode pembayaran.
 *
 * Daftar metode diambil dari `PAYMENT_METHODS`, yang mencerminkan
 * `Rule::in([...])` di `StoreOrderRequest` backend. Menulis daftar sendiri di
 * komponen berarti harus diubah dua kali setiap kali backend menambah metode.
 *
 * Elemennya `<label>` + `<input type="radio">` yang terlihat, dengan alasan
 * yang sama seperti di `ShippingRatePicker`.
 */
export function PaymentMethodPicker({
  selected,
  onSelect,
  disabled = false,
  isPending = false,
}: {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <fieldset className="border-0 p-0" disabled={disabled || isPending}>
      <legend className="text-label-md font-semibold text-text-primary">
        Metode pembayaran
      </legend>

      <div className="mt-4 grid gap-3 tablet:grid-cols-2">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selected === method.value;

          return (
            <label
              key={method.value}
              className={[
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-4 transition-colors",
                isSelected
                  ? "border-brand-forest bg-surface-sage"
                  : "border-border-soft bg-surface-white hover:bg-surface-paper",
                disabled || isPending ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="payment_method"
                value={method.value}
                checked={isSelected}
                onChange={() => onSelect(method.value)}
                className="h-5 w-5 shrink-0 accent-brand-forest"
              />
              <span className="text-title-md font-semibold text-text-primary">
                {method.label}
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-caption leading-relaxed text-text-secondary">
        Nomor pesanan dan instruksi pembayaran muncul setelah pesanan dibuat.
        Batas pembayaran mengikuti nilai yang diberikan payment gateway, dan
        produk yang Anda pesan ditahan selama batas itu berjalan (PRD §3.6–§3.7).
      </p>
    </fieldset>
  );
}
