import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type ShippingDestination,
} from "./types";

/**
 * Pembantu formulir checkout.
 *
 * Sengaja TIDAK memakai direktif `"use server"`: Next.js hanya mengizinkan
 * ekspor fungsi async dari module tersebut, sedangkan fungsi di bawah dipanggil
 * secara sinkron dari Client Component untuk validasi per field.
 */

export interface AddressInput {
  recipient_name: string;
  phone: string;
  street: string;
  /**
   * Subdistrict RajaOngkir hasil pemilih wilayah. Inilah satu-satunya nilai
   * yang dipakai kurir; `city`/`province` dst. hanya turunannya untuk kontrak
   * order dan ringkasan. `0` = belum ada wilayah terpilih.
   */
  destination_id: number;
  city: string;
  province: string;
  postal_code: string | null;
  district: string | null;
  subdistrict: string | null;
  notes: string | null;
}

export interface AddressFieldErrors {
  [field: string]: string[];
}

const VALID_PAYMENT_METHODS = new Set<string>(
  PAYMENT_METHODS.map((method) => method.value),
);

/** Hanya nilai yang boleh dikirim; sisanya ditolak backend dengan 422. */
export function isPaymentMethod(value: string): value is PaymentMethod {
  return VALID_PAYMENT_METHODS.has(value);
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

/**
 * Baca & validasi bentuk alamat pengiriman.
 *
 * Backend memvalidasi ulang di `StoreOrderRequest`, tapi pemeriksaan awal di
 * sini membuat pesan galat jauh lebih spesifik per field dan tidak membuang
 * roundtrip untuk isian yang jelas belum lengkap.
 */
export function readAddress(
  formData: FormData,
): { address: AddressInput } | { errors: AddressFieldErrors } {
  const address: AddressInput = {
    recipient_name: readText(formData, "recipient_name"),
    phone: readText(formData, "phone"),
    street: readText(formData, "street"),
    destination_id: Number(readText(formData, "destination_id")),
    city: readText(formData, "city"),
    province: readText(formData, "province"),
    postal_code: readOptionalText(formData, "postal_code"),
    district: readOptionalText(formData, "district"),
    subdistrict: readOptionalText(formData, "subdistrict"),
    notes: readOptionalText(formData, "notes"),
  };

  const errors: AddressFieldErrors = {};
  if (!address.recipient_name) {
    errors.recipient_name = ["Nama penerima wajib diisi."];
  }
  if (!address.phone) {
    errors.phone = ["Nomor telepon wajib diisi."];
  }
  if (!address.street) {
    errors.street = ["Alamat lengkap wajib diisi."];
  }
  if (!Number.isFinite(address.destination_id) || address.destination_id <= 0) {
    errors.destination_id = [
      "Pilih wilayah pengiriman dari daftar hasil pencarian.",
    ];
  }
  if (!address.city) {
    errors.city = ["Kota wajib diisi."];
  }
  if (!address.province) {
    errors.province = ["Provinsi wajib diisi."];
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { address };
}

/**
 * Nomor telepon Indonesia dinormalisasi ke format yang dipakai backend.
 *
 * Backend hanya mewajibkan `max:32` karakter, jadi bentuk apa pun akan lolos
 * validasi tapi bisa gagal saat dikirim ke layanan kurir. Normalisasi di sini
 * mengurangi pertanyaan balancer yang tidak perlu.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `0${digits.slice(1)}`;
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  return digits;
}

/**
 * Nama wilayah dari API kurir datang HURUF KAPITAL PENUH
 * ("CEMPAKA PUTIH BARAT"), yang jelek dibaca dan tidak boleh ditampilkan apa
 * adanya. `label` mentah juga tidak dipakai karena formatnya milik RajaOngkir.
 */
export function titleCase(value: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/(^|[^a-z])([a-z])/g, (_match, before: string, letter: string) =>
      `${before}${letter.toUpperCase()}`,
    );
}

/**
 * Kelima field wilayah diisi dari satu pilihan destinasi.
 *
 * `null` = pilihan dilepas ("Ganti wilayah"): `destination_id` kembali `0`
 * sehingga `readAddress` menolak submit sampai pembeli memilih lagi — tidak
 * ada fallback teks bebas, karena teks bebas adalah sumber ongkir salah.
 */
export function addressRegion(
  destination: ShippingDestination | null,
): Pick<
  AddressInput,
  | "destination_id"
  | "city"
  | "province"
  | "postal_code"
  | "district"
  | "subdistrict"
> {
  return {
    destination_id: destination?.id ?? 0,
    city: titleCase(destination?.city_name ?? null),
    province: titleCase(destination?.province_name ?? null),
    postal_code: destination?.zip_code?.trim() || null,
    district: titleCase(destination?.district_name ?? null) || null,
    subdistrict: titleCase(destination?.subdistrict_name ?? null) || null,
  };
}
