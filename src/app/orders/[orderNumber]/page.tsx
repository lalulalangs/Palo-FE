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
                  ? "Server hanya mengembalikan pesanan milik akun yang sedang masuk. Nomor ini mungkin bukan milik akun Anda, atau tertulis berbeda dengan yang ada di riwayat pesanan."
                  : "Server belum bisa dihubungi. Pesanan Anda tetap tersimpan — status pembayaran tidak berubah karena halaman ini gagal dimuat. Coba muat ulang beberapa saat lagi."
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
              <span className="font-semibold">Pembayaran perlu dicek.</span>{" "}
              Customer service sedang mencocokkan pembayaran ini dengan pesanan
              Anda. Jangan bayar ulang sebelum menghubungi kami dengan nomor
              pesanan di atas.
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

            <p className="mt-4 border-t border-border-soft pt-3 text-caption leading-relaxed text-text-secondary">
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
        title: "Pembayaran diterima",
        body: "Pembayaran Anda sudah tercatat dan pesanan akan disiapkan. Nomor resi muncul di halaman ini setelah paket diserahkan ke kurir. Tidak ada yang perlu Anda lakukan sekarang.",
      };

    case "diproses":
      return {
        waitingForPayment: false,
        title: "Pesanan sedang disiapkan",
        body: "Pembayaran sudah masuk dan pesanan sedang dikemas. Nomor resi muncul di halaman ini begitu paket diserahkan ke kurir.",
      };

    case "dikirim":
      return {
        waitingForPayment: false,
        title: "Pesanan sudah dikirim",
        body: "Paket sudah diserahkan ke kurir. Nomor resi, kalau sudah diisi admin, ada di bagian detail di bawah — pelacakan dilakukan di situs kurir, bukan di halaman ini.",
      };

    case "selesai":
      return {
        waitingForPayment: false,
        title: "Pesanan selesai",
        body: "Pesanan ini sudah diterima dan ditutup. Simpan nomor pesanan ini kalau Anda perlu menghubungi customer service soal pesanan tersebut.",
      };

    case "menunggu_pembayaran":
      return {
        waitingForPayment: true,
        title: "Pembayaran belum selesai",
        body: order.payment
          ? "Instruksi pembayaran dari payment gateway ada di bagian bawah halaman ini. Pesanan diproses setelah pembayaran terkonfirmasi otomatis oleh gateway — biasanya beberapa menit setelah Anda membayar."
          : "Payment gateway belum mengirim instruksi untuk pesanan ini. Muat ulang halaman sebentar lagi; kalau tetap kosong, hubungi customer service dengan menyebutkan nomor pesanan.",
      };

    case "menunggu_konfirmasi_cs":
      return {
        waitingForPayment: true,
        title: "Menunggu konfirmasi customer service",
        body: "Pesanan ini dicatat lewat jalur WhatsApp, jadi pembayarannya diverifikasi manual oleh customer service — bukan otomatis oleh gateway. Status di halaman ini berubah setelah verifikasi selesai.",
      };

    case "expired":
      return {
        waitingForPayment: false,
        title: "Pesanan kedaluwarsa",
        body: "Batas waktu pembayaran terlewat, jadi pesanan ditutup dan stoknya dilepas kembali ke katalog. Kalau Anda masih ingin barang ini, buat pesanan baru dari keranjang — pesanan lama tidak bisa dibayar lagi.",
      };

    case "dibatalkan":
      return {
        waitingForPayment: false,
        title: "Pesanan dibatalkan",
        body: "Pesanan ini sudah dibatalkan, jadi tidak ada pembayaran yang perlu diselesaikan. Kalau pembatalan ini tidak Anda minta, hubungi customer service dengan menyebutkan nomor pesanan di atas.",
      };

    case "needs_reconciliation":
      return {
        waitingForPayment: false,
        title: "Pembayaran sedang dicocokkan",
        body: "Gateway mengirim sinyal pembayaran yang belum cocok dengan pesanan ini, jadi customer service memeriksanya manual. Jangan bayar ulang sebelum ada konfirmasi dari kami.",
      };

    default:
      return {
        waitingForPayment: false,
        title: `Status pesanan: ${labelStatusOrder(order.status)}`,
        body: "Status ini belum punya penjelasan khusus di halaman ini. Hubungi customer service dengan menyebutkan nomor pesanan kalau ada yang perlu dipastikan.",
      };
  }
}
