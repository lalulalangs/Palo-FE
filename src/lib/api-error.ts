/**
 * Kesalahan dari API backend — TANPA dependensi server.
 *
 * ===================================================================
 *  KENAPA FILE INI DIPISAH DARI `api.ts`
 * ===================================================================
 * `api.ts` meng-import `cookies()` dari `next/headers`, yang HANYA boleh dipakai
 * di Server Component. Begitu modul itu ikut terbawa ke bundel Client
 * Component, Next.js menolak dengan:
 *
 *   "You're importing a module that depends on 'next/headers'. This API is
 *    only available in Server Components in the App Router, but you are using
 *    it in the Pages Router."
 *
 * Rantainya bermula dari komponen form yang butuh `ActionError`:
 *
 *   AuthForm.tsx ("use client")
 *     -> lib/action-result.ts
 *       -> lib/api.ts        <-- akarnya di sini
 *         -> next/headers     <-- tidak boleh di client
 *
 * Karena itu `ApiError` dipindah ke sini. Modul ini murni data & kelas
 * JavaScript, aman dipakai di server maupun client.
 *
 * `api.ts` tetap meng-export `ApiError` (re-export) supaya semua pemanggil
 * yang sudah ada tidak perlu diubah.
 */

/**
 * Satu baris perubahan harga dari backend (`PriceChangedException`).
 *
 * Bentuknya mengikuti `changes[]` pada respons 409 `price_changed`.
 */
export interface PriceChange {
  sku_id: number;
  sku_code: string;
  product_name: string;
  old_price: number;
  new_price: number;
  quantity: number;
}

/**
 * Detail tambahan dari body error backend.
 *
 * `error_code` adalah penanda mesin (`price_changed`, `stock_unavailable`),
 * jadi deteksi jenis kegagalan TIDAK lagi bergantung pada teks pesan — pesan
 * backend bisa berubah, dan pencocokan substring seperti "Harga berubah" sudah
 * terbukti gagal terhadap pesan asli
 * "Harga produk berubah sejak keranjang dibuka. …".
 */
export interface ApiErrorOptions {
  errorCode?: string | null;
  priceChanges?: PriceChange[];
  newGrandTotal?: number | null;
}

/**
 * Kesalahan yang dikembalikan backend.
 *
 * Kontrak error mengikuti `docs/KONTRAK-API.md`:
 *   { "message": "...", "errors": { "field": ["alasan"] } }
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  readonly errorCode: string | null;
  readonly priceChanges: PriceChange[];
  readonly newGrandTotal: number | null;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    options: ApiErrorOptions = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.errorCode = options.errorCode ?? null;
    this.priceChanges = options.priceChanges ?? [];
    this.newGrandTotal = options.newGrandTotal ?? null;
  }

  /**
   * PRD §3.6: backend wajib mengembalikan 409 "Harga berubah" dengan daftar
   * perubahan supaya buyer bisa mengonfirmasi harga baru sebelum lanjut.
   *
   * Dideteksi dari `error_code`, bukan dari teks pesan.
   */
  get isPriceChanged(): boolean {
    return this.status === 409 && this.errorCode === "price_changed";
  }

  /**
   * PRD §3.8 AC: 503 dari kurir WAJIB memblokir lanjut ke pembayaran.
   *
   * Penting: frontend TIDAK BOLEH menampilkan ongkir default saat menerima
   * status ini — itu Persis yang dilarang PRD §3.8.
   */
  get isCourierUnavailable(): boolean {
    return this.status === 503;
  }

  /**
   * Stok tidak cukup (409). Ini kondisi NORMAL di e-commerce, bukan error —
   * buyer perlu diberi tahu jumlah yang masih tersedia.
   *
   * 409 `price_changed` BUKAN stok, jadi dikecualikan.
   */
  get isStockConflict(): boolean {
    return this.status === 409 && this.errorCode !== "price_changed";
  }
}
