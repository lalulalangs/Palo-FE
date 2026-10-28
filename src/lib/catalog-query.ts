import type { CatalogParams } from "./api";
import type { SortKey } from "./types";

/**
 * Parse & bangun query param katalog.
 *
 * PRD §3.3: "Filter & sort ter-refleksi di URL query params untuk shareable
 * link & SEO." Jadi parsing harus total: semua state yang di-render HARUS bisa
 * dibalik dari URL, dan URL yang tidak dikenal harus diabaikan (bukan error).
 *
 * Mockup lama kehilangan semua state ini — filter hanya ada di state JavaScript
 * lokal, jadi tautannya tidak bisa dibagikan dan tidak terindeks.
 */

export const SORT_OPTIONS: ReadonlyArray<{
  value: SortKey;
  label: string;
}> = [
  { value: "latest", label: "Terbaru" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

export const PER_PAGE = 24;

/** Bentuk `searchParams` Next.js: nilai bisa `string | string[] | undefined`. */
export type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return first ?? null;
  }
  return typeof value === "string" ? value : null;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseCatalogParams(
  searchParams: RawSearchParams,
): CatalogParams {
  const sort = firstValue(searchParams.sort);
  const q = firstValue(searchParams.q);
  const inStock = firstValue(searchParams.in_stock);

  return {
    q: q && q.trim().length > 0 ? q.trim() : null,
    category: firstValue(searchParams.category),
    minPrice: parseNonNegativeInt(firstValue(searchParams.min_price)),
    maxPrice: parseNonNegativeInt(firstValue(searchParams.max_price)),
    sort: sort && SORT_VALUES.has(sort) ? (sort as SortKey) : "latest",
    inStock: inStock === "1",
    page: parsePositiveInt(firstValue(searchParams.page)) ?? 1,
    perPage: PER_PAGE,
  };
}

/**
 * Bangun `URLSearchParams` dari state katalog.
 * Hanya parameter yang berubah dari default yang ditulis, supaya URL tetap
 * bersih dan `canonical` tidak bercabang-cabang tanpa alasan.
 */
export function buildCatalogSearchParams(
  current: CatalogParams,
  overrides: Partial<CatalogParams>,
): URLSearchParams {
  const next: CatalogParams = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.minPrice !== null) params.set("min_price", String(next.minPrice));
  if (next.maxPrice !== null) params.set("max_price", String(next.maxPrice));
  if (next.inStock) params.set("in_stock", "1");
  if (next.sort !== "latest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  return params;
}

/** Halaman katalog yang sedang aktif — dipakai `canonical` + CTA pagination. */
export function catalogHref(
  searchParams: RawSearchParams,
  extra?: Record<string, string | number>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const single = firstValue(value);
    if (!single) continue;
    params.set(key, single);
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `/produk?${query}` : "/produk";
}

/** Deskripsi memakai state filter supaya tidak sama untuk semua kombinasi URL. */
export function describeCatalog(
  params: CatalogParams,
  categoryName: string | null,
): string {
  const scope = categoryName ?? "Katalog";
  if (params.q) {
    return `Hasil pencarian "${params.q}" di ${scope}. Temukan produk pilihan terbaik sesuai kebutuhanmu.`;
  }
  return `${scope} — temukan produk pilihan dengan kualitas terbaik untuk menemani setiap langkah dan aktivitasmu.`;
}
