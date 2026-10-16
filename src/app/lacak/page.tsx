import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { OrderLookup } from "@/components/lacak/OrderLookup";
import { buttonClass } from "@/components/ui/Button";
import { getToken } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";

/**
 * Lacak pesanan.
 *
 * **PRD §3.11 menyebut jalur pemesanan untuk pembeli tanpa akun, dan mockup
 * lacak memberi halaman lengkap dengan linimasa, nomor resi, dan tombol
 * "Lacak Langsung di Situs JNE". Kenapa tidak seperti itu?**
 *
 * `GET /orders/{orderNumber}` dilindungi `auth:sanctum` dan
 * `OrderController::show` memfilter `user_id` di dalam query. Untuk mendukung
 * lookup anonim, backend harus punya endpoint terpisah yang hampir pasti akan
 * membocorkan keberadaan nomor pesanan orang lain. Jadi di MVP, halaman ini
 * hanya bekerja untuk akun yang sedang masuk, dan menyatakan batasannya secara
 * terbuka.
 *
 * `noIndex` wajib: halaman ini tidak punya konten yang layak diindeks.
 */
export const metadata: Metadata = buildMetadata({
  title: "Lacak Pesanan",
  description:
    "Periksa status pesanan Palo Mountain Goods berdasarkan nomor pesanan. Riwayat status dibaca dari catatan pesanan Anda sendiri.",
  path: "/lacak",
  noIndex: true,
});

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const [{ order }, isLoggedIn] = await Promise.all([searchParams, getToken()]);
  const initialOrder = typeof order === "string" ? order : "";

  return (
    <>
      <PageHeader
        eyebrow="Status pesanan"
        title="Lacak pesanan"
        description="Masukkan nomor pesanan untuk melihat riwayat status. Halaman ini membaca catatan pesanan milik akun yang sedang masuk."
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Lacak pesanan", href: "/lacak" },
        ]}
      />

      <Container className="py-8 tablet:py-12">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
          <div className="desktop:col-span-7">
            {/*
              `Suspense` dibutuhkan karena `OrderLookup` memakai
              `useSearchParams`, yang mewajibkan bailout ke render sisi klien.
            */}
            <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
              <OrderLookup initialOrder={initialOrder} />
            </Suspense>
          </div>

          <aside className="desktop:col-span-5">
            {!isLoggedIn ? (
              <div className="space-y-4">
                <PlaceholderNotice
                  title="Masuk untuk melihat pesanan"
                  body="Backend hanya mengembalikan pesanan milik pengguna yang sedang login, jadi halaman ini tidak bisa mengonfirmasi keberadaan nomor pesanan milik orang lain."
                />
                <div className="flex flex-col gap-3 tablet:flex-row">
                  <Link
                    href="/masuk?redirect_to=%2Flacak"
                    className={buttonClass({ fullWidth: true })}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar?redirect_to=%2Flacak"
                    className={buttonClass({
                      variant: "outline",
                      fullWidth: true,
                    })}
                  >
                    Buat akun
                  </Link>
                </div>
              </div>
            ) : (
              <PlaceholderNotice
                title="Nomor pesanan ada di riwayat akun"
                body="Nomor pesanan dikirim setelah checkout berhasil, dan tetap dapat dibuka kapan pun dari halaman ini selama Anda memakai akun yang memesan."
              />
            )}

            <p className="mt-6 text-caption leading-relaxed text-text-secondary">
              Nomor resi dan tautan pelacakan ke situs kurir sengaja tidak
              ditampilkan di sini. Nomor resi baru diisi admin saat pesanan
              berstatus &ldquo;Dikirim&rdquo; (PRD §3.9), dan tidak ada endpoint
              pelacakan kiriman di backend — menampilkan tautan dengan nomor
              karangan akan mengarahkan orang ke halaman yang salah.
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}
