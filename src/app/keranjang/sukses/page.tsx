import Link from "next/link";
import type { Metadata } from "next";

import { takeGuestResultHandoff } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/Button";
import { formatHarga } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";

/**
 * Hasil checkout tamu via WhatsApp.
 *
 * Halaman ini TIDAK menampilkan "Pesanan berhasil" dan TIDAK menampilkan
 * nomor pesanan. Yang terjadi di `POST /guest/whatsapp-checkout` hanyalah
 * pencatatan *niat* menghubungi Customer Service di `guest_checkout_logs`
 * (KONTRAK-API §5). Tidak ada order, tidak ada reservasi stok, tidak ada
 * transaksi pembayaran. Judul dan noticenya dibuat supaya itu tidak ambigu.
 *
 * Halaman ini tidak ada di mockup lama dan tidak punya padanan di sana, karena
 * mockup langsung mengarahkan pengguna ke `wa.me` tanpa memberi bukti apa pun.
 * Yang ditambahkan justru *kode referensi* yang bisa disebutkan ke CS.
 *
 * `noIndex`: halaman ini tidak punya nilai untuk mesin pencari, dan isinya
 * milik satu sesi saja.
 */
export const metadata: Metadata = buildMetadata({
  title: "Pesan WhatsApp siap",
  description:
    "Daftar belanja sudah disusun ke percakapan WhatsApp Customer Service. Kode referensi dicantumkan agar mudah ditindaklanjuti.",
  path: "/keranjang/sukses",
  noIndex: true,
});

export default async function GuestCheckoutSuccessPage() {
  const handoff = await takeGuestResultHandoff();

  if (!handoff) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout tamu"
          title="Belum ada pesan WhatsApp yang disiapkan"
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Halaman ini hanya bisa dibuka setelah formulir dikirim"
              body="Kode referensi dan tautan WhatsApp dibuat sesaat setelah Anda menekan tombol di halaman keranjang, lalu langsung dihapus dari browser. Buka halaman keranjang untuk mencoba lagi."
            />
            <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
              <Link href="/keranjang" className={buttonClass({ size: "lg" })}>
                Kembali ke keranjang
              </Link>
              <Link
                href="/kontak"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Halaman kontak
              </Link>
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout tamu"
        title="Pesan WhatsApp sudah disiapkan"
        description="Daftar belanja Anda sudah disusun menjadi pesan. Buka WhatsApp untuk mengirimnya ke Customer Service."
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Keranjang", href: "/keranjang" },
          { name: "Selesai", href: "/keranjang/sukses" },
        ]}
      />

      <Container className="py-10 tablet:py-14">
        <div className="mx-auto max-w-2xl">
          {/*
            Notice ini datang dari backend dan WAJIB ditampilkan utuh:
            PRD §3.11 mensyaratkan UI menjelaskan bahwa membuka WhatsApp
            bukan bukti pesanan sudah tercatat.
          */}
          <div className="rounded-lg border-2 border-accent-earth/50 bg-surface-paper p-5">
            <h2 className="text-title-lg text-brand-deep">
              Ini belum menjadi pesanan
            </h2>
            <p className="mt-2 text-body-md text-text-secondary">
              {handoff.notice}
            </p>
            <p className="mt-3 text-caption leading-relaxed text-text-secondary">
              Yang tercatat di sistem sekarang hanya niat menghubungi Customer
              Service. Tidak ada nomor pesanan, tidak ada stok yang dikunci, dan
              tidak ada pembayaran yang diproses. Harga serta stok final
              dikonfirmasi langsung oleh Customer Service.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-border-soft bg-surface-white p-5">
            <h2 className="text-title-md text-text-primary">
              Kode referensi
            </h2>
            <p className="mt-2 font-mono text-headline-sm font-bold tracking-wider text-brand-deep">
              {handoff.reference_code}
            </p>
            <p className="mt-2 text-caption text-text-secondary">
              Sebutkan kode ini di awal percakapan WhatsApp supaya Customer
              Service bisa menemukan catatan Anda lebih cepat.
            </p>
          </div>

          {handoff.estimated_total > 0 || handoff.estimated_total_display ? (
            <div className="mt-4 rounded-lg border border-border-soft bg-surface-white p-5">
              <h2 className="text-title-md text-text-primary">
                Estimasi total
              </h2>
              <p className="mt-2 text-title-lg font-semibold text-brand-forest">
                {formatHarga(
                  handoff.estimated_total,
                  handoff.estimated_total_display,
                )}
              </p>
              <p className="mt-2 text-caption text-text-secondary">
                Angka ini hanya estimasi dan belum termasuk ongkos kirim. Nilai
                final ditentukan Customer Service.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={handoff.wa_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ size: "lg", fullWidth: true })}
            >
              Buka WhatsApp dan kirim pesan
            </a>
            <p className="text-caption leading-relaxed text-text-secondary">
              Tautan ini membuka percakapan dengan pesan yang sudah terisi.
              Anda tetap perlu menekan tombol kirim di WhatsApp — membuka
              tautan tidak mengirim apa pun.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 tablet:flex-row">
            <Link href="/keranjang" className={buttonClass({ variant: "outline" })}>
              Kembali ke keranjang
            </Link>
            <Link href="/produk" className={buttonClass({ variant: "ghost" })}>
              Lanjut belanja
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
