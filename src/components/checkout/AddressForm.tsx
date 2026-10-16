"use client";

import { useState } from "react";

import { Input, Textarea } from "@/components/ui/Input";
import { buttonClass } from "@/components/ui/Button";
import {
  readAddress,
  type AddressFieldErrors,
  type AddressInput,
} from "@/lib/checkout-form";

export type AddressSubmitResult =
  | { ok: true; address: AddressInput }
  | { ok: false; errors: AddressFieldErrors };

/**
 * Formulir alamat pengiriman.
 *
 * Kenapa satu langkah penuh, bukan pemilih dari daftar alamat tersimpan:
 * `routes/api.php` belum punya endpoint CRUD alamat, jadi tidak ada daftar
 * alamat yang bisa diambil dari server. Menampilkannya sebagai pilihan
 * berarti mengarang data. Formulir ini mengirim objek `shipping_address`
 * lengkap, yang memang bentuk yang diminta `StoreOrderRequest`.
 *
 * Yang penting: `city_code`. Backend mewajibkannya karena layanan kurir
 * menghitung ongkir dari kode kota, bukan dari teks kota bebas. Mockup lama
 * hanya menanyakan "Kota Tujuan" sebagai teks, yang selalu ditolak validasi
 * atau, lebih buruk, menghasilkan ongkir yang keliru.
 */
export function AddressForm({
  defaults,
  errors,
  disabled = false,
  isPending = false,
  onSubmit,
}: {
  defaults: AddressInput;
  errors: AddressFieldErrors;
  disabled?: boolean;
  isPending?: boolean;
  /** Dipanggil dengan hasil validasi. Tidak melempar exception. */
  onSubmit: (result: AddressSubmitResult) => void;
}) {
  const [values, setValues] = useState<AddressInput>(defaults);

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

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
        error={errors.recipient_name?.[0]}
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
        error={errors.phone?.[0]}
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
        error={errors.street?.[0]}
      />

      <div className="grid gap-4 tablet:grid-cols-3">
        <Input
          id="district"
          name="district"
          label="Kecamatan"
          autoComplete="address-level3"
          maxLength={100}
          disabled={isDisabled}
          value={values.district ?? ""}
          onChange={(event) => update("district", event.target.value)}
          error={errors.district?.[0]}
        />
        <Input
          id="city"
          name="city"
          label="Kota / Kabupaten"
          autoComplete="address-level2"
          required
          maxLength={100}
          disabled={isDisabled}
          value={values.city}
          onChange={(event) => update("city", event.target.value)}
          error={errors.city?.[0]}
        />
        <Input
          id="province"
          name="province"
          label="Provinsi"
          autoComplete="address-level1"
          required
          maxLength={100}
          disabled={isDisabled}
          value={values.province}
          onChange={(event) => update("province", event.target.value)}
          error={errors.province?.[0]}
        />
      </div>

      <div className="grid gap-4 tablet:grid-cols-2">
        {/*
          `city_code` berupa input teks, bukan daftar dropdown, karena
          `routes/api.php` tidak menyediakan endpoint daftar kota/kabupaten.
          Menampilkan daftar karangan berisiko menghasilkan ongkos yang salah;
          teks bebas membiarkan pengguna mengikuti kode dari dokumen resmi
          kurir, dan backend tetap memvalidasinya.
        */}
        <Input
          id="city_code"
          name="city_code"
          label="Kode kota untuk kurir"
          hint="Kode wilayah yang dipakai layanan kurir. Hubungi Customer Service bila belum tahu kode kota Anda."
          required
          maxLength={20}
          disabled={isDisabled}
          value={values.city_code}
          onChange={(event) => update("city_code", event.target.value)}
          error={errors.city_code?.[0]}
        />
        <Input
          id="postal_code"
          name="postal_code"
          label="Kode pos (opsional)"
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={10}
          disabled={isDisabled}
          value={values.postal_code ?? ""}
          onChange={(event) => update("postal_code", event.target.value)}
          error={errors.postal_code?.[0]}
        />
      </div>

      <Textarea
        id="notes"
        name="notes"
        label="Catatan untuk kurir (opsional)"
        placeholder="Contoh: titip ke pos jaga di depan gerbang."
        maxLength={500}
        disabled={isDisabled}
        value={values.notes ?? ""}
        onChange={(event) => update("notes", event.target.value)}
        error={errors.notes?.[0]}
      />

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
        {isPending ? "Menghitung ongkir…" : "Lanjut ke ongkir"}
      </button>

      {/*
        OD-05 masih DITUNDA, jadi pilihan "Ambil di Gerai" tidak pernah
        muncul di sini sampai kebijakan pemilik dikonfirmasi.
      */}
      <p className="mt-3 text-caption leading-relaxed text-text-secondary">
        Saat ini seluruh pesanan dikirim via kurir. Layanan pengambilan di
        gerai belum diaktifkan.
      </p>
    </form>
  );
}
