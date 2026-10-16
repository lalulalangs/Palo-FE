import { LineIcon } from "@/components/ui/LineIcon";

/**
 * Tombol WhatsApp mengambang.
 *
 * ===================================================================
 *  KENAPA HANYA DI BERANDA
 * ===================================================================
 * Ini satu-satunya tombol mengambang di situs, dan sengaja hanya di beranda.
 * Di halaman checkout, lacik, atau keranjang, tombol mengambang bisa
 * menutupi bagian penting (ringkasan pesanan, tombol bayar) — dan di
 * halaman yang butuh fokus, satu jalan keluar lagi justru menghalangi.
 *
 * ===================================================================
 *  KENAPA TIDAK MUNCUL KALAU NOMOR KOSONG
 * ===================================================================
 * `href` bernilai `null` kalau nomor WhatsApp CS belum diisi di panel
 * admin. Dalam keadaan itu komponen TIDAK dirender sama sekali.
 *
 * Alasannya: tautan ke `https://wa.me/` tanpa nomor membuka WhatsApp
 * dengan chat kosong tanpa tujuan. Tombol yang terlihat tapi tidak berguna
 * lebih buruk daripada tidak ada tombolnya.
 *
 * ===================================================================
 *  AKSESIBILITAS
 * ===================================================================
 * - Ikon `aria-hidden`; nama kanal ada di `sr-only` supaya pembaca layar
 *   Membaca "Buka WhatsApp", bukan sekadar "chat".
 * - `aria-label` di link-nya, karena tombol ini tidak punya teks terlihat.
 * - Sengaja TIDAK `sr-only focus:not-sr-only`: tombolnya selalu terlihat,
 *   jadi tidak perlu menyembunyikan diri sampai difokus.
 */
export function WhatsAppFab({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buka percakapan WhatsApp dengan Customer Service"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-surface-white/20 bg-brand-forest text-surface-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-brand-deep"
    >
      <LineIcon name="chat" className="h-6 w-6" />
      <span className="sr-only">Buka WhatsApp CS</span>
    </a>
  );
}
