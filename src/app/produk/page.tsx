import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import {
  CatalogRefinements,
  CatalogSearch,
  CatalogSort,
  CategoryPills,
  ClearFilters,
} from "@/components/catalog/CatalogControls";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonClass } from "@/components/ui/Button";
import { getCategories, getProducts } from "@/lib/api";
import {
  buildCatalogSearchParams,
  describeCatalog,
  parseCatalogParams,
  type RawSearchParams,
} from "@/lib/catalog-query";
import { formatAngka } from "@/lib/format";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Katalog.
 *
 * Estado katalog tidak pernah disimpan di memori: `searchParams` adalah satu-
 *-satunya sumber, dan setiap kontrol menulis balik ke URL. Itu memenuhi
 * PRD §3.3 AC ("filter yang sama otomatis diterapkan ketika tautan dibuka
 * orang lain") sekaligus membuat setiap kombinasi filter punya URL yang bisa
 * di-share dan diindeks.
 *
 * Filter yang tersedia dibatasi pada yang DIDUKUNG backend: pencarian
 * (`search`), kategori, rentang harga (`min_price`/`max_price`), ketersediaan
 * (`in_stock`), dan urutan (`sort`). Filter atribut (`attribute[...]`) dan
 * `available_filters` dari dokumen TIDAK diimplementasikan backend, jadi tidak
 * lagi ditawarkan — daftar kategori diambil dari `GET /categories`.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const categories = await getCategories();
  const activeCategory =
    categories?.find((category) => category.slug === params.category) ?? null;

  // `canonical` selalu menunjuk ke katalog bersih: kombinasi filter adalah
  // hasil yang boleh dibagikan, tapi tidak boleh jadi URL kanonik terpisah —
  // kalau tidak, satu produk terindeks berkali-kali dengan `?page=2`,
  // `?in_stock=1`, dan seterusnya.
  return buildMetadata({
    title: activeCategory ? `Katalog — ${activeCategory.name}` : "Katalog Produk",
    description: describeCatalog(params, activeCategory?.name ?? null),
    path: "/produk",
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);

  const [catalog, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  const products = catalog?.products ?? [];
  const meta = catalog?.meta ?? null;
  const apiAvailable = catalog !== null;

  // Daftar kategori dari `GET /categories`. Dulu ada jalur
  // `meta.available_filters.categories`, tapi backend tidak mengirim
  // `available_filters` sama sekali.
  const categoryOptions = (categories ?? []).map((category) => ({
    name: category.name,
    slug: category.slug,
  }));

  const activeCategoryName =
    categoryOptions.find((category) => category.slug === params.category)?.name ??
    null;

  const hasActiveFilters =
    params.q !== null ||
    params.category !== null ||
    params.minPrice !== null ||
    params.maxPrice !== null ||
    params.inStock;

  const pageHref = (page: number) => {
    const query = buildCatalogSearchParams(params, { page }).toString();
    return query ? `/produk?${query}` : "/produk";
  };

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: activeCategoryName ? `Katalog — ${activeCategoryName}` : "Katalog Produk",
          path: "/produk",
          description: describeCatalog(params, activeCategoryName),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", href: "/" },
          { name: "Katalog", href: "/produk" },
        ])}
      />

      <PageHeader
        eyebrow="Katalog resmi"
        title={activeCategoryName ?? "Koleksi & Perlengkapan"}
        description="Jelajahi berbagai produk pilihan terbaik kami. Yuk, temukan produk favorit yang pas buat temani keseharian dan aktivitasmu!"
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Katalog", href: "/produk" },
        ]}
      >
        <div className="mt-6 rounded-lg border border-border-soft bg-surface-paper p-3 tablet:p-4">
          <Suspense
            // `useSearchParams` pada Client Component memaksa bailout ke
            // render sisi-klien; `Suspense` menjaga agar shell tetap
            // terkirim lebih dulu (PRD §3.1 AC).
            fallback={<div className="h-11" aria-hidden="true" />}
          >
            <CatalogSearch initialQuery={params.q ?? ""} />
          </Suspense>
        </div>
      </PageHeader>

      <Container className="py-8 tablet:py-12">
        <div className="grid min-w-0 gap-8 desktop:grid-cols-12 desktop:gap-10">
          {/* ---- Panel filter ---- */}
          <aside
            aria-label="Filter katalog"
            className="min-w-0 space-y-6 desktop:col-span-4 desktop:col-start-1"
          >
            <Suspense fallback={null}>
              <CategoryPills
                categories={categoryOptions}
                activeSlug={params.category}
                totalLabel={meta ? formatAngka(meta.total) : null}
              />
            </Suspense>

            <hr className="border-t border-border-soft" />

            <Suspense fallback={null}>
              <CatalogRefinements />
            </Suspense>

            {hasActiveFilters ? <ClearFilters href="/produk" /> : null}
          </aside>

          {/* ---- Hasil ---- */}
          <div className="min-w-0 desktop:col-span-8">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
              {/*
                `role="status"`: pembaca layar diberi tahu berapa hasil yang
                tampil setiap kali filter berubah, tanpa memindahkan fokus
                pengguna ke belakang halaman.
              */}
              <p
                role="status"
                aria-live="polite"
                className="text-label-md text-text-secondary"
              >
                {apiAvailable
                  ? `Menampilkan ${formatAngka(products.length)} dari ${formatAngka(meta?.total ?? 0)} produk`
                  : "Katalog belum dapat dimuat saat ini. Yuk, coba beberapa saat lagi!"}
              </p>

              <Suspense fallback={null}>
                <CatalogSort value={params.sort} />
              </Suspense>
            </div>

            <div className="mt-6">
              <ProductGrid
                products={products}
                apiAvailable={apiAvailable}
                emptyTitle={
                  !apiAvailable
                    ? "Katalog belum dapat dimuat"
                    : params.q
                      ? "Produk tidak ditemukan"
                      : "Belum ada produk di katalog ini"
                }
                emptyBody={
                  !apiAvailable
                    ? API_UNAVAILABLE_NOTICE
                    : params.q
                      ? `Tidak ada produk yang cocok dengan "${params.q}". Coba kata kunci lain, atau hapus filter yang aktif.`
                      : "Produk untuk kategori atau pencarian ini belum tersedia. Yuk, cek koleksi perlengkapan kami yang lain!"
                }
              />
            </div>

            {/*
              PRD §3.3 AC: pencarian tanpa hasil harus menawarkan saran
              kategori populer. Kategori hanya ditampilkan kalau backend
              memang mengirimkannya — tidak ada daftar kategori karangan.
            */}
            {products.length === 0 && apiAvailable && categoryOptions.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-title-lg text-text-primary">
                  Coba kategori lain
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/kategori/${category.slug}`}
                        className={buttonClass({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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
