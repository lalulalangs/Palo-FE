import {
  formatHarga,
  formatBarisPesanan,
  formatTanggalWaktu,
  labelStatusOrder,
} from "@/lib/format";
import { PaymentInstructions } from "@/components/checkout/PaymentInstructions";
import type { OrderDetail } from "@/lib/types";

/**
 * Linimasa status pesanan.
 *
 * Sumbernya `order.history[]` (audit trail dari ARSITEKTUR §6), bukan urutan
 * status yang ditebak di frontend. Menampilkan urutan hardcode akan
 * menyesatkan: pesanan bisa batal, expired, atau masuk rekonsiliasi, dan
 * history adalah satu-satunya catatan yang jujur.
 *
 * Yang TIDAK ada, dibanding mockup pelacakan:
 * - **Kurir & nomor resi dengan tombol "Lacak Langsung di Situs JNE".**
 *   `tracking_number` hanya diisi admin saat status menjadi "Dikirim"
 *   (PRD §3.9), dan `routes/api.php` tidak punya endpoint pelacakan kiriman.
 *   Tautan ke situs kurir dengan nomor karangan akan membuka halaman yang
 *   salah.
 * - **Deskripsi_manual per langkah** ("Paket telah selesai disortir dan
 *   sedang diberangkatkan…"). Itu narasi yang tidak ada di database.
 *   `history[].note` yang diisi server adalah satu-satunya teks yang boleh
 *   ditampilkan.
 */
const STATUS_TONE: Record<string, string> = {
  menunggu_pembayaran: "bg-surface-sage text-brand-forest",
  dibayar: "bg-surface-sage text-brand-forest",
  diproses: "bg-surface-sage text-brand-forest",
  dikirim: "bg-surface-sage text-brand-forest",
  selesai: "bg-surface-sage text-brand-forest",
  expired: "bg-surface-paper text-feedback-warn",
  dibatalkan: "bg-surface-paper text-feedback-warn",
  needs_reconciliation: "bg-surface-paper text-feedback-warn",
};

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const history = [...order.history].sort((a, b) =>
    a.occurred_at.localeCompare(b.occurred_at),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption uppercase tracking-widest text-text-secondary">
              Nomor pesanan
            </p>
            <h2 className="mt-1 font-mono text-headline-sm font-bold tracking-wider text-brand-deep">
              {order.order_number}
            </h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              Dibuat {formatTanggalWaktu(order.placed_at)}
            </p>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full border border-border-soft px-3 py-1 text-caption font-semibold",
              STATUS_TONE[order.status] ?? "bg-surface-paper text-text-secondary",
            ].join(" ")}
          >
            {labelStatusOrder(order.status)}
          </span>
        </div>

        <p className="mt-4 text-title-lg font-semibold text-brand-forest">
          Total: {formatHarga(order.grand_total, order.grand_total_display)}
        </p>

        {order.shipping_address ? (
          <section className="mt-5 border-t border-border-soft pt-4">
            <h3 className="text-label-md font-semibold text-text-primary">
              Dikirim ke
            </h3>
            <address className="mt-1 text-body-sm not-italic leading-relaxed text-text-secondary">
              {order.shipping_address.recipient_name} ·{" "}
              {order.shipping_address.phone}
              <span className="block">{order.shipping_address.street}</span>
              {order.shipping_address.subdistrict ? (
                <span className="block">{order.shipping_address.subdistrict}</span>
              ) : null}
              {order.shipping_address.district ? (
                <span className="block">{order.shipping_address.district}</span>
              ) : null}
              <span className="block">
                {[
                  order.shipping_address.city,
                  order.shipping_address.province,
                  order.shipping_address.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </address>
          </section>
        ) : null}

        {/*
          Nomor resi hanya ditampilkan bila sudah diisi server. Admin baru
          mengisinya saat status menjadi "Dikirim" (PRD §3.9).
        */}
        {order.tracking_number ? (
          <section className="mt-5 border-t border-border-soft pt-4">
            <h3 className="text-label-md font-semibold text-text-primary">
              Nomor resi
            </h3>
            <p className="mt-1 font-mono text-title-lg tracking-wider text-text-primary">
              {order.tracking_number}
            </p>
            {order.shipping_courier ? (
              <p className="mt-1 text-body-sm text-text-secondary">
                {order.shipping_courier} {order.shipping_service ?? ""}
              </p>
            ) : null}
            <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
              Kamu bisa melacak progres pengiriman paket secara real-time langsung di situs web kurir menggunakan nomor resi di atas, ya.
            </p>
          </section>
        ) : null}
      </section>

      {/*
        Instruksi pembayaran. Hanya dirender bila `GET /orders/{nomor}`
        mengirim objek `payment` — untuk pesanan yang sudah dibayar biasanya
        kosong, dan itu memang benar.
      */}
      {order.payment ? (
        <section
          aria-labelledby="instruksi-pembayaran"
          className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
        >
          <h2
            id="instruksi-pembayaran"
            className="text-headline-sm text-brand-deep"
          >
            Instruksi pembayaran
          </h2>
          <div className="mt-3">
            <PaymentInstructions payment={order.payment} />
          </div>
          {order.payment_expires_at ? (
            <p className="mt-3 border-t border-border-soft pt-3 text-body-sm text-text-secondary">
              Batas akhir pembayaran:{" "}
              {formatTanggalWaktu(order.payment_expires_at)}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        aria-labelledby="linimasa-status"
        className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
      >
        <h2 id="linimasa-status" className="text-headline-sm text-brand-deep">
          Riwayat status
        </h2>

        {history.length === 0 ? (
          <p className="mt-3 text-body-sm text-text-secondary">
            Riwayat status belum tercatat.
          </p>
        ) : (
          <ol className="mt-4 space-y-5 border-l-2 border-border-soft pl-5">
            {history.map((entry, index) => (
              <li key={`${entry.occurred_at}-${index}`} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-surface-white bg-brand-forest"
                />
                <p className="text-title-md font-semibold text-text-primary">
                  {labelStatusOrder(entry.to_status ?? order.status)}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {formatTanggalWaktu(entry.occurred_at)}
                  {entry.actor_type ? ` · ${entry.actor_type}` : ""}
                </p>
                {entry.note ? (
                  <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
                    {entry.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        <p className="mt-5 border-t border-border-soft pt-4 text-body-sm leading-relaxed text-text-secondary">
          Status pesanan diperbarui secara otomatis mengikuti perkembangan terbaru dari tim kami dan pihak ekspedisi.
        </p>
      </section>

      <section
        aria-labelledby="rincian-pesanan"
        className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
      >
        <h2 id="rincian-pesanan" className="text-headline-sm text-brand-deep">
          Rincian barang
        </h2>
        <ul className="mt-4 divide-y divide-border-soft">
          {order.items.map((item) => (
            <li
              key={`${item.sku_code}-${item.quantity}`}
              className="flex items-baseline justify-between gap-3 py-3"
            >
              <span className="min-w-0">
                <span className="block text-title-md text-text-primary">
                  {item.product_name}
                </span>
                <span className="block text-body-sm text-text-secondary">
                  {item.variant_name ? `${item.variant_name} · ` : ""}
                  {item.sku_code} · {item.quantity} pcs
                </span>
              </span>
              <span className="shrink-0 text-title-md font-semibold text-text-primary">
                {formatBarisPesanan(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
          Rincian barang ini mencatat pesanan aslimu, sehingga tetap tersimpan rapi meski stok produk di katalog sudah berganti.
        </p>
      </section>
    </div>
  );
}
