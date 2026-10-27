"use client";

import { useEffect, useState } from "react";

import { DestinationPicker } from "@/components/checkout/DestinationPicker";
import { Input, Textarea } from "@/components/ui/Input";
import { buttonClass } from "@/components/ui/Button";
import type { ActionError } from "@/lib/action-result";
import {
  addressRegion,
  readAddress,
  type AddressFieldErrors,
  type AddressInput,
} from "@/lib/checkout-form";
import type { ShippingDestination } from "@/lib/types";

export type AddressSubmitResult =
  | { ok: true; address: AddressInput }
  | { ok: false; errors: AddressFieldErrors };

/** `destination_id` tidak punya input sendiri; fokus diarahkan ke pencarian wilayah. */
const FIELD_ELEMENT: Record<string, string> = {
  destination_id: "destination_search",
};

/**
 * Formulir alamat pengiriman (`docs/SPEC-ALAMAT-25102026.md` §1).
 *
 * Kenapa satu langkah penuh, bukan pemilih dari daftar alamat tersimpan:
 * `routes/api.php` belum punya endpoint CRUD alamat, jadi tidak ada daftar
 * alamat yang bisa diambil dari server. Menampilkannya sebagai pilihan
 * berarti mengarang data. Formulir ini mengirim objek `shipping_address`
 * lengkap, yang memang bentuk yang diminta `CheckoutOrderRequest`.
 *
 * Wilayah tujuan TIDAK diketik. Satu pencarian → satu hasil dipilih mengisi
 * provinsi/kota/kecamatan/kelurahan/kode pos sekaligus dan menyimpan
 * `destination_id` (subdistrict RajaOngkir). "Kode kota untuk kurir" hilang:
 * itu satu-satunya pertanyaan yang tidak bisa dijawab pembeli tanpa CS, dan
 * jawabannya adalah sumber ongkir salah yang tidak pernah terdeteksi.
 */
export function AddressForm({
  defaults,
  errors,
  quoteError = null,
  disabled = false,
  isPending = false,
  onSubmit,
}: {
  defaults: AddressInput;
  errors: AddressFieldErrors;
  /** Kegagalan quote ongkir (`kind: "courier"`/`"address"`/…) — tampil di langkah ini. */
  quoteError?: ActionError | null;
  disabled?: boolean;
  isPending?: boolean;
  /** Dipanggil dengan hasil validasi. Tidak melempar exception. */
  onSubmit: (result: AddressSubmitResult) => void;
}) {
  const [values, setValues] = useState<AddressInput>(defaults);
  // Error dari submit sebelumnya tidak boleh menetap setelah isian diperbaiki.
  // Menyesuaikan state saat prop berubah (pola resmi React, tanpa effect).
  const [seenErrors, setSeenErrors] = useState(errors);
  const [edited, setEdited] = useState(false);
  if (seenErrors !== errors) {
    setSeenErrors(errors);
    setEdited(false);
  }

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setEdited(true);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectDestination(destination: ShippingDestination | null) {
    setEdited(true);
    setValues((current) => ({ ...current, ...addressRegion(destination) }));
  }

  // Fokus pindah ke field pertama yang salah: form ini hanya 6 isian, jadi
  // ringkasan tidak perlu tautan lompat.
  useEffect(() => {
    const first = Object.keys(errors)[0];
    if (!first) return;
    const id = FIELD_ELEMENT[first] ?? first;
    document.getElementById(id)?.focus();
  }, [errors]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // `FormData` dibangun dari state yang sama dengan yang dirender, jadi
    // yang divalidasi benar-benar yang akan dikirim.
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined) {
        formData.set(key, String(value));
      }
    }

    const parsed = readAddress(formData);
    if ("errors" in parsed) {
      onSubmit({ ok: false, errors: parsed.errors });
      return;
    }
    onSubmit({ ok: true, address: parsed.address });
  }

  const isDisabled = disabled || isPending;
  const shown: AddressFieldErrors = edited ? {} : errors;
  const regionError =
    shown.destination_id?.[0] ?? shown.city?.[0] ?? shown.province?.[0];
  const errorCount = Object.keys(shown).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <Input
        id="recipient_name"
        name="recipient_name"
        label="Nama penerima"
        autoComplete="name"
        required
        maxLength={120}
        disabled={isDisabled}
        value={values.recipient_name}
        onChange={(event) => update("recipient_name", event.target.value)}
        error={shown.recipient_name?.[0]}
      />

      <Input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Nomor telepon penerima"
        hint="Dipakai kurir untuk menghubungi bila perlu."
        autoComplete="tel"
        required
        maxLength={32}
        disabled={isDisabled}
        value={values.phone}
        onChange={(event) => update("phone", event.target.value)}
        error={shown.phone?.[0]}
      />

      <Input
        id="street"
        name="street"
        label="Alamat lengkap"
        hint="Nama jalan, nomor, dan patokan yang mudah ditemukan kurir."
        autoComplete="street-address"
        required
        maxLength={500}
        disabled={isDisabled}
        value={values.street}
        onChange={(event) => update("street", event.target.value)}
        error={shown.street?.[0]}
      />

      <DestinationPicker
        picked={values}
        error={regionError}
        disabled={isDisabled}
        onSelect={selectDestination}
      />

      <Input
        id="postal_code"
        name="postal_code"
        label="Kode pos"
        hint="Terisi otomatis dari wilayah yang dipilih. Boleh diubah."
        autoComplete="postal-code"
        inputMode="numeric"
        maxLength={10}
        disabled={isDisabled}
        value={values.postal_code ?? ""}
        onChange={(event) => update("postal_code", event.target.value || null)}
        error={shown.postal_code?.[0]}
      />

      <Textarea
        id="notes"
        name="notes"
        label="Catatan untuk kurir (opsional)"
        placeholder="Contoh: titip ke pos jaga di depan gerbang."
        maxLength={500}
        disabled={isDisabled}
        value={values.notes ?? ""}
        onChange={(event) => update("notes", event.target.value)}
        error={shown.notes?.[0]}
      />

      {errorCount > 0 ? (
        <p role="alert" className="text-body-sm font-semibold text-feedback-error">
          {errorCount} isian perlu diperbaiki sebelum ongkir dihitung.
        </p>
      ) : null}

      {/*
        Kegagalan quote ongkir tampil DI SINI — di langkah tempat pembeli
        menekan tombol. Sebelumnya blok ini hanya dirender di langkah 2,
        padahal `step` tidak pernah maju saat quote gagal: kegagalan hilang
        tanpa pesan. Warna/judul mengikuti sebabnya: alamat tidak dikenali
        kurir = merah, gangguan layanan = warn (bukan salah pembeli).
      */}
      {quoteError ? (
        <div
          role="alert"
          aria-atomic="true"
          className={
            quoteError.kind === "address"
              ? "rounded-md border border-feedback-error bg-feedback-error-soft/40 p-3"
              : "rounded-md border border-feedback-warn bg-surface-paper p-3"
          }
        >
          <p
            className={
              quoteError.kind === "address"
                ? "text-label-md font-semibold text-feedback-error"
                : "text-label-md font-semibold text-feedback-warn"
            }
          >
            {quoteError.kind === "address"
              ? "Alamat belum bisa diproses"
              : quoteError.kind === "rate-limit"
                ? "Terlalu banyak percobaan"
                : quoteError.kind === "auth"
                  ? "Sesi Anda berakhir"
                  : "Ongkir belum dapat dihitung"}
          </p>
          <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
            {quoteError.message}
            {quoteError.kind === "address"
              ? " Pilih satu hasil dari pencarian agar ongkir dihitung ke kecamatan yang benar."
              : ""}
            {quoteError.kind === "courier"
              ? " Ongkos tidak dikarang, jadi proses berhenti di sini sampai layanan kurir merespons."
              : ""}
          </p>
        </div>
      ) : null}

      {/*
        Tombol submit ada di dalam form, bukan di luar. Ini yang membuat
        tombol "Enter" pada kolom mana pun tetap submits the form — perilaku
        yang hilang kalau tombolnya dipindah keluar dari `<form>`.
      */}
      <button
        type="submit"
        disabled={isDisabled}
        className={buttonClass({ size: "lg", fullWidth: true, className: "mt-2" })}
      >
        {isPending
          ? "Menghitung ongkir…"
          : quoteError
            ? "Coba hitung ongkir lagi"
            : "Lanjut ke ongkir"}
      </button>

      {/*
        OD-05 masih DITUNDA, jadi pilihan "Ambil di Gerai" tidak pernah
        muncul di sini sampai kebijakan pemilik dikonfirmasi.
      */}
      <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
        Saat ini seluruh pesanan dikirim via kurir. Layanan pengambilan di
        gerai belum diaktifkan.
      </p>
    </form>
  );
}
