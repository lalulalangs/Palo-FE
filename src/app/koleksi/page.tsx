import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CollectionCard } from "@/components/catalog/CollectionCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/Button";
import { getCollectionList } from "@/lib/api";
import { formatAngka } from "@/lib/format";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/jsonld";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Daftar koleksi kurasi.
 *
 * Halaman ini menampilkan isi `Collections` — nama, tagline, `badge_label`,
 * banner, dan jumlah produk — yang tidak bisa ditampilkan halaman kategori mana
 * pun. Tidak ada filter/urut: kontrak `GET /collections` tidak punya parameter
 * urutan, jadi urutannya urutan `sort_order` admin.
 *
 * `GET /collections` juga TIDAK berpaginasi (backend memakai `limit(100)`),
 * jadi halaman ini merender seluruh isi tanpa kontrol halaman. Offset buatan
 * frontend akan berbohong soal total.
 */
const KOLEKSI_DESCRIPTION =
  "Koleksi pilihan dari Palo Mountain Goods. Yuk, pilih perlengkapan favorit yang paling pas buat aktivitasmu!";

export async function generateMetadata(): Promise<Metadata> {
  // Backend mati tidak boleh diindeks sebagai halaman koleksi normal, tapi
  // juga tidak boleh jadi 404 (lihat catatan di `kategori/[slug]`).
  const collections = await getCollectionList();

  if (collections === null) {
    return buildMetadata({
      title: "Koleksi belum dapat dimuat",
      description: API_UNAVAILABLE_NOTICE,
      path: "/koleksi",
      noIndex: true,
    });
  }

  return buildMetadata({
    title: "Koleksi",
    description: KOLEKSI_DESCRIPTION,
    path: "/koleksi",
  });
}

export default async function KoleksiPage() {
  const collections = await getCollectionList();
  const apiAvailable = collections !== null;
  const items = collections ?? [];

  const crumbs: BreadcrumbItem[] = [
    { name: "Beranda", href: "/" },
    { name: "Koleksi", href: "/koleksi" },
  ];

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Koleksi",
          path: "/koleksi",
          description: KOLEKSI_DESCRIPTION,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHeader
        // `eyebrow` sengaja kosong: warnanya gagal kontras AA (spec §9.3).
        title="Koleksi"
        description={KOLEKSI_DESCRIPTION}
        breadcrumbs={crumbs}
        aside={
          apiAvailable && items.length > 0 ? (
            <p className="text-body-sm text-text-secondary">
              {formatAngka(items.length)} koleksi
            </p>
          ) : null
        }
      />

      <Container className="py-8 tablet:py-12">
        {!apiAvailable ? (
          // Backend mati BUKAN "belum ada koleksi" — beda keadaan, beda teks.
          <div className="space-y-6">
            <PlaceholderNotice
              variant="paper"
              title="Koleksi belum dapat dimuat"
              body={API_UNAVAILABLE_NOTICE}
            />
            <Link
              href="/produk"
              className={buttonClass({
                variant: "outline",
                className: "w-full tablet:w-auto",
              })}
            >
              Lihat katalog
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="space-y-6">
            <PlaceholderNotice
              variant="sage"
              title="Koleksi baru lagi disiapkan"
              body="Kami sedang menyiapkan deretan koleksi terbaru buat petualanganmu. Yuk, cek katalog produk lainnya dulu!"
            />
            <Link
              href="/produk"
              className={buttonClass({
                variant: "outline",
                className: "w-full tablet:w-auto",
              })}
            >
              Lihat katalog
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid gap-4 tablet:grid-cols-2 tablet:gap-6 desktop:grid-cols-3">
              {items.map((collection, index) => (
                <li key={collection.slug} className="flex">
                  <CollectionCard
                    collection={collection}
                    // Hanya kartu pertama di layar atas yang diprioritaskan.
                    preload={index === 0}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-8 tablet:mt-10">
              <Link
                href="/produk"
                className={buttonClass({
                  variant: "outline",
                  className: "w-full tablet:w-auto",
                })}
              >
                Lihat semua produk
              </Link>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
