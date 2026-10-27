"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SORT_OPTIONS } from "@/lib/catalog-query";
import type { SortKey } from "@/lib/types";

/**
 * Kontrol katalog yang menulis state ke URL.
 *
 * PRD §3.3 AC: "Given buyer membagikan URL hasil filter, When link dibuka orang
 * lain, Then filter yang sama otomatis diterapkan." Karena itu TIDAK ADA state
 * filter yang hanya hidup di memori — `useSearchParams` adalah sumber
 * kebenaran, dan `router.push` yang menulis perubahan.
 *
 * Mockup lama menyimpan semua filter di state lokal dan punya tombol
 * "Simulasi Empty State" yang hanya mengubah tampilan, bukan hasil — tautan
 * seperti itu tidak bisa dibagikan dan tidak bisa diindeks.
 */
export function CatalogSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextSync = useRef(true);

  // Sinkronkan kembali dari URL: tombol "back" atau pilihan filter harus
  // mengisi ulang kolom pencarian, bukan meninggalkan teks yang tidak cocok
  // dengan hasil yang sedang tampil.
  useEffect(() => {
    const fromUrl = searchParams.get("q") ?? "";
    if (skipNextSync.current) {
      skipNextSync.current = false;
      setValue(fromUrl);
      return;
    }
    setValue((current) => (current === fromUrl ? current : fromUrl));
  }, [searchParams]);

  /**
   * Terapkan pencarian saat form disubmit ATAU saat kolom kehilangan fokus.
   *
   * Bergantung pada `onSubmit` saja akan membuat pengguna yang mengetik lalu
   * langsung menekan Enter di kolom mana pun tidak pernah melihat hasilnya.
   * `onBlur` menutup celah itu tanpa menambah request per ketikan.
   */
  function push(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.length > 0) params.set("q", nextQuery);
    else params.delete("q");
    // Halaman selalu kembali ke 1 saat kueri berubah; menjaga halaman 5
    // dari hasil lama hanya menghasilkan "Produk tidak ditemukan".
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/produk?${query}` : "/produk", { scroll: false });
    });
  }

  return (
    <form
      role="search"
      aria-label="Cari produk"
      onSubmit={(event) => {
        event.preventDefault();
        push(value.trim());
        inputRef.current?.blur();
      }}
      className="flex min-w-0 flex-col gap-3 tablet:flex-row tablet:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor="katalog-q" className="sr-only">
          Cari produk berdasarkan nama
        </label>
        <input
          ref={inputRef}
          id="katalog-q"
          name="q"
          type="search"
          inputMode="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onBlur={() => push(value.trim())}
          placeholder="Cari nama produk…"
          autoComplete="off"
          className="min-h-11 w-full min-w-0 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-body-md text-text-primary placeholder:text-text-secondary/60 focus:border-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest"
        />
        {isPending ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-body-sm text-text-secondary">
            Memuat…
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              push("");
            }}
            className="min-h-11 rounded-md border border-border-soft bg-surface-white px-4 text-label-md font-semibold text-text-primary transition-colors hover:bg-surface-sage"
          >
            Bersihkan
          </button>
        ) : null}
        <button
          type="submit"
          className="min-h-11 rounded-md border border-brand-forest bg-brand-forest px-5 text-label-md font-semibold text-surface-white transition-colors hover:bg-brand-deep"
        >
          Cari
        </button>
      </div>
    </form>
  );
}

/**
 * Pilihan kategori sebagai pil (pill) yang benar-benar berbentuk pil.
 *
 * Catatan token: `--radius-full` di `globals.css` dipaksa 9999px karena mockup
 * lama menimpanya jadi `0.75rem`, sehingga `rounded-full` menghasilkan kotak
 * dengan sudut membulat — bukan pil. Di sini kita TIDAK menimpanya lagi.
 *
 * `aria-pressed` dipakai, bukan `role="tab"`, karena ini sekumpulan tombol
 * filter yang menyetel state, bukan tab yang memuat panel berbeda.
 */
export function CategoryPills({
  categories,
  activeSlug,
  totalLabel,
}: {
  categories: ReadonlyArray<{ name: string; slug: string }>;
  activeSlug: string | null;
  totalLabel: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function select(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/produk?${query}` : "/produk", { scroll: false });
    });
  }

  return (
    <ul
      aria-label="Filter kategori"
      className="-mx-4 flex max-w-full min-w-0 gap-2 overflow-x-auto px-4 py-1 tablet:mx-0 tablet:max-w-none tablet:flex-wrap tablet:px-0"
      data-pending={isPending ? "true" : "false"}
    >
      <li>
        <button
          type="button"
          onClick={() => select(null)}
          aria-pressed={activeSlug === null}
          className={pillClass(activeSlug === null)}
        >
          Semua{totalLabel ? ` (${totalLabel})` : ""}
        </button>
      </li>
      {categories.map((category) => (
        <li key={category.slug}>
          <button
            type="button"
            onClick={() => select(category.slug)}
            aria-pressed={activeSlug === category.slug}
            className={pillClass(activeSlug === category.slug)}
          >
            {category.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function pillClass(isActive: boolean): string {
  return [
    "min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-label-sm font-medium transition-colors",
    isActive
      ? "bg-brand-forest text-surface-white"
      : "border border-border-soft bg-surface-white text-text-primary hover:bg-surface-sage",
  ].join(" ");
}

/**
 * Urutkan hasil.
 *
 * `onChange` langsung menulis ke URL (bukan `onSubmit`) supaya tidak ada tombol
 * yang perlu ditekan, dan supaya state benar-benar shareable.
 */
export function CatalogSort({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="katalog-sort"
        className="whitespace-nowrap text-label-sm text-text-secondary"
      >
        Urutkan
      </label>
      <select
        id="katalog-sort"
        value={value}
        disabled={isPending}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          const next = event.target.value;
          if (next === "latest") params.delete("sort");
          else params.set("sort", next);
          params.delete("page");
          const query = params.toString();
          // Pakai pathname semasa supaya urutan di halaman kategori tidak
          // melempar pengguna balik ke `/produk` dan menghilangkan kategori.
          startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          });
        }}
        className="min-h-11 cursor-pointer rounded-md border border-border-soft bg-surface-white px-3 text-label-sm font-medium text-text-primary disabled:opacity-60"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filter siap pakai: ketersediaan stok dan rentang harga.
 *
 * Rentang harga SELALU ditampilkan. Sebelumnya blok ini digerbangi
 * `available_filters.price_range` dari `GET /products`, tapi backend TIDAK
 * pernah mengirim `available_filters` (hanya `meta` paginasi) — jadi nilainya
 * selalu `{min:0,max:0}`, gerbangnya selalu tertutup, dan filter harga tidak
 * pernah bisa dipakai. Padahal backend MEMANG mendukung `min_price`/`max_price`
 * (`ProductController::index`). Karena rentang harga tidak perlu diketahui
 * lebih dulu, inputnya selalu tersedia.
 *
 * `step="1000"` dan `inputMode="numeric"` supaya keyboard seluler membuka
 * keypad angka — kesalahan yang sering muncul di mockup lama (`type="number"`
 * tanpa `step`).
 */
export function CatalogRefinements() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const inStock = searchParams.get("in_stock") === "1";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const query = params.toString();
    // Pathname semasa: filter harga di `/kategori/[slug]` harus tetap di
    // halaman kategori, bukan melompat ke `/produk`.
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-label-md font-semibold text-text-primary">
          Ketersediaan
        </legend>
        <button
          type="button"
          aria-pressed={inStock}
          onClick={() =>
            apply((params) => {
              if (inStock) params.delete("in_stock");
              else params.set("in_stock", "1");
            })
          }
          className={[
            "min-h-11 rounded-full px-4 text-label-sm font-medium transition-colors",
            inStock
              ? "bg-brand-forest text-surface-white"
              : "border border-border-soft bg-surface-white text-text-primary hover:bg-surface-sage",
          ].join(" ")}
        >
          Hanya produk tersedia
        </button>
      </fieldset>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply((params) => {
            if (localMin.trim()) params.set("min_price", localMin.trim());
            else params.delete("min_price");
            if (localMax.trim()) params.set("max_price", localMax.trim());
            else params.delete("max_price");
          });
        }}
        className="space-y-2"
      >
        <fieldset className="border-0 p-0">
          <legend className="mb-2 text-label-md font-semibold text-text-primary">
            Rentang harga (rupiah)
          </legend>
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="katalog-min" className="sr-only">
                  Harga minimum
                </label>
                <input
                  id="katalog-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  placeholder="Min"
                  value={localMin}
                  onChange={(event) => setLocalMin(event.target.value)}
                  disabled={isPending}
                  className="min-h-11 w-full min-w-0 rounded-md border border-border-soft bg-surface-white px-3 text-label-sm text-text-primary disabled:opacity-60"
                />
              </div>
              <span aria-hidden="true" className="shrink-0 text-text-secondary">
                –
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="katalog-max" className="sr-only">
                  Harga maksimum
                </label>
                <input
                  id="katalog-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  placeholder="Maks"
                  value={localMax}
                  onChange={(event) => setLocalMax(event.target.value)}
                  disabled={isPending}
                  className="min-h-11 w-full min-w-0 rounded-md border border-border-soft bg-surface-white px-3 text-label-sm text-text-primary disabled:opacity-60"
                />
              </div>
            </div>
            <button
              type="submit"
              className="min-h-11 w-full shrink-0 rounded-md border border-brand-forest bg-brand-forest px-4 text-label-sm font-semibold text-surface-white transition-colors hover:bg-brand-deep tablet:w-auto"
            >
              Terapkan
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

/** Tautan "hapus semua filter" — selalu terlihat saat ada filter aktif. */
export function ClearFilters({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md px-3 text-label-sm font-semibold text-brand-forest underline underline-offset-4 transition-colors hover:text-brand-deep"
    >
      Hapus semua filter
    </Link>
  );
}
