/**
 * Konstanta & tipe bersama untuk Server Action storefront.
 *
 * ===================================================================
 *  KENAPA FILE INI DIPISAH DARI `actions/storefront.ts`
 * ===================================================================
 * Aturan Next.js: pada file ber-direktif `"use server"`, **hanya async
 * function yang boleh diekspor**. Ekspor apa pun yang lain — `const`,
 * `interface`, `type`, class — membuat build gagal dengan:
 *
 *   "Only async functions are allowed to be exported in a 'use server' file"
 *
 * Error itu nyata terjadi di sini: `GUEST_RESULT_COOKIE` dan
 * `GuestResultHandoff` tadinya diekspor dari file `"use server"`, sehingga
 * SELURUH halaman ikut 500 — termasuk beranda yang sebenarnya tidak
 * bergantung pada kode tersebut.
 *
 * Solusinya: pindahkan konstanta & tipe ke file biasa (tanpa direktif), lalu
 * import dari `actions/storefront.ts`. Nilai dan tipenya tetap satu sumber
 * kebenaran; yang berubah hanya tempat jejarnya.
 */

/**
 * Cookie serah-terima untuk halaman hasil guest WhatsApp.
 *
 * Ini bukan sesi: hanya carry-over singkat dari Server Action ke
 * `/keranjang/sukses`, jadi umurnya pendek (10 menit) dan `httpOnly` supaya
 * `wa_url` tidak bisa dibaca skrip pihak ketiga di halaman. Nama cookie
 * sengaja berbeda dari `AUTH_TOKEN_COOKIE` agar tidak tertukar saat logout.
 */
export const GUEST_RESULT_COOKIE = "pmg_guest_wa_result";

/**
 * Umur cookie serah-terima dalam detik (10 menit).
 *
 * Cukup untuk user menyelesaikan satu langkah, cukup pendek supaya `wa_url`
 * tidak menggantung lama di browser.
 */
export const GUEST_RESULT_TTL_SECONDS = 600;

/**
 * Batas aman sebelum cookie melewati 4 KB per browser.
 *
 * Kalau payload ternyata melebihi batas ini, `wa_url` dipangkas dari
 * belakang. Kode referensi dan notice tetap dijaga utuh karena keduanya yang
 * wajib tampil apa adanya.
 */
export const MAX_HANDOFF_BYTES = 3000;

/**
 * Bentuk yang disimpan di cookie serah-terima.
 *
 * `message` sengaja TIDAK ikut: isinya sudah tertanam di `wa_url` (pesan
 * WhatsApp), dan mengikutinya akan membuat cookie cepat melewati batas 4 KB
 * untuk keranjang yang panjang.
 */
export interface GuestResultHandoff {
  reference_code: string;
  wa_url: string;
  notice: string;
  estimated_total: number;
  estimated_total_display: string | null;
}
