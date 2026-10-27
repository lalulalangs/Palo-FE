import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CollectionBanner } from "@/components/catalog/CollectionCard";
import { Pagination } from "@/components/catalog/Pagination";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonClass } from "@/components/ui/Button";
import { getCollectionDetail } from "@/lib/api";
import { parseCatalogParams, type RawSearchParams } from "@/lib/catalog-query";
import { formatAngka, formatTanggal } from "@/lib/format";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/jsonld";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { PLACEHOLDER } from "@/lib/placeholders";

/**
 * Detail koleksi.
 *
 * Tiga keputusan yang perlu dijelaskan:
 *
 * 1. **Outage bukan 404.** `getCollectionDetail` mengembalikan `"not_found"`
 *    hanya saat backend benar-benar menjawab 404 (koleksi tidak ada / sudah
 *    lewat `ended_at`), dan `null` saat backend mati. Hanya yang pertama
 *    memanggil `notFound()`; memetakan outage ke 404 akan mencabut seluruh
 *    halaman koleksi dari indeks saat backend cuma lambat 8 detik.
 * 2. **Tidak ada konten karangan.** Tagline, badge, banner, dan deskripsi
 *    hanya dirender bila server mengirimnya. Deskripsi koleksi opsional di
 *    kontrak, jadi ketiadaannya bukan kegagalan data — seksi "Cerita koleksi"
 *    dilewati seluruhnya.
 * 3. **Jumlah produk dari `products.pagination.total`.** Detail tidak punya
 *    `products_count` (`whenLoaded('products')`, bukan `withCount`), jadi
 *    memakainya akan selalu kosong.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const page = parseCatalogParams(raw).page;
  const result = await getCollectionDetail(slug, page);
  const path = `/koleksi/${slug}`;

  // `notFound()` TIDAK dipanggil di sini — bodynya yang memutuskan. Dengan
  // begitu hanya ada satu jalur 404 yang harus dijaga sinkron.
  if (result === "not_found") {
    return buildMetadata({
      title: "Koleksi tidak ditemukan",
      description:
        "Koleksi yang Anda cari tidak ada atau sudah berakhir di Palo Mountain Goods.",
      path,
      noIndex: true,
    });
  }

  if (result === null) {
    return buildMetadata({
      title: "Koleksi belum dapat dimuat",
      description:
        "Daftar koleksi belum dapat dibaca dari server, jadi halaman ini tidak menampilkan koleksi apa pun.",
      path,
      noIndex: true,
    });
  }

  const { collection } = result;
  const name = collection.name.trim().length > 0 ? collection.name : PLACEHOLDER.collection;

  // `seo_meta` bisa `null` atau berisi string kosong (textarea Filament boleh
  // kosong); keduanya diperlakukan sama: pakai fallback berikutnya.
  const title = collection.seo_meta?.meta_title ?? name;
  const description =
    collection.seo_meta?.meta_description ??
    collection.tagline ??
    `Koleksi ${name} di Palo Mountain Goods. Jumlah produk dan ketersediaan dibaca langsung dari server.`;

  return buildMetadata({
    title,
    description,
    path,
    image: collection.banner_desktop ?? collection.banner_mobile ?? undefined,
    // `?page=2` tidak punya canonical sendiri — sama seperti aturan `/produk`.
    ...(page > 1 ? { noIndex: true } : {}),
  });
}

export default async function KoleksiDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  // `parseCatalogParams` mengabaikan `?page=abc` / `?page=-1` → 1, jadi tidak
  // perlu helper parsing baru.
  const page = parseCatalogParams(raw).page;
  const result = await getCollectionDetail(slug, page);

  if (result === "not_found") notFound();

  const daftarCrumbs: BreadcrumbItem[] = [
    { name: "Beranda", href: "/" },
    { name: "Koleksi", href: "/koleksi" },
  ];

  if (result === null) {
    // Backend mati: halaman tetap 200 dengan placeholder, bukan 404.
    return (
      <>
        <PageHeader
          title="Koleksi belum dapat dimuat"
          breadcrumbs={daftarCrumbs}
        />
        <Container className="py-8 tablet:py-12">
          <div className="space-y-6">
            <PlaceholderNotice
              variant="paper"
              title="Koleksi belum dapat dimuat"
              body="Daftar koleksi belum dapat dibaca dari server, jadi halaman ini tidak menampilkan koleksi apa pun."
            />
            <Link
              href="/koleksi"
              className={buttonClass({
                variant: "outline",
                className: "w-full tablet:w-auto",
              })}
            >
              Semua koleksi
            </Link>
          </div>
        </Container>
      </>
    );
  }

  const { collection, products, pagination } = result;
  const name = collection.name.trim().length > 0 ? collection.name : PLACEHOLDER.collection;
  const total = pagination.total;
  const kosong = total === 0;
  // Halaman yang melewati halaman terakhir: produk kosong TAPI koleksi berisi.
  const halamanHabis = products.length === 0 && total > 0;

  const crumbs: BreadcrumbItem[] = [
    ...daftarCrumbs,
    { name, href: `/koleksi/${slug}` },
  ];

  const pageHref = (target: number) =>
    target > 1 ? `/koleksi/${slug}?page=${target}` : `/koleksi/${slug}`;

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name,
          path: `/koleksi/${slug}`,
          description:
            collection.tagline ?? collection.seo_meta?.meta_description ?? null,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {/*
        Breadcrumb dirender terpisah, BUKAN lewat prop `breadcrumbs` PageHeader:
        urutan visual yang diminta (banner di antara remah roti dan H1) tidak
        mungkin dicapai kalau remah roti hidup di dalam blok kepala.
      */}
      <Container className="pb-4 pt-6 tablet:pt-8">
        <Breadcrumbs items={crumbs} />
      </Container>

      <Container>
        <CollectionBanner
          desktop={collection.banner_desktop}
          mobile={collection.banner_mobile}
          badge={collection.badge_label}
          preload
          // 21:9 di ≥1280, bukan 16:9: pada 1304px lebar, 16:9 setinggi 733px
          // dan judul koleksi terdorong keluar layar laptop.
          className="aspect-[4/5] tablet:aspect-video desktop:aspect-[21/9]"
        />
      </Container>

      <PageHeader
        // `eyebrow` sengaja kosong: warnanya gagal kontras AA (spec §9.3).
        title={name}
        description={collection.tagline ?? undefined}
        aside={
          <div className="space-y-1">
            <p className="text-body-sm text-text-secondary">
              {`${formatAngka(total)} produk`}
            </p>
            {collection.ended_at ? (
              <p className="text-body-sm text-text-secondary">
                Tayang sampai {formatTanggal(collection.ended_at)}
              </p>
            ) : null}
          </div>
        }
      />

      <Container className="py-8 tablet:py-12">
        {collection.description ? (
          <section>
            <h2 className="text-headline-sm text-text-primary tablet:text-headline-md">
              Cerita koleksi
            </h2>
            {/* Dipisah per baris baru, pola yang sama dengan detail produk. */}
            <div className="mt-3 max-w-3xl space-y-4 text-body-md leading-relaxed text-text-secondary">
              {collection.description
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph.trim()}</p>
                ))}
            </div>
          </section>
        ) : null}

        <section className={collection.description ? "mt-12" : ""}>
          <h2 className="text-headline-sm text-text-primary tablet:text-headline-md">
            Produk dalam koleksi
          </h2>

          {/* Pindah halaman = perubahan hasil yang perlu diumumkan. */}
          <p
            role="status"
            aria-live="polite"
            className="mt-2 text-label-md text-text-secondary"
          >
            {`Menampilkan ${formatAngka(products.length)} dari ${formatAngka(total)} produk`}
          </p>

          <div className="mt-6">
            {halamanHabis ? (
              <div className="space-y-4">
                <PlaceholderNotice
                  variant="sage"
                  title="Halaman ini tidak berisi produk"
                  body="Tautan halaman yang Anda buka melewati halaman terakhir koleksi ini."
                />
                <Link
                  href={`/koleksi/${slug}?page=1`}
                  className={buttonClass({
                    variant: "outline",
                    className: "w-full tablet:w-auto",
                  })}
                >
                  Kembali ke halaman pertama
                </Link>
              </div>
            ) : kosong ? (
              <div className="space-y-4">
                <PlaceholderNotice
                  variant="sage"
                  title="Koleksi ini belum berisi produk"
                  body="Admin belum menambahkan produk aktif ke koleksi ini."
                />
                <Link href="/produk" className={buttonClass()}>
                  Lihat katalog
                </Link>
              </div>
            ) : (
              // `ProductGrid` apa adanya; backend hidup dan koleksinya berisi.
              <ProductGrid products={products} apiAvailable />
            )}
          </div>

          <Pagination
            className="mt-10"
            label="Navigasi halaman koleksi"
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            buildHref={pageHref}
          />

          {/*
            Breadcrumb sudah memberi jalan pulang, tapi setelah menggulir tiga
            layar produk tautan di dasar halaman jauh lebih berguna.
          */}
          <div className="mt-8 tablet:mt-10">
            <Link
              href="/koleksi"
              className={buttonClass({
                variant: "outline",
                className: "w-full tablet:w-auto",
              })}
            >
              Semua koleksi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
