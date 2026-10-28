import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { PaymentInstructions } from "@/components/checkout/PaymentInstructions";
import { PaymentRedirectCard } from "@/components/checkout/PaymentRedirectCard";
import { buttonClass } from "@/components/ui/Button";
import { getOrder } from "@/lib/api";
import { paymentRedirectUrl } from "@/lib/url";
import {
  formatHarga,
  formatBarisPesanan,
  formatTanggalWaktu,
  formatWaktu,
  labelStatusOrder,
} from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";

/**
 * Halaman sukses pesanan.
 *
 * **Halaman ini tidak ada di 15 mockup** — jadi seluruh strukturnya dibangun
 * dari kontrak API, bukan dari disain visual yang ada.
 *
 * Yang ditampilkan apa adanya dari `GET /orders/{orderNumber}`:
 * - nomor pesanan,
 * - status beserta label Bahasa Indonesianya,
 * - instruksi pembayaran dari `payment.instructions` (nomor VA, QRIS, atau teks),
 * - batas pembayaran `payment_expires_at`.
 *
 * Yang TIDAK ditampilkan:
 * - hitung mundur "23:44:52" seperti di mockup status pembayaran. Hitung
 *   mundur di client selalu salah begitu tab tidak aktif atau jam device
 *   berubah; batas waktu yang benar selalu datang dari `payment_expires_at`
 *   milik gateway (PRD §3.7).
 * - nama bank dan nomor rekening yang tidak ada di respons API. Mengarang
 *   nomor transfer adalah bahaya yang nyata, bukan sekadar masalah tampilan.
 * - Status "Lacak Paket di JNE" — `tracking_number` baru diisi admin saat
 *   status menjadi "Dikirim" (PRD §3.9), jadi untuk pesanan yang baru dibuat
 *   tautan itu tidak boleh ada.
 */
export const metadata: Metadata = buildMetadata({
  title: "Pesanan berhasil dibuat",
  description:
    "Nomor pesanan dan instruksi pembayaran untuk pesanan Palo Mountain Goods milikmu.",
  path: "/checkout/berhasil",
  noIndex: true,
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const orderNumber = typeof order === "string" ? order.trim() : "";

  if (!orderNumber) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Nomor pesanan belum tersedia"
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Pesanan tidak ditemukan"
              body="Yuk, cek kembali riwayat belanjaanmu di akun atau lacak pesanan menggunakan nomor pesanan yang valid."
            />
            <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
              <Link href="/lacak" className={buttonClass({ size: "lg" })}>
                Lacak pesanan
              </Link>
              <Link
                href="/produk"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Kembali ke katalog
              </Link>
            </div>
          </div>
        </Container>
      </>
    );
  }

  const detail = await getOrder(orderNumber);

  if (!detail) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Pesanan belum dapat dimuat"
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title={`Nomor pesanan ${orderNumber} tidak ditemukan`}
              body="Pastikan kamu sudah masuk dengan akun yang sesuai atau cek kembali nomor pesanan yang kamu masukkan, ya."
              variant="paper"
            />
            <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
              <Link href="/lacak" className={buttonClass({ size: "lg" })}>
                Coba nomor lain
              </Link>
              <Link
                href="/kontak"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Hubungi Customer Service
              </Link>
            </div>
          </div>
        </Container>
      </>
    );
  }

  const paymentUrl = paymentRedirectUrl(detail);

  const instructions = detail.payment_expires_at
    ? `Selesaikan pembayaran sebelum ${formatWaktu(detail.payment_expires_at)} agar pesananmu tetap aman, ya.`
    : "Instruksi pembayaran akan tampil di sini setelah diverifikasi.";

  return (
    <>
      <PageHeader
        eyebrow="Checkout selesai"
        title="Pesanan berhasil dibuat"
        description="Nomor pesanan dan instruksi pembayaranmu sudah tercatat rapi. Status pembayaran akan otomatis terupdate begitu transaksi selesai diverifikasi."
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Checkout", href: "/checkout" },
          { name: "Selesai", href: "/checkout/berhasil" },
        ]}
        aside={
          <span className="inline-flex w-fit items-center rounded-full border border-border-soft bg-surface-sage px-3 py-1 text-caption font-semibold text-brand-forest">
            {labelStatusOrder(detail.status)}
          </span>
        }
      />

      <Container className="py-8 tablet:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {paymentUrl ? (
            <PaymentRedirectCard
              paymentUrl={paymentUrl}
              orderNumber={detail.order_number}
            />
          ) : null}

          <section className="rounded-lg border-2 border-brand-forest bg-surface-paper p-5 tablet:p-6">
            <p className="text-caption uppercase tracking-widest text-text-secondary">
              Nomor pesanan
            </p>
            <p className="mt-1 font-mono text-headline-md font-bold tracking-wider text-brand-deep">
              {detail.order_number}
            </p>
            <p className="mt-2 text-body-sm text-text-secondary">
              Dibuat {formatTanggalWaktu(detail.placed_at)}
            </p>
            <p className="mt-4 text-title-lg font-semibold text-brand-forest">
              Total tagihan:{" "}
              {formatHarga(detail.grand_total, detail.grand_total_display)}
            </p>
          </section>

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

            {detail.payment_method ? (
              <p className="mt-1 text-body-sm text-text-secondary">
                Metode: {detail.payment_method}
              </p>
            ) : null}

            {/*
              Instruksi dirender apa adanya dari `payment.instructions`
              (`payments.raw_response`). Kalau gateway belum mengirim apa pun,
              `PaymentInstructions` menyatakannya terus terang — bukan
              menampilkan nomor rekening karangan.
            */}
            <div className="mt-4">
              {detail.payment ? (
                <PaymentInstructions payment={detail.payment} />
              ) : (
                <PlaceholderNotice
                  title="Instruksi pembayaran belum tersedia"
                  body="Nomor Virtual Account, string QRIS, dan detail bank berasal langsung dari payment gateway. Kalau belum tampil, muat ulang halaman ini sebentar lagi atau hubungi Customer Service dengan menyebutkan nomor pesanan."
                />
              )}
            </div>

            <p className="mt-4 text-body-md text-text-secondary">
              {instructions}
            </p>
            {detail.payment_expires_at ? (
              <p className="mt-1 text-body-sm text-text-secondary">
                Batas akhir: {formatWaktu(detail.payment_expires_at)}
              </p>
            ) : null}
          </section>

          <section
            aria-labelledby="ringkasan-item"
            className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
          >
            <h2
              id="ringkasan-item"
              className="text-headline-sm text-brand-deep"
            >
              Rincian produk
            </h2>
            <ul className="mt-4 divide-y divide-border-soft">
              {detail.items.map((item) => (
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
              Simpan bukti pesanan ini ya. Kamu juga bisa mengecek status pengiriman secara berkala di halaman Lacak Pesanan.
            </p>
          </section>

          <div className="flex flex-col gap-3 tablet:flex-row">
            <Link
              href={`/lacak?order=${encodeURIComponent(detail.order_number)}`}
              className={buttonClass({ size: "lg" })}
            >
              Lacak pesanan ini
            </Link>
            <Link
              href="/produk"
              className={buttonClass({ variant: "outline", size: "lg" })}
            >
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
