/**
 * Panel naratif di samping formulir auth.
 *
 * Sengaja tanpa foto. Mockup auth menampilkan gambar Googleusercontent milik
 * Stitch yang tidak berlaku di produksi dan tidak punya hak penggunaan yang
 * bisa dipertanggungjawabkan; menggantinya dengan tekstur atau ilustrasi
 * tiruan akan jadi aset karangan. Yang dipakai hanya tipografi dan warna token.
 *
 * Klaim yang DIHAPUS dari mockup:
 * - "Pelacakan Ekspedisi Real-Time" dengan timeline kurir — backend memakai
 *   webhook dari gateway (PRD §3.7), status berubah karena event, bukan
 *   polling dari browser. Menjanjikan "real-time" di sini tidak akurat.
 * - "QRIS & Virtual Account otomatis tanpa perlu konfirmasi manual" —
 *   metode pembayaran yang benar-benar diaktifkan backend belum bisa
 *   dinyatakan sebagai janji di halaman ini.
 */
const KEUNGGULAN = [
  {
    title: "Belanja Praktis & Aman",
    body: "Nikmati kemudahan checkout instan dengan berbagai pilihan pembayaran resmi yang terverifikasi otomatis.",
  },
  {
    title: "Pantau Riwayat Belanja",
    body: "Semua daftar transaksi dan bukti pembelian tersimpan rapi di akunmu, kapan pun kamu ingin mengeceknya.",
  },
  {
    title: "Pengiriman Lebih Cepat",
    body: "Alamat favorit tersimpan otomatis, jadi kamu nggak perlu repot mengetik ulang di pesanan berikutnya.",
  },
] as const;

export function AuthAside() {
  return (
    <section
      aria-label="Tentang akun Palo Mountain Goods"
      className="flex h-full flex-col justify-center rounded-lg border border-border-soft bg-brand-deep p-6 text-surface-paper tablet:p-8"
    >
      <p className="inline-flex w-fit items-center rounded-full border border-brand-forest bg-brand-forest/40 px-3 py-1 text-caption uppercase tracking-widest text-surface-paper">
        Akun Palo Mountain Goods
      </p>

      <h1 className="mt-4 text-headline-sm text-surface-paper tablet:text-headline-md">
        Yuk, gabung dan nikmati belanja lebih mudah!
      </h1>

      <p className="mt-3 text-body-md leading-relaxed text-surface-paper/85">
        Punya akun bikin transaksi makin cepat dan praktis. Tapi tenang, kamu tetap bisa pesan lewat WhatsApp kalau ingin berkonsultasi langsung dengan tim kami!
      </p>

      <ul className="mt-8 space-y-5">
        {KEUNGGULAN.map((item) => (
          <li key={item.title} className="border-l-2 border-accent-earth pl-4">
            <h2 className="text-title-md text-surface-white">{item.title}</h2>
            <p className="mt-1 text-body-sm leading-relaxed text-surface-paper/80">
              {item.body}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-body-sm leading-relaxed text-surface-paper/75">
        Keamanan data dan privasimu selalu jadi prioritas utama kami. Belanja perlengkapan outdoor jadi lebih tenang dan nyaman!
      </p>
    </section>
  );
}
