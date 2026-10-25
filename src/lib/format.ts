import { PLACEHOLDER, SITE_LOCALE, SITE_TIME_ZONE } from "./placeholders";

/**
 * Format tampilan.
 *
 * Why: KONTRAK-API mewajibkan harga selalu integer rupiah di kabel
 * ("TIDAK pernah string berkoma"). Jadi semua konversi ke string "Rp 1.234"
 * hanya boleh terjadi di lapisan tampilan, dan tidak boleh masuk ke nilai
 * yang dikirim balik ke API (PRD §3.12: jangan percaya client, backend
 * revalidasi harga).
 */

const rupiahFormatter = new Intl.NumberFormat(SITE_LOCALE, {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(SITE_LOCALE, {
  maximumFractionDigits: 0,
});

const tanggalFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: SITE_TIME_ZONE,
});

const tanggalPendekFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: SITE_TIME_ZONE,
});

const waktuFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: SITE_TIME_ZONE,
});

/** `250000` -> `"Rp 250.000"`. */
export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return rupiahFormatter.format(0);
  return rupiahFormatter.format(value);
}

/**
 * Pilih nilai yang benar untuk ditampilkan.
 *
 * KONTRAK-API: sebelum admin mengisi data asli, `price_display` berisi
 * `"[Harga dari Admin]"`. PRD §1.1A melarang kita membuat fallback harga
 * fiktif — jadi kalau `display` terisi, ITU yang ditampilkan, walaupun
 * angka `0` ada di sampingnya. Mengembalikan angka 0 sebagai "Rp 0" akan
 * mengarang harga yang tidak ada.
 */
export function formatHarga(
  amount: number,
  display: string | null | undefined,
): string {
  if (display && display.trim().length > 0) return display.trim();
  return formatRupiah(amount);
}

export function formatAngka(value: number): string {
  if (!Number.isFinite(value)) return numberFormatter.format(0);
  return numberFormatter.format(value);
}

/**
 * Harga satu baris item pesanan.
 *
 * `OrderItemResource` hanya mengirim angka (`unit_price`, `subtotal`) tanpa
 * pasangan `*_display`, padahal KONTRAK-API menetapkan `*_display` sebagai
 * penanda nilai placeholder. Karena itu `0` tidak boleh dirender sebagai
 * "Rp 0": pada katalog yang belum diisi admin, `0` berarti "harga belum
 * ada", bukan "gratis". Menampilkan placeholder jujur di sini memenuhi
 * PRD §1.1A.
 */
export function formatBarisPesanan(subtotal: number): string {
  if (!Number.isFinite(subtotal) || subtotal === 0) return PLACEHOLDER.price;
  return rupiahFormatter.format(subtotal);
}

/** ISO-8601 UTC -> tanggal panjang Bahasa Indonesia dalam waktu WITA. */
export function formatTanggal(iso: string | null | undefined): string {
  const date = parseIso(iso);
  if (!date) return "—";
  return tanggalFormatter.format(date);
}

export function formatTanggalPendek(iso: string | null | undefined): string {
  const date = parseIso(iso);
  if (!date) return "—";
  return tanggalPendekFormatter.format(date);
}

export function formatWaktu(iso: string | null | undefined): string {
  const date = parseIso(iso);
  if (!date) return "—";
  return `${waktuFormatter.format(date)} WITA`;
}

/** Tanggal + waktu, dipakai di linimasa status pesanan. */
export function formatTanggalWaktu(iso: string | null | undefined): string {
  const date = parseIso(iso);
  if (!date) return "—";
  return `${tanggalFormatter.format(date)} • ${waktuFormatter.format(date)} WITA`;
}

/** Untuk `<time dateTime>`. */
export function toDateTimeAttr(iso: string | null | undefined): string {
  return iso ?? "";
}

export function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** `"2-3"` dari API kurir -> `"2–3 hari kerja"`. */
export function formatEstimasi(etd: string | null | undefined): string {
  if (!etd) return "Estimasi menyusul";
  return `${etd.replace("-", "–")} hari kerja`;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_konfirmasi_cs: "Menunggu Konfirmasi CS",
  dibayar: "Dibayar",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  expired: "Kadaluarsa",
  dibatalkan: "Dibatalkan",
  needs_reconciliation: "Perlu Rekonsiliasi",
};

export function labelStatusOrder(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

const PLURAL = ["item", "items"];

export function pluralItem(count: number): string {
  return `${formatAngka(count)} ${PLURAL[count === 1 ? 0 : 1]}`;
}

/** Nomor telepon CS dinormalisasi ke format `wa.me` (62xx, tanpa `+`). */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  const withoutPlus = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return withoutPlus;
}
