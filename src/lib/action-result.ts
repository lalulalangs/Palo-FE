// WAJIB dari `@/lib/api-error`, BUKAN `@/lib/api`:
// `api.ts` meng-import `next/headers` yang hanya boleh dipakai di Server
// Component, dan modul ini ikut terpakai di form Client Component.
import { ApiError, type PriceChange } from "@/lib/api-error";

/**
 * Bentuk hasil Server Action.
 *
 * Dipisah dari file ber-direktif `"use server"` karena Next.js hanya mengizinkan
 * ekspor fungsi async dari module itu; interface dan helper sinkron harus
 * tinggal di module biasa.
 */

export interface ActionError {
  ok: false;
  /** Pesan utama dari backend — selalu Bahasa Indonesia (KONTRAK-API). */
  message: string;
  /** Error per field, kalau backend mengirim objek `errors`. */
  fieldErrors: Record<string, string[]>;
  /**
   * Penanda supaya UI bereaksi spesifik terhadap penyebab, bukan
   * menampilkan teks generik untuk semua kegagalan.
   */
  kind:
    | "validation"
    | "auth"
    | "rate-limit"
    | "stock"
    | "courier"
    | "price-changed"
    | "voucher"
    /** Tujuan ongkir tidak dikenali kurir (`shipping_destination_not_found`). */
    | "address"
    | "network"
    | "unknown";
  /**
   * Daftar perubahan harga dari backend, hanya diisi untuk
   * `kind: "price-changed"`. UI menampilkannya apa adanya supaya pembeli bisa
   * membandingkan harga lama dan baru sebelum menyetujui.
   */
  priceChanges?: PriceChange[];
  /** Total baru setelah perubahan harga, hanya untuk `kind: "price-changed"`. */
  newGrandTotal?: number | null;
}

export interface ActionOk<T> {
  ok: true;
  data: T;
}

export type ActionResult<T> = ActionOk<T> | ActionError;

export function isActionError(value: unknown): value is ActionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === false
  );
}

const NETWORK_MESSAGE =
  "Layanan sedang tidak dapat dihubungi. Silakan coba lagi sebentar.";

/**
 * Kunci `fieldErrors` yang menandakan kegagalan voucher.
 *
 * Dulu SEMUA 422 dipetakan ke `kind: "voucher"`, sehingga alamat/berat/kurir
 * tampil sebagai "Voucher tidak dapat dipakai" dan chip voucher yang sah ikut
 * dilepas. Urutan pemeriksaan: penanda mesin dulu, baru kunci field.
 */
const VOUCHER_FIELD_KEYS = ["code", "voucher_code"];

function classificationFor422(error: ApiError): ActionError["kind"] {
  if (error.errorCode === "shipping_destination_not_found") return "address";

  const touchesVoucher = VOUCHER_FIELD_KEYS.some(
    (key) => (error.fieldErrors[key]?.length ?? 0) > 0,
  );
  if (touchesVoucher) return "voucher";

  return "validation";
}

/**
 * Petakan `ApiError` ke bentuk yang bisa ditampilkan.
 *
 * Pemetaan `status` → `kind` mengikuti tabel error di `KONTRAK-API.md` §3 dan
 * §6 supaya frontend bisa membedakan secara eksplisit:
 * - 503 → kurir bermasalah → WAJIB memblokir lanjut ke pembayaran (PRD §3.8 AC)
 * - 409 → stok habis / harga berubah → tawarkan muat ulang keranjang
 * - 422 → lihat `classificationFor422`: penanda mesin dulu (`error_code`),
 *   baru kunci `fieldErrors`. 422 TIDAK otomatis berarti voucher.
 * - 429 → rate limit → tampilkan jedanya, jangan auto-retry
 */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ApiError) {
    if (error.isCourierUnavailable) {
      return {
        ok: false,
        kind: "courier",
        message:
          error.message ||
          "Layanan kurir sedang bermasalah. Checkout diblokir sampai ongkir dapat dihitung ulang.",
        fieldErrors: {},
      };
    }

    if (error.isPriceChanged) {
      return {
        ok: false,
        kind: "price-changed",
        message: error.message,
        fieldErrors: {},
        priceChanges: error.priceChanges,
        newGrandTotal: error.newGrandTotal,
      };
    }

    if (error.status === 409) {
      // 409 saat checkout = stok habis karena race condition. Ini kondisi
      // normal dalam e-commerce, bukan server error: solusinya adalah
      // memuat ulang keranjang, bukan menampilkan halaman kosong.
      return {
        ok: false,
        kind: "stock",
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }

    if (error.status === 422) {
      return {
        ok: false,
        kind: classificationFor422(error),
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }

    if (error.status === 429) {
      // Pesan 429 dari Laravel berbahasa Inggris ("Too Many Attempts."), dan
      // itu yang dulu tampil apa adanya ke pembeli. Copy Indonesia dipakai
      // selalu; jendela throttle bergeser, jadi hitungan mundur diklaim.
      return {
        ok: false,
        kind: "rate-limit",
        message:
          "Terlalu banyak percobaan dalam waktu singkat. Tunggu sekitar satu menit, lalu coba lagi.",
        fieldErrors: {},
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        ok: false,
        kind: "auth",
        message: error.message,
        fieldErrors: {},
      };
    }

    if (error.status === 400) {
      return {
        ok: false,
        kind: "validation",
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }

    if (error.status === 0) {
      return {
        ok: false,
        kind: "network",
        message: error.message || NETWORK_MESSAGE,
        fieldErrors: {},
      };
    }

    return {
      ok: false,
      kind: "unknown",
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  return {
    ok: false,
    kind: "unknown",
    message: "Permintaan gagal diproses. Silakan coba lagi.",
    fieldErrors: {},
  };
}

/** Ambil pesan pertama untuk sebuah field, atau `null`. */
export function fieldError(
  error: ActionError | null,
  field: string,
): string | null {
  if (!error) return null;
  const messages = error.fieldErrors[field];
  return messages && messages.length > 0 ? messages[0] : null;
}
