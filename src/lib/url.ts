/**
 * Pemeriksaan tautan yang berasal dari panel admin.
 *
 * ===================================================================
 *  KENAPA INI PERLU
 * ===================================================================
 * Nilai seperti `brand.facebook_url` diketik bebas oleh admin, lalu dipakai
 * langsung sebagai `href`. Tanpa pemeriksaan, admin (atau siapa pun yang
 * berhasil masuk ke panel) bisa menyimpan `javascript:alert(document.cookie)`
 * dan ikon footer berubah jadi pembawa skrip yang dieksekusi setiap kali
 * pengunjung mengekliknya.
 *
 * Itu bukan masalah teoretis: `javascript:` adalah skema yang sah secara
 * sintaks, jadi validasi "apakah ini URL" saja tidak menyaringnya.
 *
 * ===================================================================
 *  ATURANNYA
 * ===================================================================
 * Hanya `http:` dan `https:` yang diizinkan.
 *
 * - `http:`/`https:` — semua tautan sosial media yang nyata.
 * - `javascript:`, `data:`, `vbscript:` — ditolak. Tidak pernah dipakai untuk
 *   link sosial media yang sah.
 * - Tanpa skema (`//contoh.com`) — ditolak. Tanpa skema, `href` akan
 *   ditafsirkan browser sebagai path relatif terhadap toko, sehingga
 *   `//contoh.com` diam-diam menjadi tautan KE TOKO, bukan ke situs lain.
 *
 * Nilai dikembalikan apa adanya bila aman, dan `null` bila tidak — supaya
 * pemanggil bisa memakai `null` sebagai alasan menyembunyikan ikon.
 */

/** Skema yang boleh muncul di tautan luar. */
const SKEMA_BOLOEH = new Set(["http:", "https:"]);

/**
 * Ubah input mentah dari API menjadi URL yang aman untuk `href`.
 *
 * Mengembalikan `null` bila input kosong atau skemanya tidak diizinkan.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  const nilai = raw.trim();
  if (nilai === "") return null;

  let url: URL;
  try {
    url = new URL(nilai);
  } catch {
    // Tidak bisa di-parse sebagai URL absolut → jangan dipakai.
    // Sengaja mengembalikan `null`, bukan `nilai`: string mentah yang gagal
    // di-parse akan dianggap browser sebagai path relatif, dan itu hampir
    // selalu tidak pernah diinginkan untuk tautan kanal brand.
    return null;
  }

  if (!SKEMA_BOLOEH.has(url.protocol)) return null;

  return url.toString();
}

/**
 * Ambil URL halaman pembayaran dari respons pembuatan pesanan (`POST
 * /checkout/orders`).
 *
 * Backend mengirim `payment_url` di dua tempat — level `payment` dan di dalam
 * `payment.instructions` (salinan `payments.raw_response`) — jadi keduanya
 * diterima. Nilainya datang dari gateway lewat backend kita, tapi ini tetap
 * data dari luar yang akan dipakai sebagai tujuan navigasi: skema selain
 * `http:`/`https:` ditolak dengan aturan yang sama seperti tautan admin.
 */
export interface PaymentUrlSource {
  payment_url?: string | null;
  payment?: {
    payment_url?: string | null;
    instructions?: { payment_url?: string | null } | null;
  } | null;
}

export function paymentRedirectUrl(source: PaymentUrlSource): string | null {
  const candidate =
    source.payment_url ??
    source.payment?.payment_url ??
    source.payment?.instructions?.payment_url ??
    null;

  return safeExternalUrl(candidate);
}
