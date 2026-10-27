import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatEstimasi, formatHarga, formatRupiah, pluralItem } from "@/lib/format";
import type {
  AppliedVoucher,
  CartItem,
  ShippingService,
} from "@/lib/types";
import type { AddressInput } from "@/lib/checkout-form";

/**
 * Ringkasan sticky di sisi kanan checkout.
 *
 * Baris yang TIDAK ada, dan alasannya:
 * - **"Asuransi Pengiriman: Rp 3.000"** dan **"Biaya Layanan"** — tidak ada di
 *   `StoreOrderRequest` maupun di `OrderPricingService`; menambahkannya berarti
 *   mengarang komponen total yang tidak pernah dihitung server.
 * - **"Termasuk PPN"** — tidak ada PPN di kontrak, jadi menampilkannya berarti
 *   menaikkan harga yang tidak terverifikasi.
 * - **"Kemasan Ramah Lingkungan: Gratis"** — klaim operasional yang belum
 *   dikonfirmasi pemilik.
 *
 * Yang ditambahkan: alamat, kurir terpilih, dan metode pembayaran, supaya
 * pengguna bisa memverifikasi pilihannya tanpa perlu menggulir halaman.
 */
export function CheckoutSummary({
  cart,
  accountName,
  accountEmail,
  address,
  service,
  voucher,
}: {
  cart: CartItem[];
  accountName: string;
  accountEmail: string;
  address: AddressInput | null;
  service: ShippingService | null;
  voucher: AppliedVoucher | null;
}) {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);

  /*
   * Saat voucher aktif, subtotal mengikuti hasil `POST /vouchers/apply`
   * (`formatted_subtotal`, atau `final_subtotal + discount_amount`), bukan
   * hitungan peramban — server baru saja menghitungnya dari harga live.
   *
   * `final_subtotal` adalah subtotal PRODUK setelah diskon, TANPA ongkir
   * (`VoucherService::performValidation`), jadi menambahkan `service.cost`
   * masih sah. Kalau backend suatu saat memasukkannya, baris ini dobel.
   */
  const subtotal = voucher
    ? voucher.final_subtotal + voucher.discount_amount
    : cartSubtotal;
  const total = (voucher ? voucher.final_subtotal : cartSubtotal) + (service?.cost ?? 0);

  return (
    <aside
      aria-labelledby="ringkasan-checkout"
      className="rounded-lg border border-border-soft bg-surface-white p-5 desktop:sticky desktop:top-28 tablet:p-6"
    >
      <h2
        id="ringkasan-checkout"
        className="border-b border-border-soft pb-4 text-headline-sm text-brand-deep"
      >
        Ringkasan pesanan
      </h2>

      <p className="py-3 text-body-sm text-text-secondary">
        Akun: <span className="font-medium text-text-primary">{accountName}</span>
        <span className="block break-all">{accountEmail}</span>
      </p>

      <ul className="divide-y divide-border-soft border-y border-border-soft">
        {cart.map((item) => (
          <li key={item.sku_id} className="flex gap-3 py-4">
            <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-md border border-border-soft bg-surface-sage">
              <ImageWithFallback
                src={item.image}
                alt={item.product_name}
                fill
                sizes="4rem"
                className="object-cover object-center"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-title-md text-text-primary">
                {item.product_name}
              </p>
              {item.variant_name ? (
                <p className="truncate text-body-sm text-text-secondary">
                  {item.variant_name}
                </p>
              ) : null}
              <p className="text-body-sm text-text-secondary">
                {pluralItem(item.quantity)}
              </p>
            </div>
            <p className="shrink-0 text-title-md font-semibold text-brand-forest">
              {formatHarga(item.subtotal, item.subtotal_display)}
            </p>
          </li>
        ))}
      </ul>

      {address ? (
        <section className="border-b border-border-soft py-4">
          <h3 className="text-label-md font-semibold text-text-primary">
            Dikirim ke
          </h3>
          <address className="mt-1 text-body-sm not-italic leading-relaxed text-text-secondary">
            {address.recipient_name} · {address.phone}
            <span className="block">{address.street}</span>
            {address.subdistrict ? (
              <span className="block">{address.subdistrict}</span>
            ) : null}
            {address.district ? <span className="block">{address.district}</span> : null}
            <span className="block">
              {[address.city, address.province, address.postal_code]
                .filter(Boolean)
                .join(", ")}
            </span>
          </address>
        </section>
      ) : null}

      <dl className="space-y-3 py-4 text-body-md">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-text-secondary">Subtotal produk</dt>
          <dd className="text-right font-medium text-text-primary">
            {formatHarga(subtotal, voucher?.formatted_subtotal)}
          </dd>
        </div>
        {voucher ? (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-secondary">
              Diskon voucher ({voucher.code})
            </dt>
            <dd className="text-right font-medium text-brand-forest">
              −
              {formatHarga(
                voucher.discount_amount,
                voucher.formatted_discount_amount,
              )}
            </dd>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <dt className="text-text-secondary">Ongkos kirim</dt>
          <dd className="text-right font-medium text-text-primary">
            {service
              ? formatRupiah(service.cost)
              : "Belum dihitung"}
          </dd>
        </div>
        {service ? (
          <div className="flex items-start justify-between gap-3 text-body-sm">
            <dt className="text-text-secondary">Layanan</dt>
            <dd className="text-right text-text-secondary">
              {service.courier} {service.service} ·{" "}
              {formatEstimasi(service.etd)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex items-baseline justify-between gap-3 border-t border-border-soft pt-4">
        <p className="text-title-lg font-semibold text-text-primary">
          Total tagihan
        </p>
        <p className="text-headline-sm font-semibold text-brand-forest">
          {service ? formatRupiah(total) : "—"}
        </p>
      </div>

      <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
        Harga, stok, dan voucher divalidasi ulang oleh server saat pesanan
        dibuat, termasuk total ini.
      </p>

      {/*
        Sejak checkout tidak lagi menanyakan kanal, ringkasan cukup menyebut
        jalurnya: pembayaran online lewat DOKU dan kanal dipilih di sana.
        `paymentMethod` tetap diterima (kontrak backend) tapi tidak lagi
        ditampilkan sebagai pilihan pembeli.
      */}
      <p className="mt-4 border-t border-border-soft pt-4 text-body-sm text-text-secondary">
        Pembayaran:{" "}
        <span className="font-medium text-text-primary">
          Online lewat DOKU
        </span>{" "}
        — kanal dipilih di halaman pembayaran.
      </p>

      <p className="mt-1 text-body-sm text-text-secondary">
        {pluralItem(itemCount)} dalam keranjang
      </p>
    </aside>
  );
}
