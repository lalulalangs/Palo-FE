import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SectionHeading } from "@/components/layout/PageHeader";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getBrand, getProduct, getProducts } from "@/lib/api";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Detail produk.
 *
 * Keputusan yang perlu dijelaskan:
 *
 * 1. **Tidak memetakan kegagalan API menjadi 404.** `getProduct`
 *    mengembalikan `null` baik saat produknya memang tidak ada maupun saat
 *    backend mati. Kalau keduanya dipetakan ke `notFound()`, satu outage
 *    singkat akan menghapus seluruh halaman produk dari indeks mesin pencari —
 *    persis kebalikan dari tujuan PRD §4.4. Karena itu `null` dirender sebagai
 *    placeholder jujur dengan status 200.
 * 2. **Tabel spesifikasi dari mockup lama dihapus.** Baris "Bahan Kain: 220
 *    GSM", "Metode Sablon: Discharge", dan "Asal Perakitan: Senaru" adalah
 *    klaim produk yang belum terverifikasi (PRD §1.1A). Yang ditampilkan hanya
 *    `description` dari backend.
 * 3. **Pickup dan garansi tukar ukuran dihapus.** OD-05 masih DITUNDA;
 *    kebijakan refund ada di OD-07.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  // `getProduct` mengembalikan `null` untuk 404 maupun backend mati. Judul
  // dan description menjelaskan keduanya secara jujur, dan `noIndex` dipakai
  // supaya halaman yang tidak bisa dipastikan tidak ikut terindeks.
  const name = product?.name ?? "Detail produk belum dapat dimuat";
  const description =
    product?.short_description ??
    product?.description ??
    "Detail produk dari katalog Palo Mountain Goods. Harga dan stok dibaca langsung dari server.";

  return buildMetadata({
    title: name,
    // `price_display` bisa berisi `[Harga dari Admin]`. Memasukkan string itu
    // ke meta description akan menampilkannya di hasil pencarian sebagai
    // placeholder literal, jadi description disusun dari copy yang sudah ada.
    description: description.slice(0, 200),
    path: `/produk/${slug}`,
    image: product?.images[0]?.url,
    ...(product ? {} : { noIndex: true }),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, brand, related] = await Promise.all([
    getProduct(slug),
    getBrand(),
    getProducts({
      q: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      sort: "latest",
      inStock: false,
      page: 1,
      perPage: 4,
    }),
  ]);

  if (!product) {
    // Lihat catatan 1 di kepala file: `null` berarti "belum bisa dipastikan",
    // bukan "pasti tidak ada". Menampilkan 404 di sini akan menghapus
    // halaman dari indeks saat backend hanya sedang lambat.
    return (
      <Container className="py-16 tablet:py-24">
        <div className="mx-auto max-w-2xl">
          <PlaceholderNotice
            title="Detail produk belum dapat dimuat"
            body={`${API_UNAVAILABLE_NOTICE} Jika produk ini memang tidak lagi diterbitkan, tautannya akan ditandai tidak ditemukan setelah server dapat dihubungi.`}
            variant="paper"
          />
          <Link
            href="/produk"
            className="mt-6 inline-flex min-h-11 items-center rounded-md border border-brand-forest bg-brand-forest px-5 text-label-md font-semibold text-surface-white transition-colors hover:bg-brand-deep"
          >
            Kembali ke katalog
          </Link>
        </div>
      </Container>
    );
  }

  const crumbs: BreadcrumbItem[] = [
    { name: "Beranda", href: "/" },
    { name: "Katalog", href: "/produk" },
    ...(product.category
      ? [
          {
            name: product.category.name,
            href: `/kategori/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, href: `/produk/${product.slug}` },
  ];

  // "Produk terkait" tidak boleh menyertakan produknya sendiri, dan tidak
  // boleh mengarang: kalau backend tidak punya produk lain, blok ini dilewati.
  const relatedProducts = (related?.products ?? [])
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <JsonLd
        data={productJsonLd({ product, brandName: brand?.brand_name ?? null })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <Container className="py-6 tablet:py-8">
        <Breadcrumbs items={crumbs} />
      </Container>

      <Container className="pb-12 tablet:pb-16">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-12">
          {/*
            Penanda uji M0: `media: []` adalah fakta data, bukan gambar yang
            gagal dimuat. Galeri merendernya sebagai blok tenang tanpa `<img>`.
          */}
          <div
            className="desktop:col-span-7"
            data-pdp-media={product.images.length === 0 ? "empty" : "present"}
          >
            <ProductGallery
              images={product.images}
              productName={product.name}
              badge={product.badge}
            />
          </div>

          {/* Panel tanpa kartu di mobile: bingkai hanya mulai 768 px. */}
          <div className="desktop:col-span-5">
            <div className="tablet:rounded-xl tablet:border tablet:border-border-soft tablet:bg-surface-white tablet:p-6">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>

        <section className="mt-8 border-t border-border-soft pt-8 tablet:mt-10">
          <h2 className="text-headline-sm text-text-primary">
            Deskripsi produk
          </h2>
          {product.description ? (
            <div className="mt-3 max-w-3xl space-y-3 text-body-md leading-relaxed text-text-secondary">
              {product.description
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph.trim()}</p>
                ))}
            </div>
          ) : (
            <div className="mt-3 max-w-2xl">
              <PlaceholderNotice
                title="Deskripsi belum diisi"
                body="PRD §1.1A: deskripsi, bahan, dan spesifikasi produk belum dapat dipastikan dari sumber publik yang terakses. Admin harus mengisinya sebelum dipublikasikan."
              />
            </div>
          )}
          {/*
            Jalan keluar satu-satunya untuk pertanyaan ukuran/ketersediaan.
            Tautan teks, bukan tombol sekunder: CTA primer tetap satu.
          */}
          <p className="mt-4 max-w-3xl text-body-md text-text-secondary">
            Ada pertanyaan soal ukuran atau ketersediaan sebelum memesan?
          </p>
          <Link
            href="/kontak"
            className="mt-1 inline-flex min-h-11 items-center text-label-md font-semibold text-brand-forest underline underline-offset-4 transition-colors hover:text-brand-deep"
          >
            Tanya Customer Service →
          </Link>
        </section>
      </Container>

      {relatedProducts.length > 0 ? (
        <section className="border-t border-border-soft bg-surface-white py-12 tablet:py-16">
          <Container>
            <SectionHeading
              eyebrow="Katalog"
              title="Produk lain"
              action={
                <Link
                  href="/produk"
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-label-md font-semibold text-brand-forest underline underline-offset-4 transition-colors hover:text-brand-deep"
                >
                  Lihat semua
                </Link>
              }
            />
            <div className="mt-6">
              <ProductGrid
                products={relatedProducts}
                apiAvailable={related !== null}
              />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
