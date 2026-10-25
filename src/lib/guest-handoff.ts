import type { ActionError } from "@/lib/action-result";

/**
 * Bentuk & hasil checkout tamu via WhatsApp.
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
 * Jadi tipe bersama tinggal di sini (file biasa, tanpa direktif), lalu
 * diimpor dari sisi action maupun komponen.
 *
 * ===================================================================
 *  KENAPA HASILNYA DIKEMBALIKAN, BUKAN DIOPER LEWAT COOKIE
 * ===================================================================
 * Versi sebelumnya menyimpan hasil di cookie `pmg_guest_wa_result` bertaut
 * `path=/keranjang/sukses`, lalu `redirect()`. Dua kegagalan produksi lahir
 * dari rangkaian itu:
 *
 * 1. Cookie dihapus di dalam render halaman hasil → Next melempar
 *    "Cookies can only be modified in a Server Action or Route Handler",
 *    dan seluruh halaman menjadi error boundary.
 * 2. Setelah penghapusan itu dibereskan, browser tetap tidak pernah menerima
 *    cookienya — bukan soal ukuran (payload terukur hanya ~766 byte setelah
 *    `encodeURIComponent`), sehingga halaman hasil selalu berkata "belum ada
 *    pesan" padahal API sukses.
 *
 * Hasil sekarang dikembalikan langsung oleh Server Action ke form yang
 * mengirimnya. Tidak ada cookie, tidak ada redirect, tidak ada halaman
 * perantara — satu kelas kegagalan hilang seluruhnya.
 */

/** Data yang perlu ditampilkan setelah pesan WhatsApp siap dibuka. */
export interface GuestResultHandoff {
  reference_code: string;
  /** Nomor pesanan `PLR-...`; `null` bila backend tidak mengirimnya. */
  order_number: string | null;
  wa_url: string;
  /** Kalimat dari backend; wajib ditampilkan apa adanya. */
  notice: string;
  estimated_total: number;
  estimated_total_display: string | null;
}

/** Aksi berhasil: pesan WhatsApp siap dibuka. */
export interface GuestCheckoutSuccess {
  ok: true;
  handoff: GuestResultHandoff;
}

/** Keadaan form: belum submit, sukses, atau galat. */
export type GuestCheckoutActionState = GuestCheckoutSuccess | ActionError;
