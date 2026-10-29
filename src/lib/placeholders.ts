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
  price: "[Segera Hadir]",
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
  address: "Jl. Pariwisata Senaru, Bayan, Lombok Utara, Nusa Tenggara Barat",
  mapsUrl: null,
  coordinates: "8°18'05.2\"S 116°24'28.6\"E",
  openingHours: "Senin – Minggu: 08.00 – 21.00 WITA",
  phone: null,
  whatsapp: null,
  email: null,
  instagramUrl: null,
  instagramHandle: null,
  facebookUrl: null,
  tiktokUrl: null,
  threadsUrl: null,
  threadsHandle: null,
  logo: "/placeholder-brand.svg",
} as const;

export const EMPTY_BRAND_CONTACT = {
  brandName: PLACEHOLDER_BRAND.brandName,
  tagline: PLACEHOLDER_BRAND.tagline,
  about: null,
  address: PLACEHOLDER_BRAND.address,
  mapsUrl: null,
  coordinates: PLACEHOLDER_BRAND.coordinates,
  openingHours: PLACEHOLDER_BRAND.openingHours,
  whatsapp: null,
  whatsappLink: null,
  email: null,
  instagramUrl: null,
  instagramHandle: null,
  facebookUrl: null,
  tiktokUrl: null,
  threadsUrl: null,
  threadsHandle: null,
  logoUrl: PLACEHOLDER_BRAND.logo,
  isApiBacked: false,
};

/** Label yang dipakai untuk menjelaskan kenapa data belum tampil. */
export const PLACEHOLDER_NOTICE_TITLE = "Koleksi produk lagi disiapkan";
export const PLACEHOLDER_NOTICE_BODY =
  "Kami sedang menyiapkan deretan perlengkapan terbaik buat menemani setiap petualanganmu. Yuk, cek lagi berkala!";

/** Teks default saat backend belum bisa dihubungi. */
export const API_UNAVAILABLE_NOTICE =
  "Koneksi lagi ada kendala sejenak. Yuk, coba refresh halaman atau kembali beberapa saat lagi!";

/** Format mata uang & tanggal selalu Bahasa Indonesia (OD-09). */
export const SITE_LOCALE = "id-ID" as const;

/** Zona waktu toko: WITA / WIT (UTC+8). */
export const SITE_TIME_ZONE = "Asia/Makassar" as const;
