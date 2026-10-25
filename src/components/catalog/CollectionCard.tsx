import Link from "next/link";

import { formatAngka } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/placeholders";
import type { CollectionListItem } from "@/lib/types";

/**
 * Kartu koleksi — HANYA untuk `/koleksi`.
 *
 * `ProductCard`/`ProductGrid` sengaja tidak disentuh: koleksi bukan produk
 * (tidak ada harga, stok, atau varian), dan `Collection` punya isi yang tidak
 * bisa ditampilkan kartu produk — `badge_label`, `tagline`, dan dua banner
 * (desktop/mobile).
 *
 * Aturan isi (spec §3c): tidak ada konten karangan. Tagline, badge, dan banner
 * hanya dirender bila server mengirimnya.
 */
export function CollectionCard({
  collection,
  preload = false,
}: {
  collection: CollectionListItem;
  /** `true` untuk kartu pertama di layar (LCP). */
  preload?: boolean;
}) {
  const name =
    collection.name.trim().length > 0 ? collection.name : PLACEHOLDER.collection;
  const count = collection.products_count;

  return (
    // `relative` untuk overlay stretched link; `w-full` supaya kartu mengisi
    // kolom grid, bukan menyusut ke lebar teksnya.
    <article className="group relative flex w-full flex-col">
      <div className="relative mb-3">
        <CollectionBanner
          desktop={collection.banner_desktop}
          mobile={collection.banner_mobile}
          badge={collection.badge_label}
          preload={preload}
          className="aspect-[4/5] tablet:aspect-video"
        />

        {/*
          Petunjuk visual. BUKAN `<a>` — satu kartu satu tab stop, sama seperti
          `ProductCard`. `aria-hidden` karena tautan sebenarnya ada di nama
          koleksi; `focus-within` supaya pengguna keyboard dapat umpan balik
          yang sama dengan pengguna tetikus.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1.5 opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <span className="flex w-full items-center justify-center border border-border-soft bg-surface-white/95 py-2 text-[11px] font-bold uppercase tracking-wider text-text-primary shadow-sm transition-colors group-hover:border-brand-deep group-hover:bg-brand-deep group-hover:text-surface-white">
            Lihat koleksi
          </span>
        </span>
      </div>

      <div className="space-y-1">
        <h2 className="text-title-lg text-text-primary transition-colors group-hover:text-brand-forest">
          <Link
            href={`/koleksi/${collection.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h2>

        {collection.tagline ? (
          <p className="line-clamp-2 text-body-md text-text-secondary">
            {collection.tagline}
          </p>
        ) : null}

        {count === null ? null : (
          <p className="text-caption text-text-secondary">
            {count === 0 ? "Belum ada produk" : `${formatAngka(count)} produk`}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Frame banner koleksi.
 *
 * Memakai `<picture>` + `<source media>` — pola yang sama dengan
 * `HeroCarousel` untuk kasus "satu kotak, dua crop". `ImageWithFallback` tidak
 * dipakai karena media koleksi datang sebagai URL absolut (sudah `unoptimized`
 * di sana) dan karena kotak ini wajib tetap ada saat admin belum mengunggah
 * banner.
 *
 * Banner bersifat dekoratif: nama dan tagline koleksi sudah teks di kartu yang
 * sama, jadi `alt=""` — `alt` berisi nama koleksi akan dibacakan dua kali.
 * Frame kosong diberi satu `sr-only` supaya bukan lubang tanpa keterangan.
 */
export function CollectionBanner({
  desktop,
  mobile,
  badge = null,
  preload = false,
  className = "",
}: {
  desktop: string | null;
  mobile: string | null;
  /** `badge_label` dari server; `null`/kosong = chip tidak dirender. */
  badge?: string | null;
  preload?: boolean;
  /** Kelas rasio kotak, mis. `aspect-[4/5] tablet:aspect-video`. */
  className?: string;
}) {
  const fallback = desktop ?? mobile;

  return (
    <div
      className={[
        "relative overflow-hidden border border-border-soft bg-surface-paper",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {fallback ? (
        <picture className="block h-full w-full">
          {/* Batas 767px = satu piksel di bawah `--breakpoint-tablet`. */}
          {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
          {desktop ? <source media="(min-width: 768px)" srcSet={desktop} /> : null}
          {/*
            `alt=""`: banner dekoratif, teksnya ada di kartu/kepala halaman.
            `loading`/`fetchPriority` diwarisi aset yang akhirnya dipilih
            `<source>`, jadi LCP kartu pertama tetap bisa diprioritaskan.
          */}
          {/*
            `<img>` sengaja, bukan `next/image`: media koleksi datang sebagai
            URL absolut (lihat catatan `unoptimized` di `ImageWithFallback` —
            tidak ada optimasi Next yang hilang), dan elemen inilah yang
            mewarisi `loading`/`fetchPriority` untuk `<source>` yang terpilih.
          */}
          <img
            src={fallback}
            alt=""
            decoding="async"
            loading={preload ? "eager" : "lazy"}
            fetchPriority={preload ? "high" : "auto"}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </picture>
      ) : (
        // Admin belum mengunggah banner. BUKAN `placeholder-product.svg` — itu
        // foto produk, dan memakainya berarti koleksi tanpa banner menyamar
        // sebagai produk tanpa foto.
        <span className="sr-only">Banner koleksi belum tersedia</span>
      )}

      {badge ? (
        // Chip label admin. Bukan kontrol, jadi tidak masuk tab order.
        // `max-w-[60%]` supaya tidak menutupi foto.
        <span className="absolute left-2.5 top-2.5 max-w-[60%] truncate border border-border-soft bg-surface-sage px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-forest">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
