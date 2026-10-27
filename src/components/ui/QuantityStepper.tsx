"use client";

import { useId, useState } from "react";

import { inputClassName } from "./Input";

/**
 * Stepper jumlah.
 *
 * Sifat penting (PRD §3.4):
 * 1. `max` dibatasi stok yang benar-benar tersedia (`available_stock` =
 *    on_hand − reservasi aktif). Backend menolak overweight dengan pesan
 *    "Stok tersedia hanya N", jadi UI harus mencegah lebih dulu, bukan
 *    messaging setelah gagal.
 * 2. Keranjang TIDAK PERNAH mengunci stok. Karena itu label di bawah stepper
 *    selalu menjelaskan bahwa stok bisa berubah, bukan menjanjikan "stok
 *    diamalkan".
 * 3. Tombol ± 44px, dan punya `aria-label` karena isinya cuma ikon (audit
 *    a11y: 46 dari 50 kontrol ikon-only tanpa nama aksesibel).
 */
export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label: string;
  disabled?: boolean;
  /** Nama butir untuk pesan batas maksimum, mis. "Varian Ukuran L". */
  itemName?: string;
  /**
   * Catatan pengganti pesan batas. Pemanggil WAJIB mengirimnya bila ingin
   * menjelaskan angka: teks bawaan "Maksimal N per pesanan" sudah pensiun
   * karena N adalah stok SKU, bukan kebijakan toko (H5).
   */
  note?: { text: string; tone: "muted" | "warn" };
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  disabled = false,
  itemName,
  note,
  className,
}: QuantityStepperProps) {
  const inputId = useId();
  const [notice, setNotice] = useState<string | null>(null);

  const atMax = value >= max;
  const atMin = value <= min;
  const upper = Math.max(max, min);

  function commit(next: number) {
    /*
     * `value` bisa SUDAH di atas `max` — stok turun setelah barang masuk
     * keranjang, dan `GET /cart` tidak meng-clamp quantity. Backend menolak
     * setiap tulis dengan `quantity > available_stock`
     * (`CartService::updateItem`: "Jumlah melebihi stok tersedia (N)"), jadi
     * menurunkan satu langkah (5→4→3→2) hanya menghasilkan tiga penolakan
     * tanpa mengubah apa pun. Satu klik harus langsung mendarat di `max`;
     * angkanya sendiri sudah dijelaskan catatan di bawah stepper.
     */
    const clamped = Math.min(Math.max(next, min), upper);
    onChange(clamped);
    if (next > upper) {
      setNotice(
        `Stok tersedia hanya ${upper}${itemName ? ` untuk ${itemName}` : ""}.`,
      );
      return;
    }
    setNotice(null);
  }

  return (
    <div className={className}>
      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border-soft bg-surface-white">
        <button
          type="button"
          onClick={() => commit(value - 1)}
          disabled={disabled || atMin}
          aria-label={`Kurangi ${label}`}
          className="flex h-11 w-11 items-center justify-center text-text-secondary transition-colors hover:bg-surface-sage hover:text-brand-forest disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-title-md leading-none">
            &minus;
          </span>
        </button>
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          className={`${inputClassName} h-11 w-14 min-h-0 rounded-none border-0 border-x border-border-soft text-center text-label-md font-semibold [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          value={value}
          min={min}
          max={Math.max(max, min)}
          disabled={disabled}
          readOnly
          aria-describedby={`${inputId}-notice`}
        />
        <button
          type="button"
          onClick={() => commit(value + 1)}
          disabled={disabled || atMax}
          aria-label={`Tambah ${label}`}
          className="flex h-11 w-11 items-center justify-center text-text-secondary transition-colors hover:bg-surface-sage hover:text-brand-forest disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-title-md leading-none">
            +
          </span>
        </button>
      </div>
      {/* `aria-live` supaya pembaca layar langsung membacakan pesan batas
          stok tanpa pengguna harus menebak apa yang berubah. */}
      <p
        id={`${inputId}-notice`}
        role="status"
        aria-live="polite"
        className={[
          "mt-1.5 text-body-sm",
          note?.tone === "warn" ? "text-feedback-warn" : "text-text-secondary",
        ].join(" ")}
      >
        {notice ?? note?.text ?? null}
      </p>
    </div>
  );
}
