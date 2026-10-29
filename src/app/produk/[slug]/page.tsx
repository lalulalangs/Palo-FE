import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SectionHeading } from "@/components/layout/PageHeader";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getBrand, getProduct, getProducts } from "@/lib/api";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  const name = product?.name ?? "Detail produk belum dapat dimuat";
  const description =
    product?.short_description ??
    product?.description ??
    "Detail produk dari katalog Palo Mountain Goods. Temukan berbagai produk pilihan yang siap menemani setiap aktivitasmu.";

  return buildMetadata({
    title: name,
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
    return (
      <Container className="py-16 tablet:py-24">
        <div className="mx-auto max-w-2xl">
          <PlaceholderNotice
            title="Detail produk belum dapat dimuat"
            body="Detail produk ini lagi ada kendala saat dimuat. Yuk, coba muat ulang halaman atau cari perlengkapan serupa di katalog kami!"
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

  const relatedProducts = (related?.products ?? [])
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <JsonLd
        data={productJsonLd({ product, brandName: brand?.brand_name ?? null })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {/* Breadcrumb container ramping */}
      <Container className="py-3 tablet:py-4">
        <Breadcrumbs items={crumbs} />
      </Container>

      {/* Main PDP 2-kolom: Kiri (Galeri + Akordeon), Kanan (Sticky Purchase Card) */}
      <Container className="pb-8 tablet:pb-12">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-8 desktop:items-start">
          {/* Kolom Kiri: Galeri Foto Kompak & Akordeon Informasi Produk */}
          <div
            className="desktop:col-span-7"
            data-pdp-media={product.images.length === 0 ? "empty" : "present"}
          >
            <ProductGallery
              images={product.images}
              productName={product.name}
              badge={product.badge}
            />
            <div className="mt-8 tablet:mt-10">
              <ProductAccordion description={product.description} />
            </div>
          </div>

          {/* Kolom Kanan: Sticky Purchase Panel */}
          <div className="desktop:col-span-5 desktop:sticky desktop:top-24 desktop:self-start">
            <div className="rounded-xl border border-border-soft bg-surface-white p-5 tablet:p-6 shadow-editorial">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>
      </Container>

      {/* Rekomendasi Produk Lain */}
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
