import Link from "next/link";

import { buttonClass } from "@/components/ui/Button";
import { formatHarga, formatAngka, pluralItem } from "@/lib/format";
import type { CartSummary as CartSummaryData } from "@/lib/types";

/**
 * Ringkasan pesanan di sisi keranjang.
 *
 * Yang TIDAK ada di sini, dan itu disengaja:
 *
 * - **Angka ongkir.** Mockup lama menulis "Estimasi Ongkos Kirim: Rp 28.000"
 *   padahal ongkir hanya bisa dihitung setelah kota tujuan diketahui dan
 *   API kurir merespons (PRD §3.8). Tampilannya sebagai "Dihitung saat
 *   checkout" — mengarang angka ongkir di sini akan jadi janji yang tidak
 *   bisa ditepati.
 * - **"Biaya Penanganan Kemasan: Gratis".** Klaim operasional yang belum
 *   dikonfirmasi pemilik. Dihapus.
 * - **Kode voucher "FREESHIP".** Kode voucher fiktif di mockup adalah klaim
 *   operasional yang belum dikonfirmasi pemilik (PRD §6A), daniklan di
 *   beberapa halaman sekaligus.
 *
 * Yang ditambahkan: penjelasan eksplisit bahwa keranjang tidak mengunci
 * stok (PRD §3.4), supaya pengguna tidak mengira pesanannya sudah diamankan.
 */
export function CartSummary({
  summary,
  shippingNote,
  action,
}: {
  summary: CartSummaryData;
  /** Slot untuk tombol/tautan aksi (disusun oleh Server Component induk). */
  shippingNote?: string;
  action?: React.ReactNode;
}) {
  const totalLabel = formatHarga(summary.subtotal, summary.subtotal_display);

  return (
    <aside
      aria-labelledby="ringkasan-pesanan"
      className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
    >
      <h2
        id="ringkasan-pesanan"
        className="border-b border-border-soft pb-4 text-headline-sm text-text-primary"
      >
        Ringkasan pesanan
      </h2>

      <dl className="space-y-3 border-b border-border-soft py-4 text-body-md">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-text-secondary">
            Subtotal ({pluralItem(summary.item_count)})
          </dt>
          <dd className="text-right font-semibold text-text-primary">
            {totalLabel}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-text-secondary">Ongkos kirim</dt>
          <dd className="text-right font-medium text-text-primary">
            {shippingNote ?? "Dihitung saat checkout"}
          </dd>
        </div>
      </dl>

      <div className="flex items-baseline justify-between gap-3 py-4">
        <div>
          <p className="text-title-lg font-semibold text-text-primary">
            Total sementara
          </p>
          <p className="text-caption text-text-secondary">
            Belum termasuk ongkir resmi tujuan
          </p>
        </div>
        <p className="text-headline-sm font-semibold text-brand-forest">
          {totalLabel}
        </p>
      </div>

      {action ? <div className="space-y-3">{action}</div> : null}

      <p className="mt-4 rounded-md bg-surface-sage/70 p-3 text-caption leading-relaxed text-text-secondary">
        Keranjang tidak memblokir stok. Stok dan harga divalidasi ulang oleh
        server saat pesanan dibuat, sehingga nilai di atas bisa berubah.
      </p>

      <p className="mt-3 text-caption text-text-secondary">
        Jumlah item: {formatAngka(summary.item_count)}
      </p>

      <Link
        href="/produk"
        className={buttonClass({
          variant: "ghost",
          fullWidth: true,
          className: "mt-3",
        })}
      >
        Lanjut belanja
      </Link>
    </aside>
  );
}
