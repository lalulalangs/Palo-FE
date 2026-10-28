import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderTimeline } from "@/components/lacak/OrderTimeline";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { buttonClass } from "@/components/ui/Button";
import { getToken, lookupOrder } from "@/lib/api";
import {
  formatEstimasi,
  formatHarga,
  formatWaktu,
  labelStatusOrder,
  pluralItem,
} from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import type { OrderDetail } from "@/lib/types";

/**
 * Detail pesanan — halaman yang dituju pembeli setelah kembali dari DOKU.
 *
 * **Kenapa route-nya `/orders/{nomor}`, bukan `/doku`?**
 * `DokuCheckoutClient::callbackUrl()` mengirim `FRONTEND_URL.'/orders/'.$order->order_number`
 * ke DOKU sebagai `callback_url`. Jadi path inilah yang benar-benar dibuka
 * gateway saat pembeli selesai (atau membatalkan) pembayaran; `/doku` hanya
 * jaring kalau Back Office DOKU diisi path lain (lihat `src/app/doku/route.ts`).
 *
 * **Guard login, bukan lookup anonim.** `GET /orders/{nomor}` dilindungi
 * `auth:sanctum` dan `OrderController::show` memfilter `user_id`, jadi tamu
 * tidak punya cara melihat pesanan dan nomor pesanan tidak pernah dikonfirmasi
 * ada atau tidak. Karena itu tamu diarahkan ke `/masuk` dengan `redirect_to`
 * (satu-satunya key yang dibaca `AuthForm`/`safeRedirect`) kembali ke halaman
 * ini. Token 401 juga diarahkan ke sana: cookie yang ada tidak berarti sesi
 * masih sah.
 *
 * **Isi halaman.** Bagian pentingnya bukan sekadar mengulang data pesanan,
 * tetapi menjawab satu pertanyaan: *pembayaran saya sudah masuk atau belum,
 * dan apa yang harus saya lakukan sekarang?* Jawaban itu disusun di
 * `describeNextStep()` dari `status` yang dikirim server. Rincian teknis
 * (instruksi VA/QRIS, linimasa status, alamat kirim, resi, item) dirender
 * `OrderTimeline` yang sudah dipakai `/lacak` — tidak ada komponen kedua.
 *
 * **Yang tidak ditampilkan.** Hitung mundur pembayaran (selalu salah begitu tab
 * tidak aktif), nomor rekening karangan, dan tautan pelacakan kurir tanpa resi.
 *
 * `noIndex` wajib: isinya personal, tidak boleh masuk indeks maupun sitemap.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  const normalized = orderNumber.trim().toUpperCase();

  return buildMetadata({
    title: normalized ? `Pesanan ${normalized}` : "Detail pesanan",
    description:
      "Status pesanan dan instruksi pembayaran Palo Mountain Goods untuk akun yang sedang masuk.",
    path: `/orders/${encodeURIComponent(normalized)}`,
    noIndex: true,
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber: raw } = await params;
  const orderNumber = raw.trim().toUpperCase();
  const selfPath = `/orders/${encodeURIComponent(orderNumber)}`;
  const loginPath = `/masuk?redirect_to=${encodeURIComponent(selfPath)}`;

  if (!(await getToken())) redirect(loginPath);

  const result = await lookupOrder(orderNumber);

  // Token kedaluwarsa/cabut: perlakukan sama seperti belum masuk.
  if (result === "unauthorized") redirect(loginPath);

  if (result === "not_found" || result === null) {
    const notFound = result === "not_found";

    return (
      <>
        <PageHeader
          eyebrow="Detail pesanan"
          title={
            notFound
              ? "Pesanan tidak dapat ditampilkan"
              : "Pesanan belum dapat dimuat"
          }
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Lacak pesanan", href: "/lacak" },
            { name: orderNumber, href: selfPath },
          ]}
        />
        <Container className="py-8 tablet:py-12">
          <div className="mx-auto max-w-2xl space-y-6">
            <PlaceholderNotice
              variant={notFound ? "sage" : "paper"}
              title={
                notFound
                  ? `Nomor pesanan ${orderNumber} tidak ditemukan`
                  : "Pesanan belum dapat dimuat"
              }
              body={
                notFound
                  ? "Nomor pesanan belum ditemukan di akunmu. Cek kembali riwayat pesanan atau pastikan nomor pesanan sudah sesuai, ya."
                  : "Koneksi lagi ada kendala sejenak. Jangan khawatir, pesananmu tetap tersimpan aman. Coba muat ulang halaman beberapa saat lagi ya!"
              }
            />
            <div className="flex flex-col gap-3 tablet:flex-row">
              <Link href="/lacak" className={buttonClass({ size: "lg" })}>
                Cari nomor lain
              </Link>
              <Link href="/me" className={buttonClass({ variant: "outline", size: "lg" })}>
                Riwayat pesanan saya
              </Link>
            </div>
          </div>
        </Container>
      </>
    );
  }

  const detail = result;
  const step = describeNextStep(detail);
  const courier = [detail.shipping_courier, detail.shipping_service]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <PageHeader
        eyebrow="Kembali dari pembayaran"
        title={step.title}
        description={step.body}
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Riwayat pesanan", href: "/me" },
          { name: detail.order_number, href: selfPath },
        ]}
        aside={
          <OrderStatusBadge
            status={detail.status}
            statusLabel={detail.status_label}
          />
        }
      />

      <Container className="py-8 tablet:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {/*
            Tenggat pembayaran hanya bermakna selama pesanan masih menunggu
            pembayaran. Sumbernya `payment_expires_at` (stock lock), bukan
            hitung mundur di browser.
          */}
          {step.waitingForPayment && detail.payment_expires_at ? (
            <p className="rounded-lg border border-accent-earth/50 bg-surface-paper p-4 text-body-md text-text-primary">
              <span className="font-semibold">Batas akhir pembayaran:</span>{" "}
              {formatWaktu(detail.payment_expires_at)}
            </p>
          ) : null}

          {detail.needs_reconciliation ? (
            <p className="rounded-lg border border-feedback-error/40 bg-surface-paper p-4 text-body-md text-text-primary">
              <span className="font-semibold">Pembayaran sedang kami verifikasi.</span>{" "}
              Tim Customer Service kami lagi mencocokkan data pembayaranmu. Nggak perlu bayar ulang ya, kamu bisa hubungi kami dengan menyebutkan nomor pesanan di atas jika butuh bantuan!
            </p>
          ) : null}

          <section
            aria-labelledby="ringkasan-biaya"
            className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6"
          >
            <h2 id="ringkasan-biaya" className="text-headline-sm text-brand-deep">
              Ringkasan biaya
            </h2>

            <dl className="mt-4 space-y-2 text-body-md">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-text-secondary">
                  Subtotal ({pluralItem(detail.item_count)})
                </dt>
                <dd className="text-text-primary">
                  {formatHarga(detail.subtotal, null)}
                </dd>
              </div>

              {detail.discount_total > 0 ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-text-secondary">
                    Diskon
                    {detail.voucher_code ? ` (${detail.voucher_code})` : ""}
                  </dt>
                  <dd className="text-text-primary">
                    −{formatHarga(detail.discount_total, null)}
                  </dd>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-text-secondary">Ongkos kirim</dt>
                <dd className="text-text-primary">
                  {formatHarga(detail.shipping_cost, null)}
                </dd>
              </div>

              {detail.service_fee > 0 ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-text-secondary">Biaya layanan</dt>
                  <dd className="text-text-primary">
                    {formatHarga(detail.service_fee, null)}
                  </dd>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3 border-t border-border-soft pt-2">
                <dt className="font-semibold text-text-primary">Total</dt>
                <dd className="text-title-lg font-semibold text-brand-forest">
                  {formatHarga(detail.grand_total, detail.grand_total_display)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 border-t border-border-soft pt-3 text-body-sm leading-relaxed text-text-secondary">
              {courier
                ? `Kurir: ${courier}`
                : "Kurir belum tercatat di pesanan ini"}
              {courier && detail.shipping_etd
                ? ` · ${formatEstimasi(detail.shipping_etd)}`
                : ""}
            </p>
          </section>

          {/* Instruksi VA/QRIS, linimasa status, alamat kirim, resi, dan item —
              semuanya dari komponen yang sama dengan halaman lacak. */}
          <OrderTimeline order={detail} />

          <div className="flex flex-col gap-3 tablet:flex-row">
            <Link
              href={`/lacak?order=${encodeURIComponent(detail.order_number)}`}
              className={buttonClass({ size: "lg" })}
            >
              Lacak pesanan ini
            </Link>
            <Link
              href="/me"
              className={buttonClass({ variant: "outline", size: "lg" })}
            >
              Riwayat pesanan
            </Link>
            <Link
              href="/kontak"
              className={buttonClass({ variant: "outline", size: "lg" })}
            >
              Hubungi customer service
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}

/**
 * Apa yang terjadi setelah pembayaran — satu blok, ditentukan `status` dari
 * server (bukan ditebak dari `payment.status` atau jam browser).
 *
 * `OrderStatusBadge` hanya memberi warna; blok ini memberi kalimat. Keduanya
 * dibutuhkan: warna saja gagal untuk pembaca layar dan untuk pembeli yang
 * tidak hafal arti "Perlu Rekonsiliasi".
 */
type NextStep = {
  title: string;
  body: string;
  /** Masih ada pembayaran yang harus diselesaikan. */
  waitingForPayment: boolean;
};

function describeNextStep(order: OrderDetail): NextStep {
  switch (order.status) {
    case "dibayar":
      return {
        waitingForPayment: false,
        title: "Pembayaran berhasil!",
        body: "Hore! Pembayaranmu sudah kami terima dan pesanan segera disiapkan. Kamu bisa santai dulu, nomor resi bakal muncul di sini begitu paket dijemput kurir.",
      };

    case "diproses":
      return {
        waitingForPayment: false,
        title: "Pesanan sedang disiapkan",
        body: "Barangmu lagi disiapkan dan dikemas dengan rapi oleh tim kami. Nomor resi bakal otomatis terupdate di sini begitu paket diserahkan ke kurir, ya.",
      };

    case "dikirim":
      return {
        waitingForPayment: false,
        title: "Paket sedang dalam perjalanan",
        body: "Paketmu sudah meluncur bersama kurir! Nomor resi bisa kamu cek pada detail pengiriman di bawah untuk pelacakan langsung di situs kurir.",
      };

    case "selesai":
      return {
        waitingForPayment: false,
        title: "Pesanan selesai",
        body: "Paket sudah sampai di tujuan! Terima kasih sudah mempercayakan pilihan pakaianmu bersama Palo Mountain Goods. Selamat menikmati outfit barumu!",
      };

    case "menunggu_pembayaran":
      return {
        waitingForPayment: true,
        title: "Menunggu pembayaran",
        body: order.payment
          ? "Yuk, selesaikan pembayaranmu sesuai panduan di bawah. Pesananmu bakal otomatis diproses begitu pembayaran terverifikasi!"
          : "Panduan pembayaran lagi disiapkan. Yuk, coba refresh halaman sebentar lagi atau hubungi tim Customer Service kami kalau butuh bantuan!",
      };

    case "menunggu_konfirmasi_cs":
      return {
        waitingForPayment: true,
        title: "Menunggu konfirmasi CS",
        body: "Pesananmu diproses lewat jalur WhatsApp dan sedang diverifikasi oleh Customer Service kami. Status di halaman ini bakal otomatis terupdate setelah konfirmasi selesai, ya.",
      };

    case "expired":
      return {
        waitingForPayment: false,
        title: "Waktu pembayaran berakhir",
        body: "Batas waktu pembayaran untuk pesanan ini sudah lewat, jadi stoknya dikembalikan ke katalog. Kamu masih bisa pesan ulang barang favoritmu lewat keranjang, ya!",
      };

    case "dibatalkan":
      return {
        waitingForPayment: false,
        title: "Pesanan dibatalkan",
        body: "Pesanan ini sudah dibatalkan. Kalau pembatalan ini terjadi di luar rencanamu atau butuh bantuan lebih lanjut, yuk hubungi Customer Service dengan menyebutkan nomor pesanan di atas!",
      };

    case "needs_reconciliation":
      return {
        waitingForPayment: false,
        title: "Pembayaran sedang diverifikasi",
        body: "Tim kami sedang mencocokkan konfirmasi pembayaranmu. Nggak perlu bayar ulang ya, kami akan segera infokan status terbarunya buat kamu!",
      };

    default:
      return {
        waitingForPayment: false,
        title: `Status pesanan: ${labelStatusOrder(order.status)}`,
        body: "Ada pertanyaan seputar pesanan ini? Yuk, langsung hubungi Customer Service kami dengan menyebutkan nomor pesanan di atas!",
      };
  }
}
