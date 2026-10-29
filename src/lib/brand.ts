import { PLACEHOLDER_BRAND } from "./placeholders";
import { toWhatsAppNumber } from "./format";
import type { BrandInfo } from "./types";

/**
 * Penggabungan data brand dari API dengan placeholder jujur.
 *
 * PRD §3.11: nomor WhatsApp CS, alamat, jam buka, dan Instagram semuanya
 * datang dari `app_settings` lewat `GET /brand` — BUKAN hardcode. Tapi
 * `app_settings` belum diisi di MVP, jadi setiap aksesor di sini mengembalikan
 * nilai yang benar-benar dikirim API bila ada, dan placeholder yang jujur bila
 * tidak. Tidak pernah ada nomor telepon atau handle Instagram di repo ini.
 *
 * Catatan OD-05: `openingHours` sengaja hanya menampilkan nilai dari backend.
 * Mockup lama punya LIMA versi jam yang saling berbeda; system_map §4.1.4
 * melarang mengaktifkannya sebelum kebijakan pemilik dikonfirmasi.
 */
export interface ResolvedBrand {
  brandName: string;
  tagline: string;
  about: string | null;
  address: string;
  /** `null` selama admin belum mengisi — jangan render tautan Maps. */
  mapsUrl: string | null;
  coordinates: string;
  /** Nilai dari backend, atau catatan menunggu konfirmasi. */
  openingHours: string;
  whatsapp: string | null;
  /** Nomor ternormalisasi untuk `wa.me`, `null` bila tidak ada. */
  whatsappLink: string | null;
  email: string | null;
  /** Semua `null` berarti admin belum mengisi — ikon di footer disembunyikan. */
  instagramUrl: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  threadsUrl: string | null;
  threadsHandle: string | null;
  logoUrl: string;
  /** `true` kalau API menyediakannya — dipakai untuk catatan "belum diisi". */
  isApiBacked: boolean;
}

export function resolveBrand(brand: BrandInfo | null): ResolvedBrand {
  const whatsapp = brand?.whatsapp_cs ?? null;

  return {
    brandName: brand?.brand_name ?? PLACEHOLDER_BRAND.brandName,
    tagline: brand?.tagline ?? PLACEHOLDER_BRAND.tagline,
    about: brand?.about ?? null,
    address: brand?.store_address ?? PLACEHOLDER_BRAND.address,
    mapsUrl: brand?.store_maps_url ?? null,
    coordinates: brand?.store_coordinates ?? PLACEHOLDER_BRAND.coordinates,
    openingHours:
      brand?.store_opening_hours ?? PLACEHOLDER_BRAND.openingHours,
    whatsapp,
    whatsappLink: toWhatsAppNumber(whatsapp),
    email: brand?.email ?? null,
    instagramUrl: brand?.instagram_url ?? null,
    instagramHandle: brand?.instagram_handle ?? null,
    facebookUrl: brand?.facebook_url ?? null,
    tiktokUrl: brand?.tiktok_url ?? null,
    threadsUrl: brand?.threads_url ?? null,
    threadsHandle: brand?.threads_handle ?? null,
    logoUrl: brand?.logo_url ?? PLACEHOLDER_BRAND.logo,
    isApiBacked: brand !== null,
  };
}

export type BrandContact = ResolvedBrand;
export const resolveBrandContact = resolveBrand;

/** `https://wa.me/<nomor>?text=<pesan>` dengan pesan ter-encode. */
export function whatsappLink(brand: ResolvedBrand, message: string): string | null {
  if (!brand.whatsappLink) return null;
  return `https://wa.me/${brand.whatsappLink}?text=${encodeURIComponent(message)}`;
}
