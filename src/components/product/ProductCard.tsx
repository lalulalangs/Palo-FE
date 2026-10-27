import Link from "next/link";

import { LineIcon } from "@/components/ui/LineIcon";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatHarga } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/placeholders";
import type { ProductListItem } from "@/lib/types";

/**
 * Kartu produk untuk semua grid katalog: beranda, `/produk`,
 * `/kategori/[slug]`, dan "Produk lain" di halaman detail.
 *
 * ===================================================================
 *  SATU KARTU, BUKAN DUA
 * ===================================================================
 * Sebelumnya ada dua: `ProductCard` (katalog) dan `home/LookbookProductCard`
 * (beranda). Keduanya menampilkan data yang sama ke URL yang sama, dengan
 * bentuk berbeda. Dua implementasi untuk satu tampilan berarti satu dari
 * dua pasti kedaluwarsa — dan memang begitu: versi katalog tidak punya
 * badge promosi, versi beranda tidak punya gambar cadangan.
 *
 * Sekarang hanya ada satu, dan bentuknya adalah versi beranda
 * (tepi siku, border tipis, rasio 3:4, label mono) karena itu yang
 * diminta pemilik untuk seluruh katalog.
 *
 * ===================================================================
 *  YANG DIPINDAI DARI KARTU LAMA
 * ====================================================================
 * 1. **Gambar cadangan.** `ImageWithFallback`, bukan `image ? ... : null`.
 *    Tanpa itu, produk tanpa foto menampilkan kotak kosong seukuran kartu
 *    penuh — di katalog yang berarti 24 kotak kosong.
 * 2. **Satu titik fokus.** Pola *stretched link*: satu `<a>` di judul
 *    dengan `::after` yang menutupi kartu. Tombol "Lihat Detail" versi
 *    lama adalah `<a>` kedua ke URL yang sama, jadi tiap kartu punya dua
 *    tab stop. Di beranda (8 kartu) itu 16 tab stop; di `/produk` dengan
 *    24 kartu jadi 48, dan pembaca layar akan membacakan tautan yang
 *    sama dua kali. Karena itu tombol itu sekarang murni visual
 *    (`aria-hidden`) dan klik tetap berfungsi lewat stretched
 *    link yang menutupi seluruh kartu.
 * 3. **Harga** lewat `formatHarga(price_min, price_display)`. Angka `0`
 *    tidak pernah dirender sebagai "Rp 0" — itu berarti mengarang harga
 *    (PRD §1.1A).
 * 4. **Placeholder** untuk nama & koleksi, supaya grid tidak pernah
 *    punya baris kosong yang terlihat seperti bug.
 *
 * ===================================================================
 *  BADGE: DUA SUMBER, DUA SLOT
 * ===================================================================
 *   - `product.badge`         -> keputusan promosi, diisi admin.
 *   - `product.is_out_of_stock` -> fakta, dihitung dari `on_hand`.
 *
 * "Sisa Sedikit" sengaja TIDAK dihitung dari `on_hand`: kalau begitu,
 * produk yang baru restok ikut berlabel "sisa sedikit" hanya karena
 * kebetulan menipis, dan labelnya hilang sendiri padahal produknya tidak
 * berubah. Alasan lengkap ada di migration
 * `add_badge_to_products_table.php`.
 *
 * Keduanya ditampilkan bersamaan. Versi lama memakai satu slot, dan
 * karena semua produk masih `on_hand = 0`, kartu hanya menampilkan
 * "Stok Habis" — label "Batch 01" dan "Signature" yang diisi admin tidak
 * pernah terlihat sama sekali.
 */
export function ProductCard({
  product,
  preload = false,
  priority,
}: {
  product: ProductListItem;
  /**
   * Cerminan prop `preload` Next.js 16 (pengganti `priority` yang deprecated).
   * `true` hanya untuk kartu pertama di layar di atas lipatan (LCP).
   */
  preload?: boolean;
  /** Alias lama; dipakai beranda. Disatukan ke `preload` di bawah. */
  priority?: boolean;
}) {
  const name =
    product.name.trim().length > 0 ? product.name : PLACEHOLDER.productName;
  const categoryName = product.category?.name ?? PLACEHOLDER.collection;
  const price = formatHarga(product.price_min, product.price_display);
  const ukuran = product.sizes ?? [];
  const gambar = product.image?.url ?? null;

  return (
    // `relative` untuk overlay stretched link; `w-full` WAJIB — tanpa itu
    // kartu menyusut ke lebar teksnya (lihat catatan panjang di git blame
    // kartu ini: `next/image` `fill` itu `position: absolute`, jadi tidak
    // menyumbang lebar intrinsik sama sekali).
    <article className="group relative flex w-full flex-col">
      {/*
        `@container` di sini, bukan di `ProductGrid`, karena yang menentukan
        apakah dua badge muat satu baris adalah lebar KARTU — dan lebar kartu
        bergantung pada lebar kolomnya. Kartu yang sama bisa 308px di
        beranda (container 1304px) dan 269px di `/produk` (container 856px,
        grid 8 dari 12 kolom). Breakpoint berbasis viewport tidak bisa
        membeda-bedakan keduanya; breakpoint berbasis container bisa.
      */}
      <div className="@container relative mb-3 aspect-[3/4] overflow-hidden border border-border-soft bg-surface-paper">
        <ImageWithFallback
          src={gambar}
          alt={product.image?.alt ?? name}
          fill
          preload={preload || priority || false}
          // Lebar kartu nyata: 164px (2 kolom) → ~270px (3 kolom) → 308px
          // (4 kolom). Nilai di sini sedikit lebih besar dari aslinya,
          // yang aman: `next/image` memilih varian terkecil yang cukup,
          // jadi keterlibihan hanya berarti unduhan sedikit lebih besar.
          sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 46vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {product.badge ? (
          <span
            className={[
              "absolute left-2.5 top-2.5 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
              product.badge_tone === "warning"
                ? "border-secondary-container bg-secondary-container text-text-primary"
                : "border-border-soft bg-surface-white/95 text-brand-forest",
            ].join(" ")}
          >
            {product.badge}
          </span>
        ) : null}

        {product.is_out_of_stock ? (
          /*
            Lebar badge terukur: 76px ("Signature") + 79px ("Stok Habis") +
            margin 20px = 175px minimum. Di bawah itu keduanya saling menutup
            dan teksnya tak terbaca. Di bawah 180px container, badge kedua
            turun ke baris berikutnya; di atasnya kembali ke pojok kanan.
          */
          <span className="absolute left-2.5 top-9 border border-border-soft bg-surface-white/95 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-secondary @3xs:left-auto @3xs:right-2.5 @3xs:top-2.5">
            Stok Habis
          </span>
        ) : null}

        {/*
          Petunjuk visual "Lihat Detail". BUKAN `<a>` — kalau jadi link,
          kartu punya dua tab stop ke URL yang sama (lihat catatan 2 di
          docblock). `aria-hidden` karena tautan sebenarnya ada di judul
          produk, dan Announces tautan yang sama dua kali hanya membingungkan
          pembaca layar. Area kliknya tetap seluruh kartu lewat
          stretched link di bawah.

          `opacity-0` (bukan `display:none`) supaya tetap di accessibility
          tree... tidak perlu: `aria-hidden` yang melepaskannya. Yang
          perlu dijaga adalah tetap terlihat saat keyboard fokus, supaya
          pengguna Tab punya umpan balik visual bahwa kartu sedang aktif.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1.5 opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <span className="flex w-full items-center justify-center gap-1 border border-border-soft bg-surface-white/95 py-2 text-[11px] font-bold uppercase tracking-wider text-text-primary shadow-sm transition-colors group-hover:border-brand-deep group-hover:bg-brand-deep group-hover:text-surface-white">
            <LineIcon name="bag" className="h-4 w-4" />
            Lihat Detail
          </span>
        </span>
      </div>

      <div className="space-y-1">
        <span className="block font-mono text-[10px] uppercase tracking-wider text-text-secondary">
          {categoryName}
        </span>

        <h3 className="line-clamp-1 text-body-sm font-semibold uppercase tracking-tight text-text-primary transition-colors group-hover:text-brand-forest tablet:text-body-md">
          <Link
            href={`/produk/${product.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {/* Nama produk sudah terbaca sebagai teks link, jadi tidak ada
                `aria-label` tambahan — label tambahan justru menyembunyikan
                nama produk dari mode kanetik virtual. */}
            {name}
          </Link>
        </h3>

        <p className="text-body-sm font-bold text-text-primary tablet:text-body-md">
          {/* `whitespace-nowrap` mencegah "[Harga dari Admin]" pecah. */}
          <span className="whitespace-nowrap">{price}</span>
        </p>

        {ukuran.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px] text-text-secondary">
            {ukuran.map((v) => (
              <span
                key={v}
                className="border border-border-soft bg-surface-paper px-1.5 py-0.5"
              >
                {v}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
