import Link from "next/link";
import type { Metadata } from "next";

import { HeroCarousel, type HeroSlide } from "@/components/hero/HeroCarousel";
import { LookbookSplit } from "@/components/home/LookbookSplit";
import { ManifestoPanel } from "@/components/home/ManifestoPanel";
import { OpeningFilm } from "@/components/home/OpeningFilm";
import { WhatsAppFab } from "@/components/home/WhatsAppFab";
import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { LineIcon } from "@/components/ui/LineIcon";
import { getBrand, getCategories, getHeroSliders, getProducts } from "@/lib/api";
import { PER_PAGE } from "@/lib/catalog-query";
import { resolveBrand, whatsappLink } from "@/lib/brand";
import { HOMEPAGE } from "@/lib/homepage-static";
import { webSiteJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import {
  API_UNAVAILABLE_NOTICE,
  PLACEHOLDER_NOTICE_BODY,
  PLACEHOLDER_NOTICE_TITLE,
} from "@/lib/placeholders";
import { SITE_NAME } from "@/lib/site";

/**
 * Beranda.
 *
 * ===================================================================
 *  SUSUNAN SECTION
 * ===================================================================
 *   1. Hero carousel     -> `GET /hero-sliders`
 *   2. Katalog produk    -> `GET /products`
 *   3. Lookbook split    -> statik (foto, `lib/homepage-static.ts`)
 *   4. Brand manifesto   -> statik (foto + teks)
 *   5. Opening film      -> statik (video)
 *   6. Kategori          -> `GET /categories`
 *
 * ===================================================================
 *  SECTION FOTO/VIDEO: STATIK, TANPA BACKEND
 * ===================================================================
 * Section 3-5 dulu membaca `GET /homepage` (`home.lookbook`,
 * `home.manifesto`, `home.film`). Endpoint itu TIDAK di-route di
 * `routes/api.php` — responsnya selalu 404, jadi section itu tidak pernah
 * tampil dan kemudian dihapus.
 *
 * Sekarang section foto/video dikembalikan sebagai kandungan STATIK: teksnya
 * dari `lib/homepage-static.ts`, dan asetnya (foto webp + video mp4) disajikan
 * Next.js sendiri dari `public/media/drive/`. Tiada permintaan ke backend.
 *
 * Banner promo, katalog, dan kategori tetap dibaca dari server. Section yang
 * butuh fakta operasional (kode voucher/promo, jam buka, alamat) sengaja TIDAK
 * dikembalikan kerana kodenya belum dikonfirmasi pemilik.
 *
 * ===================================================================
 *  YANG SENGAJA TIDAK IKUT MOCKUP
 * ===================================================================
 * 1. **Font.** UI memakai satu keluarga (BlinkMacSystemFont). Kelas
 *    (`font-headline`, `font-sans`, `font-mono`) dipertahankan supaya
 *    konsisten, tapi isinya satu font.
 *
 * 2. **Ikon Material Symbols dari CDN.** Diganti SVG inline (`LineIcon`)
 *    karena `<link>` ke Google Fonts adalah render-blocking.
 *
 * 3. **Kode voucher, harga, jam buka, dan alamat.** Fakta operasional yang
 *    datang dari panel admin; kalau belum diisi, tombol WhatsApp
 *    disembunyikan, bukan menautkan ke nomor kosong.
 */
export const metadata: Metadata = buildMetadata({
  // `title.template` dari root layout TIDAK berlaku untuk halaman di segment
  // yang sama dengan layout itu. Kalau judulnya "Beranda", tag `<title>` akan
  // muncul tanpa nama brand. Karena itu beranda menulis judul lengkapnya
  // sendiri, sama persis dengan `title.default` di root layout.
  title: `${SITE_NAME} — Merchandise Penjelajahan dari Senaru`,
  description:
    "Palo Mountain Goods (PALORINJANI) — merchandise penjelajahan dari Senaru, kaki Gunung Rinjani, Lombok Utara. Checkout lewat WhatsApp Customer Service tanpa akun.",
  path: "/",
});

const CATALOG_QUERY = {
  q: null,
  category: null,
  minPrice: null,
  maxPrice: null,
  sort: "latest",
  inStock: false,
  page: 1,
  perPage: PER_PAGE,
} as const;

/** Jumlah produk di grid beranda. */
const GRID_HOME = 8;

export default async function HomePage() {
  const [sliders, brand, categories, catalog] = await Promise.all([
    getHeroSliders(),
    getBrand(),
    getCategories(),
    getProducts({ ...CATALOG_QUERY }),
  ]);

  const resolved = resolveBrand(brand);

  /*
   * Pemetaan kontrak `/hero-sliders` -> bentuk tampilan `HeroSlide`.
   *
   * Dua jebakan yang wajib dipertahankan di sini:
   *
   * 1. `theme: "light"` = TEKS PUTIH + scrim gelap. `HeroFrame` menghitung
   *    `isDark = slide.theme !== "dark"`; mengirim `"dark"` justru menghasilkan
   *    teks gelap di atas scrim paper — hero jadi tidak terbaca tanpa error.
   *    `/hero-sliders` tidak punya field tema, jadi nilainya dipatok di sini.
   * 2. `overlayOpacity: 100`. Default komponen adalah 45, dan 45 itulah yang
   *    membuat teks hero gagal kontras AA (1,53:1 di atas foto terang).
   *
   * `order` sengaja tidak dipakai: server sudah mengurutkan (`sort_order asc`).
   */
  const heroSlides: HeroSlide[] = (sliders ?? []).map((item) => ({
    id: item.id,
    title: item.title ?? "",
    subtitle: item.description,
    eyebrow: item.badge,
    stampLeft: item.series_tag,
    stampRight: item.location_tag,
    ctaLabel: item.actions.primary.label,
    ctaUrl: item.actions.primary.url,
    cta2Label: item.actions.secondary.label,
    cta2Url: item.actions.secondary.url,
    // Satu aset 16:9 disebar ke tiga slot supaya tipe `HeroSlide` yang ada
    // tidak perlu diubah; komponen tidak lagi punya aturan crop 6:5 tablet.
    imageUrl: item.images.desktop_url,
    imageLandscapeUrl: item.images.desktop_url,
    imageTabletUrl: item.images.desktop_url,
    // `null` = tidak ada crop 4:5 -> komponen memakai `desktop_url` di <768.
    imagePortraitUrl: item.images.mobile_url,
    // `null` -> `alt=""` (dekoratif), BUKAN diisi judul: `h1` sudah
    // menyuarakan kalimat yang sama.
    imageAlt: item.images.alt_text,
    theme: "light",
    overlayOpacity: 100,
  }));

  const products = catalog?.products ?? [];
  const catalogAvailable = catalog !== null;

  // Kanal CS dari `app_settings`. Kalau belum diisi, `null` — dan tombol
  // WhatsApp disembunyikan, bukan menautkan ke `wa.me/` kosong yang membuka
  // chat tanpa tujuan.
  const waHref = resolved.whatsappLink
    ? whatsappLink(
        resolved,
        `Halo ${resolved.brandName}, saya ingin bertanya tentang merchandise Senaru.`,
      )
    : null;

  return (
    <>
      <JsonLd data={webSiteJsonLd()} />

      {/* ---- 1. Hero ---- */}
      <HeroCarousel
        slides={heroSlides}
        fallbackTitle={SITE_NAME}
        fallbackTagline={resolved.tagline}
        fallbackEybrow="Koleksi Busana & Cenderamata"
      />

      {/* ---- 2. Katalog produk ---- */}
      <section className="border-b border-border-soft bg-surface-white py-14 tablet:py-20">
        <Container>
          <CatalogHeader
            title="PALO : T-SHIRT &amp; GRAFIK"
            ctaLabel="Lihat Semua"
            ctaHref="/produk"
          />

          {/*
            Grid produk yang sama dengan `/produk`, `/kategori/[slug]`, dan
            "Produk lain" — jadi katalog di semua halaman tidak bisa melenceng
            satu sama lain. Batas 8 kartu lewat prop `limit`, bukan potong
            manual, supaya `ProductGrid` yang memegang aturan "backend mati vs
            katalog kosong".
          */}
          <ProductGrid
            products={products}
            apiAvailable={catalogAvailable}
            emptyTitle={PLACEHOLDER_NOTICE_TITLE}
            emptyBody={PLACEHOLDER_NOTICE_BODY}
            limit={GRID_HOME}
          />
        </Container>
      </section>

      {/* ---- 3. Lookbook (foto, statik) ---- */}
      <LookbookSplit panels={HOMEPAGE.lookbook} />

      {/* ---- 4. Brand manifesto (foto + teks, statik) ---- */}
      <ManifestoPanel content={HOMEPAGE.manifesto} />

      {/* ---- 5. Opening film (video, statik) ---- */}
      <OpeningFilm content={HOMEPAGE.film} />

      {/* ---- 6. Kategori aktif ---- */}
      {categories && categories.length > 0 ? (
        <section className="border-b border-border-soft bg-surface-white py-12 tablet:py-16">
          <Container>
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-text-primary">
              Kategori
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/kategori/${category.slug}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-paper px-4 py-3 text-title-md text-text-primary transition-colors hover:border-brand-pine hover:bg-surface-sage"
                  >
                    <span>{category.name}</span>
                    {category.products_count !== null ? (
                      <span className="text-body-sm text-text-secondary">
                        {category.products_count} produk
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* ---- Catatan jujur tentang data yang belum dikonfirmasi ----
       *
       * Halaman ini dibangun dari API, jadi nama, harga, dan stok selalu
       * dibaca dari server. Yang masih placeholder adalah bahan dan berat —
       * karena tidak terlihat di foto dan belum dikonfirmasi pemilik.
       */}
      <section className="bg-surface-paper py-10">
        <Container>
          <p className="max-w-3xl text-body-sm leading-relaxed text-text-secondary">
            Halaman ini dibangun di atas{" "}
            <code className="rounded-sm bg-surface-sage px-1 py-0.5 text-body-sm">
              KONTRAK-API.md
            </code>{" "}
            sehingga nama, harga, dan stok selalu dibaca dari server — tidak ada
            satu pun yang ditulis manual di kode. Sisa bahan dan berat masih
            placeholder karena belum dikonfirmasi pemilik.
          </p>

          {!catalogAvailable ? (
            <PlaceholderNotice
              title="Katalog belum dapat dimuat"
              body={API_UNAVAILABLE_NOTICE}
              className="mt-4"
            />
          ) : null}
        </Container>
      </section>

      {/* ---- Tombol WhatsApp mengambang ---- */}
      {waHref ? <WhatsAppFab href={waHref} /> : null}
    </>
  );
}

/**
 * Kepala section katalog: label kecil + judul + tombol "Lihat Semua".
 */
function CatalogHeader({
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string | null;
  title: string;
  ctaLabel: string | null;
  ctaHref: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between border-b border-border-soft pb-4">
      <div>
        {eyebrow ? (
          <span className="block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            {eyebrow}
          </span>
        ) : (
          <span className="block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            KATALOG UTAMA
          </span>
        )}

        <h2 className="mt-1 text-base font-bold uppercase tracking-wider text-text-primary tablet:text-lg">
          {title}
        </h2>
      </div>

      {ctaLabel ? (
        <Link
          href={ctaHref}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:text-brand-forest"
        >
          {ctaLabel}
          <LineIcon name="arrow-forward" className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
