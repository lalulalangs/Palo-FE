import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { logoutAction } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/layout/PageHeader";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LineIcon, type LineIconName } from "@/components/ui/LineIcon";
import { getCurrentUser, getOrderList } from "@/lib/api";
import { formatHarga, formatTanggalPendek, pluralItem } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";

/**
 * Akun saya.
 *
 * Satu halaman menutup dua endpoint yang sebelumnya punya accessor tapi nol
 * jalur UI: `GET /v1/orders` (riwayat) dan `POST /v1/auth/logout` (tombol
 * Keluar). Tidak ada endpoint maupun field baru — `AuthUser` hanya berisi
 * `id`, `name`, `email`, jadi baris telepon ditampilkan apa adanya sebagai
 * "Belum tersimpan di akun" alih-alih nomor karangan.
 *
 * Guard di halaman, bukan di middleware: middleware hanya tahu cookie *ada*,
 * tidak tahu token *valid*. `getCurrentUser()` adalah satu-satunya sumber
 * kebenaran. Parameter redirect memakai `redirect_to` karena `AuthForm`,
 * `loginAction`, dan `safeRedirect()` hanya membaca key itu — `?next=` akan
 * diabaikan diam-diam.
 *
 * Seluruh halaman server-rendered; "Keluar" adalah `<form action={logoutAction}>`,
 * jadi tidak ada satu pun client component di sini.
 */
export const metadata: Metadata = buildMetadata({
  title: "Akun saya",
  description:
    "Profil dan riwayat pesanan akun Palo Mountain Goods yang sedang masuk.",
  path: "/me",
  noIndex: true,
});

const QUICK_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LineIconName;
}> = [
  { href: "/lacak", label: "Lacak pesanan", icon: "truck" },
  { href: "/keranjang", label: "Buka keranjang", icon: "bag" },
];

export default async function AccountPage() {
  const [user, orders] = await Promise.all([getCurrentUser(), getOrderList()]);

  if (!user) redirect("/masuk?redirect_to=%2Fme");

  return (
    <>
      <PageHeader
        eyebrow="Akun pelanggan"
        title="Akun saya"
        description="Pantau status pesanan dan kelola informasi akunmu dengan mudah."
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Akun saya", href: "/me" },
        ]}
      />

      <Container className="py-8 tablet:py-12">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
          {/* ---- Riwayat pesanan ---- */}
          <section
            aria-labelledby="riwayat-pesanan"
            className="desktop:col-span-8"
          >
            <SectionHeading
              id="riwayat-pesanan"
              title="Riwayat pesanan"
              description="Pantau proses belanjaanmu mulai dari pembayaran hingga paket tiba di tujuan."
            />

            <div className="mt-6">
              {/*
                `null` = backend tidak bisa dihubungi, `[]` = benar-benar belum
                punya pesanan. Dua hal berbeda: menampilkan "Belum ada pesanan"
                saat server mati akan membuat pembeli mengira pesanannya hilang.
              */}
              {orders === null ? (
                <div>
                  <PlaceholderNotice
                    variant="paper"
                    title="Riwayat pesanan belum dapat dimuat"
                    body="Riwayat pesanan lagi ada kendala saat dimuat. Tenang, pesananmu tetap tersimpan aman. Coba muat ulang halaman ya!"
                  />
                  <Link
                    href="/me"
                    className={buttonClass({
                      variant: "outline",
                      className: "mt-4",
                    })}
                  >
                    Muat ulang halaman
                  </Link>
                </div>
              ) : orders.length === 0 ? (
                <div className="mx-auto max-w-xl py-8 text-center">
                  <h2 className="text-headline-sm text-text-primary">
                    Belum ada pesanan, nih
                  </h2>
                  {/* Di luar kartu putih: `text-secondary` di atas paper hanya
                      4,45:1, gagal AA untuk teks 16 px (spec §8). */}
                  <p className="mt-3 text-body-md text-text-primary">
                    Yuk, temukan produk pilihan idamanmu dan buat pesanan pertamamu!
                  </p>
                  <div className="mt-6 flex flex-col gap-3 tablet:flex-row tablet:justify-center">
                    <Link href="/produk" className={buttonClass({ size: "lg" })}>
                      Lihat katalog
                    </Link>
                    <Link
                      href="/kontak"
                      className={buttonClass({
                        variant: "outline",
                        size: "lg",
                      })}
                    >
                      Tanya customer service
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-border-soft rounded-lg border border-border-soft bg-surface-white">
                  {orders.map((order) => (
                    <li key={order.order_number} className="p-5 tablet:p-6">
                      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-label-md font-semibold tracking-wide text-brand-deep">
                            {order.order_number}
                          </p>
                          <p className="mt-1 text-label-sm text-text-secondary">
                            <time dateTime={order.placed_at}>
                              {formatTanggalPendek(order.placed_at)}
                            </time>{" "}
                            · {pluralItem(order.item_count)}
                          </p>
                          {order.first_item_name ? (
                            <p className="mt-1 text-label-sm text-text-secondary">
                              {order.first_item_name}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0">
                          <OrderStatusBadge
                            status={order.status}
                            statusLabel={order.status_label}
                          />
                        </div>
                      </div>

                      {order.needs_reconciliation ? (
                        <p className="mt-3 text-label-sm text-feedback-warn">
                          Pembayaran perlu dicek customer service.
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-3 border-t border-border-soft pt-4 tablet:flex-row tablet:items-center tablet:justify-between">
                        <p className="text-title-md font-semibold text-text-primary">
                          Total{" "}
                          {formatHarga(
                            order.grand_total,
                            order.grand_total_display,
                          )}
                        </p>
                        <Link
                          href={`/lacak?order=${encodeURIComponent(order.order_number)}`}
                          className={buttonClass({
                            variant: "outline",
                            className: "w-full tablet:w-auto",
                          })}
                        >
                          <span aria-hidden="true">Lihat detail</span>
                          <span className="sr-only">
                            {" "}
                            pesanan {order.order_number}
                          </span>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---- Kolom samping ---- */}
          <aside
            aria-label="Detail akun"
            className="flex flex-col gap-8 desktop:col-span-4 desktop:sticky desktop:top-28 desktop:self-start desktop:gap-6"
          >
            <Card heading="Identitas akun">
              {/*
                Bukan form: tidak ada endpoint profil, jadi dibaca sebagai teks
                lewat `<dl>`. Baris telepon tetap ada supaya bentuknya tidak
                berubah saat backend menyusul mengirim `phone`.
              */}
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-caption uppercase tracking-widest text-text-secondary">
                    Nama
                  </dt>
                  <dd className="mt-1 break-words text-title-md font-semibold text-text-primary">
                    {user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption uppercase tracking-widest text-text-secondary">
                    Alamat surel
                  </dt>
                  <dd className="mt-1 min-w-0 break-words text-body-md text-text-primary">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption uppercase tracking-widest text-text-secondary">
                    Nomor telepon
                  </dt>
                  <dd className="mt-1 text-body-md text-text-secondary">
                    Belum tersimpan di akun
                  </dd>
                  <dd className="mt-1 text-label-sm text-text-secondary">
                    Setiap pesanan menyimpan nomor penerima sendiri.
                  </dd>
                </div>
              </dl>
            </Card>

            <Card heading="Tautan cepat">
              <ul className="mt-3 flex flex-col gap-1">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center gap-3 rounded-md px-3 text-label-md font-semibold text-text-primary transition-colors hover:bg-surface-sage"
                    >
                      <LineIcon name={link.icon} />
                      <span className="min-w-0">{link.label}</span>
                      <LineIcon
                        name="arrow-forward"
                        className="ml-auto h-4 w-4 text-text-secondary"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            {/*
              Tanpa dialog konfirmasi: aksi ini reversibel dan `logoutAction`
              sudah mencabut token di server lalu redirect ke beranda.
            */}
            <form action={logoutAction}>
              <Button type="submit" variant="outline" fullWidth>
                Keluar dari akun
              </Button>
            </form>
          </aside>
        </div>
      </Container>
    </>
  );
}
