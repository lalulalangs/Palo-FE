import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLd } from "@/components/JsonLd";
import { CatalogRefinements, CatalogSort, ClearFilters } from "@/components/catalog/CatalogControls";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategories, getProducts } from "@/lib/api";
import {
  buildCatalogSearchParams,
  parseCatalogParams,
  type RawSearchParams,
} from "@/lib/catalog-query";
import { formatAngka } from "@/lib/format";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";
import type { BreadcrumbItem } from "@/lib/jsonld";

/**
 * Listing kategori.
 *
 * Dibuat sebagai route terpisah (bukan sekadar `/produk?category=…`) karena:
 * - kategori punya nama sendiri, jadi bisa punya `title`, `description`, dan
 *   canonical sendiri (PRD §4.4);
 * - `GET /categories` hanya mengembalikan kategori yang dipakai produk aktif,
 *   sehingga slug yang tidak ada di sana memang tidak punya halaman. Di situ
 *   `notFound()` adalah keputusan yang benar — berbeda dari detail produk,
 *   karena di sini kita tahu slug-nya tidak dikenal, bukan sekadar gagal dimuat.
 *
 * Filter lain (pencarian, harga, atribut, urutan) tetap bekerja di halaman ini
 * dan tetap menulis ke URL, jadi `/kategori/x?sort=price_asc` bisa dibagikan.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories?.find((item) => item.slug === slug) ?? null;

  // `categories === null` berarti backend tidak bisa dihubungi, `categories`
  // berisi daftar tapi slug tidak ada di dalamnya berarti kategori memang tidak
  // dikenal. Keduanya menghasilkan halaman tanpa indeks, tapi judulnya harus
  // jujur soal mana yang terjadi.
  if (!category) {
    const unknown = categories !== null;
    return buildMetadata({
      title: unknown
        ? "Kategori tidak ditemukan"
        : "Kategori belum dapat dimuat",
      description: unknown
        ? "Kategori yang kamu cari belum tersedia di katalog aktif."
        : "Informasi kategori produk lagi disiapkan. Yuk, coba cek beberapa saat lagi!",
      path: `/kategori/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: category.name,
    description: `Temukan koleksi pilihan ${category.name} dari Palo Mountain Goods untuk melengkapi setiap aktivitas luar ruanganmu.`,
    path: `/kategori/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const catalogParams = parseCatalogParams(raw);

  // Slug dari URL dipaksa menjadi filter kategori, apa pun yang tertulis di
  // query string. Kalau tidak, `/kategori/apparel?category=topi` akan
  // menampilkan isi kategori "topi" di halaman kategori "apparel" —
  // membingungkan sekaligus merusak canonical.
  const effective = { ...catalogParams, category: slug };

  const [categories, catalog] = await Promise.all([
    getCategories(),
    getProducts(effective),
  ]);

  const category = categories?.find((item) => item.slug === slug);
  if (categories && !category) {
    // Daftar kategori diketahui dan slug ini tidak ada di sana — inilah satu
    //-satunya kondisi di mana 404 memang jawaban yang benar. Saat backend
    // mati (`categories === null`) slug tidak bisa diverifikasi, jadi halaman
    // tetap dirender dengan status 200 dan placeholder; memetakan outage ke
    // 404 akan menghapus kategori dari indeks mesin pencari.
    notFound();
  }
  const slugKnown = categories !== null;

  const products = catalog?.products ?? [];
  const meta = catalog?.meta ?? null;
  const apiAvailable = catalog !== null;

  const crumbs: BreadcrumbItem[] = [
    { name: "Beranda", href: "/" },
    { name: "Katalog", href: "/produk" },
    { name: category?.name ?? slug, href: `/kategori/${slug}` },
  ];

  const pageHref = (page: number) => {
    const query = buildCatalogSearchParams(effective, { page }).toString();
    return query ? `/kategori/${slug}?${query}` : `/kategori/${slug}`;
  };

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: category?.name ?? slug,
          path: `/kategori/${slug}`,
          description: category
            ? `Katalog produk kategori ${category.name}.`
            : null,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHeader
        eyebrow="Kategori"
        title={
          category?.name ??
          (slugKnown ? "Kategori tidak ditemukan" : "Kategori belum dapat dimuat")
        }
        description={
          category
            ? `Temukan pilihan terbaik ${category.name} dari Palo Mountain Goods. Yuk, pilih perlengkapan favoritmu!`
            : slugKnown
              ? "Kategori ini belum tersedia di katalog aktif."
              : "Informasi kategori ini sedang disiapkan. Yuk, cek kategori pilihan lainnya di katalog!"
        }
        breadcrumbs={crumbs}
        aside={
          meta ? (
            <p className="text-body-sm text-text-secondary">
              {formatAngka(meta.total)} produk
            </p>
          ) : null
        }
      />

      <Container className="py-8 tablet:py-12">
        <div className="grid min-w-0 gap-8 desktop:grid-cols-12 desktop:gap-10">
          <aside
            aria-label="Filter kategori"
            className="min-w-0 space-y-6 desktop:col-span-4"
          >
            <Suspense fallback={null}>
              <CatalogRefinements />
            </Suspense>
            <ClearFilters href={`/kategori/${slug}`} />
          </aside>

          <div className="min-w-0 desktop:col-span-8">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
              <p role="status" aria-live="polite" className="text-label-md text-text-secondary">
                {apiAvailable
                  ? `Menampilkan ${formatAngka(products.length)} dari ${formatAngka(meta?.total ?? 0)} produk`
                  : "Katalog belum dapat dimuat saat ini. Yuk, coba beberapa saat lagi!"}
              </p>
              <Suspense fallback={null}>
                <CatalogSort value={effective.sort} />
              </Suspense>
            </div>

            <div className="mt-6">
              <ProductGrid
                products={products}
                apiAvailable={apiAvailable}
                emptyTitle={
                  apiAvailable
                    ? "Belum ada produk di kategori ini"
                    : "Kategori belum dapat dimuat"
                }
                emptyBody={
                  apiAvailable
                    ? "Produk untuk kategori ini sedang kami siapkan. Yuk, cek kategori seru lainnya!"
                    : API_UNAVAILABLE_NOTICE
                }
              />
            </div>

            {meta ? (
              <Pagination
                className="mt-10"
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                buildHref={pageHref}
              />
            ) : null}
          </div>
        </div>
      </Container>
    </>
  );
}
