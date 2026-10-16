/**
 * Placeholder jujur untuk data yang belum diverifikasi pemilik brand.
 *
 * PRD §1.1A: "Daftar SKU, jenis barang spesifik (misalnya kaos, topi, tas),
 * harga, varian, stok, dan bahan belum dapat dipastikan dari sumber publik
 * yang terakses. Jangan mengisi seed katalog atau klaim jenis produk tertentu
 * tanpa katalog dari pemilik."
 *
 * PRD §6A kriteria penerimaan: "Tidak ada produk contoh yang dipublikasikan
 * sebelum admin mengisi data asli."
 *
 * ARSITEKTUR §4 butir 2: UI menampilkan placeholder jujur saat data belum ada.
 * Karena itu TIDAK ADA konstanta nama produk atau harga fiktif di repo ini —
 * nilai yang tampil apa adanya, apa yang dikembalikan API.
 */

// PRD §1.1A & §6A — katalog belum terverifikasi dari sumber publik, jadi
// jangan pernah mengarang produk. Nilai ini yang ditampilkan sampai admin
// mengisi data asli.
export const PLACEHOLDER = {
  productName: "[Nama Produk]",
  price: "[Harga dari Admin]",
  collection: "[Nama Koleksi]",
  sku: "[SKU]",
  image: "/placeholder-product.svg",
} as const;

/**
 * Placeholder untuk data brand/toko yang juga berasal dari `app_settings`.
 * Mockup lama menulis nomor telepon, alamat, dan jam buka secara hardcode
 * (ODS-05 masih `DITUNDA`: jam operasional & pickup belum diputuskan), lalu
 * menampilkan 5 versi jam yang saling berbeda. Semua itu dihapus; di sini
 * nilai yang belum diisi ditandai apa adanya sebagai belum tersedia.
 */
export const PLACEHOLDER_BRAND = {
  brandName: "Palo Mountain Goods",
  legalName: "PALORINJANI",
  tagline: "Merchandise penjelajahan dari Senaru, kaki Gunung Rinjani.",
  address: "[Alamat Toko dari Admin]",
  mapsUrl: null,
  coordinates: "[Koordinat dari Admin]",
  openingHours: "[Jam Operasional Menunggu Konfirmasi Pemilik]",
  phone: null,
  whatsapp: null,
  email: "[Email resmi dari Admin]",
  instagramUrl: null,
  instagramHandle: null,
  logo: "/placeholder-brand.svg",
} as const;

/** Label yang dipakai untuk menjelaskan kenapa data belum tampil. */
export const PLACEHOLDER_NOTICE_TITLE = "Katalog belum diterbitkan";
export const PLACEHOLDER_NOTICE_BODY =
  "PRD §1.1A dan §6A melarang memuat contoh produk sebelum pemilik brand mengonfirmasi katalog asli. Halaman ini sengaja menampilkan nilai placeholder apa adanya, bukan produk contoh.";

/** Teks default saat backend belum bisa dihubungi. */
export const API_UNAVAILABLE_NOTICE =
  "Data katalog belum dapat dimuat dari server. Halaman ini menampilkan nilai placeholder apa adanya, bukan data fiktif.";

/** Format mata uang & tanggal selalu Bahasa Indonesia (OD-09). */
export const SITE_LOCALE = "id-ID" as const;

/** Zona waktu toko: WITA / WIT (UTC+8). */
export const SITE_TIME_ZONE = "Asia/Makassar" as const;
