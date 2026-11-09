import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CodConfirmationCard } from "@/components/checkout/CodConfirmationCard";
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

  const isCod =
    detail.is_cod === true ||
    detail.payment_method === "cod" ||
    detail.payment?.method === "cod";

  const isAwaitingCodConfirmation =
    isCod &&
    (detail.status === "awaiting_confirmation" ||
      detail.status === "menunggu_konfirmasi_cs");

  const status = detail.status as string;
  const isPaid =
    status === "paid" ||
    status === "dibayar" ||
    status === "sudah_dibayar" ||
    status === "processing" ||
    status === "diproses" ||
    status === "shipped" ||
    status === "dikirim" ||
    status === "completed" ||
    status === "selesai";

  const paymentUrl = isCod || isPaid ? null : paymentRedirectUrl(detail);

  const instructions = detail.payment_expires_at
    ? `Selesaikan pembayaran sebelum ${formatWaktu(detail.payment_expires_at)} agar pesananmu tetap aman, ya.`
    : "Instruksi pembayaran akan tampil di sini setelah diverifikasi.";

  let headerEyebrow = "Checkout selesai";
  let headerTitle = "Pesanan berhasil dibuat";
  let headerDescription =
    "Nomor pesanan dan instruksi pembayaranmu sudah tercatat rapi. Status pembayaran akan otomatis terupdate begitu transaksi selesai diverifikasi.";

  if (isPaid) {
    headerEyebrow = "Pembayaran Selesai";
    headerTitle = "Pembayaran Berhasil Diterima!";
    headerDescription =
      "Terima kasih! Pembayaranmu telah berhasil diverifikasi secara otomatis. Pesananmu sedang disiapkan dari gudang Senaru.";
  } else if (isCod) {
    if (isAwaitingCodConfirmation) {
      headerEyebrow = "Checkout selesai";
      headerTitle = "Pesanan berhasil tercatat!";
      headerDescription =
        "Satu langkah terakhir! Silakan kirim konfirmasi WhatsApp di bawah agar pesananmu dapat langsung disiapkan dari gudang Senaru.";
    } else {
      headerEyebrow = "Pesanan COD";
      headerTitle = `Status Pesanan: ${labelStatusOrder(detail.status)}`;
      headerDescription =
        detail.status === "dibatalkan"
          ? "Pesanan COD ini telah dibatalkan. Hubungi Customer Service jika butuh bantuan lebih lanjut."
          : detail.status === "expired"
          ? "Waktu konfirmasi pesanan COD telah berakhir."
          : "Konfirmasi WhatsApp untuk pesanan COD ini telah selesai diverifikasi. Pesananmu sedang diproses oleh tim kami.";
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={headerEyebrow}
        title={headerTitle}
        description={headerDescription}
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Checkout", href: "/checkout" },
          { name: "Selesai", href: "/checkout/berhasil" },
        ]}
        aside={
          <span className="inline-flex w-fit items-center border border-border-soft bg-surface-sage px-3 py-1 text-caption font-semibold text-brand-forest">
            {isPaid
              ? "Sudah Dibayar"
              : labelStatusOrder(detail.status)}
          </span>
        }
      />

      <Container className="py-8 tablet:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {isPaid ? (
            <section
              aria-label="Konfirmasi Pembayaran Berhasil"
              className="overflow-hidden border-2 border-brand-forest bg-surface-white shadow-editorial"
            >
              <div className="border-b border-border-soft bg-surface-sage px-5 py-3.5 tablet:px-6">
                <span className="flex items-center gap-2 font-semibold text-brand-forest">
                  <CheckCircleIcon className="h-5 w-5 text-brand-forest" />
                  Pembayaran Terverifikasi
                </span>
              </div>
              <div className="p-5 tablet:p-6">
                <h3 className="font-headline text-headline-sm font-semibold text-brand-deep">
                  Terima kasih! Pembayaranmu berhasil kami terima
                </h3>
                <p className="mt-2 text-body-md leading-relaxed text-text-secondary">
                  Pesananmu dengan nomor{" "}
                  <strong className="font-mono font-bold text-text-primary">
                    {detail.order_number}
                  </strong>{" "}
                  telah lunas dan kini sedang dipersiapkan oleh tim ekspedisi kami dari gudang Senaru. Kamu tidak perlu melakukan konfirmasi manual.
                </p>
                <div className="mt-4 border-l-4 border-brand-forest bg-surface-paper p-3.5 text-body-sm text-text-secondary">
                  Perkembangan pengiriman akan kami perbarui secara berkala. Simpan nomor pesanan untuk memantau status pesanan kapan saja.
                </div>
              </div>
            </section>
          ) : isAwaitingCodConfirmation ? (
            <CodConfirmationCard order={detail} />
          ) : paymentUrl ? (
            <PaymentRedirectCard
              paymentUrl={paymentUrl}
              orderNumber={detail.order_number}
            />
          ) : null}

          <section className="border-2 border-brand-forest bg-surface-paper p-5 tablet:p-6">
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

          {!isCod && !isPaid && status !== "cancelled" && status !== "dibatalkan" && status !== "expired" ? (
            <section
              aria-labelledby="instruksi-pembayaran"
              className="border border-border-soft bg-surface-white p-5 tablet:p-6"
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

              <div className="mt-4">
                {detail.payment ? (
                  <PaymentInstructions payment={detail.payment} />
                ) : (
                  <PlaceholderNotice
                    title="Instruksi pembayaran belum tersedia"
                    body="Nomor Virtual Account dan detail bank berasal langsung dari payment gateway. Kalau belum tampil, muat ulang halaman ini sebentar lagi atau hubungi Customer Service dengan menyebutkan nomor pesanan."
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
          ) : null}

          <section
            aria-labelledby="ringkasan-item"
            className="border border-border-soft bg-surface-white p-5 tablet:p-6"
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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
