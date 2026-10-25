import Link from "next/link";

import { formatAngka } from "@/lib/format";

/**
 * Paginasi katalog.
 *
 * Dua perbaikan terhadap mockup lama:
 * 1. Nomor halaman adalah `<a>` sungguhan, bukan `<div>` dengan
 *    `onclick` — sehingga bisa dipakai tanpa JavaScript, bisa di-`_blank`,
 *    dan bisa dipratinjau tautannya. Ini juga yang membuat setiap halaman
 *    katalog dapat ditemukan mesin pencari (PRD §4.4).
 * 2. `rel="prev"`/`rel="next"` ikut dipasang supaya crawler bisa menyusuri
 *    seluruh katalog tanpa menebak.
 *
 * Jendela halaman dipotong supaya tidak ada puluhan link di mobile; halaman
 * pertama dan terakhir tetap selalu terlihat, dan celah ditandai dengan "…".
 */
export function Pagination({
  currentPage,
  lastPage,
  buildHref,
  className = "",
  label = "Navigasi halaman katalog",
}: {
  currentPage: number;
  lastPage: number;
  /** Membangun URL untuk satu nomor halaman. */
  buildHref: (page: number) => string;
  className?: string;
  /**
   * Nama landmark. Default-nya label katalog supaya pemanggil lama tidak
   * berubah; halaman koleksi mengoper `"Navigasi halaman koleksi"`.
   */
  label?: string;
}) {
  if (lastPage <= 1) return null;

  const pages = pageWindow(currentPage, lastPage);

  return (
    <nav
      aria-label={label}
      className={["flex items-center justify-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(Math.max(currentPage - 1, 1))}
          rel="prev"
          className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border-soft bg-surface-white px-3 text-label-sm font-medium text-text-primary transition-colors hover:bg-surface-sage"
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only">Halaman sebelumnya</span>
        </Link>
      ) : null}

      <ul className="flex items-center gap-1">
        {pages.map((page, index) => {
          const previous = index > 0 ? pages[index - 1] : null;
          const showGap = previous !== null && page - previous > 1;

          return (
            <li key={page} className="flex items-center gap-1">
              {showGap ? (
                <span
                  aria-hidden="true"
                  className="px-1 text-label-sm text-text-secondary"
                >
                  …
                </span>
              ) : null}
              {page === currentPage ? (
                <span
                  aria-current="page"
                  className="flex h-11 min-w-11 items-center justify-center rounded-md bg-brand-forest px-3 text-label-sm font-semibold text-surface-white"
                >
                  {formatAngka(page)}
                </span>
              ) : (
                <Link
                  href={buildHref(page)}
                  aria-label={`Halaman ${formatAngka(page)}`}
                  className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border-soft bg-surface-white px-3 text-label-sm font-medium text-text-primary transition-colors hover:bg-surface-sage"
                >
                  {formatAngka(page)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {currentPage < lastPage ? (
        <Link
          href={buildHref(Math.min(currentPage + 1, lastPage))}
          rel="next"
          className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border-soft bg-surface-white px-3 text-label-sm font-medium text-text-primary transition-colors hover:bg-surface-sage"
        >
          <span aria-hidden="true">→</span>
          <span className="sr-only">Halaman berikutnya</span>
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * Nomor halaman yang perlu ditampilkan, terurut menaik.
 *
 * Untuk katalog pendek semua nomor ditampilkan. Untuk katalog panjang hanya
 * halaman pertama, tiga halaman di sekitar posisi saat ini, dan halaman
 * terakhir — cukup untuk orientasi tanpa memenuhi baris dengan link.
 */
function pageWindow(currentPage: number, lastPage: number): number[] {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const wanted = new Set<number>([1, lastPage]);
  for (
    let page = Math.max(currentPage - 1, 1);
    page <= Math.min(currentPage + 1, lastPage);
    page += 1
  ) {
    wanted.add(page);
  }

  return Array.from(wanted).sort((a, b) => a - b);
}
