/**
 * Kontrak URL aset media.
 *
 * ===================================================================
 *  MENGAPA ADA MODUL INI
 * ===================================================================
 * API mengembalikan media sebagai PATH RELATIF (`products/produk-01-433.webp`),
 * bukan URL absolut. Itu pilihan yang benar di sisi backend:
 *
 *   - Bucket/CDN bisa diganti tanpa memperbarui satu baris database
 *     (PRD §3.2: media di-serve dari Object Storage).
 *   - Tidak membocorkan struktur internal storage ke publik.
 *
 * Tapi frontend tidak boleh menempelkan `products/...` langsung ke `<img>`,
 * karena itu akan meminta `/products/...` dari origin Next.js — 404. URL harus
 * DIRANGKAI di satu tempat supaya tidak ada tebakan path di tiap komponen.
 *
 * ===================================================================
 *  DEV vs PRODUKSI
 * ===================================================================
 * Di pengembangan, Laravel menyajikan media lewat symlink
 * `public/storage -> storage/app/public` pada port 8080, sementara frontend
 * berjalan di port 3000. Jadi base URL-nya harus menunjuk backend.
 *
 * Di produksi, storefront dan backend berada di domain yang sama dan
 * `/storage` disajikan lewat web server (atau CDN). Cukup ubah
 * `NEXT_PUBLIC_MEDIA_BASE_URL` — tidak ada kode yang perlu disentuh.
 */

/** Base URL tempat media disajikan. Kosong = same-origin. */
const RAW_MEDIA_BASE = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

/** Awalan path yang dihitung Laravel untuk symlink `public/storage`. */
const STORAGE_PREFIX = "/storage/media";

/**
 * Rangkai path media dari backend menjadi URL yang bisa dimuat.
 *
 * Mengembalikan `null` bila path kosong — pemanggil sebaiknya memakai
 * placeholder, bukan URL yang berisi string kosong.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Sudah berupa URL absolut (mis. dari CDN produksi) — jangan diubah.
  if (/^https?:\/\//i.test(path)) return path;

  return `${RAW_MEDIA_BASE}${STORAGE_PREFIX}/${path.replace(/^\/+/, "")}`;
}

/**
 * Base URL untuk `next.config.ts` → `images.remotePatterns`.
 *
 * `next/image` menolak memuat gambar dari origin yang tidak diizinkan, dan
 * error itu muncul sebagai gambar rusak tanpa pesan jelas di log.
 */
export const MEDIA_ORIGIN = RAW_MEDIA_BASE;

/**
 * Path gambar untuk aset lokal (logo, aset statis di `public/`).
 *
 * Berbeda dengan `mediaUrl()`: berkas di sini disajikan langsung oleh
 * Next.js dari `public/`, jadi TIDAK lewat backend.
 */
export const LOCAL_ASSET = {
  logo: "/img/logo-150.webp",
} as const;
