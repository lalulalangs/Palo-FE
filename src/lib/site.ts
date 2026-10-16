/**
 * Konfigurasi situs untuk SEO (PRD §4.4).
 *
 * `NEXT_PUBLIC_SITE_URL` dipakai sebagai `metadataBase`. Kalau env itu kosong
 * kita tetap harus menghasilkan URL absolut untuk `canonical`, `openGraph`,
 * dan `sitemap.xml` — tanpa `metadataBase`, Next akan throw saat build. Jadi
 * ada fallback eksplisit, bukan diam-diam memakai `localhost` tanpa catatan.
 */

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://palorinjani.com";

/** Tanpa garis miring di akhir supaya tidak jadi `//produk`. */
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

export const SITE_NAME = "Palo Mountain Goods";
export const SITE_LEGAL_NAME = "PALORINJANI";

/**
 * Deskripsi default.(copywriting brand disetujui?) belum dikonfirmasi, jadi
 * kalimat ini hanya menyatakan apa yang terverifikasi: brand merchandising
 * dari Senaru (PRD §1.1) — bukan klaim produk, harga, atau Warehouse mana pun.
 */
export const SITE_DESCRIPTION =
  "Palo Mountain Goods (PALORINJANI) — merchandise penjelajahan dari Senaru, kaki Gunung Rinjani, Lombok Utara. Dua jalur pemesanan: WhatsApp Customer Service atau pembayaran online dengan akun.";

export const SITE_OG_IMAGE = "/placeholder-brand.svg";

/** URL absolut dari path relatif. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Nama brand yang tampil di title tag. */
export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}
