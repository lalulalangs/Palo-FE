"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Container } from "./Container";
import { BrandLogo } from "./BrandLogo";
import { ActiveLink } from "./ActiveLink";

/**
 * Navigasi utama.
 *
 * ===================================================================
 *  PERILAKU TRANSPARAN DI BERANDA
 * ===================================================================
 * Di beranda, header melayang DI ATAS foto hero:
 *
 *   - belum di-scroll  -> latar transparan, teks terang, header `fixed`
 *                         (foto hero terlihat sampai paling atas halaman)
 *   - sudah di-scroll  -> latar putih, teks gelap, tetap `fixed`
 *
 * Di halaman lain tidak ada hero, jadi header memakai perilaku lama:
 * `sticky` dengan latar putih.
 *
 * Kenapa `fixed`, bukan `sticky`: elemen `sticky` masih mengambil ruang di
 * alur layout, jadi hero SELALU mulai DI BAWAH header — header transparan
 * tidak akan pernah memperlihatkan foto, hanya warna halaman. `fixed`
 * melepas header dari alur sehingga foto hero bisa naik sampai ke titik nol.
 *
 * Posisi (`fixed`/`sticky`) ditentukan oleh `pathname` yang stabil, bukan
 * oleh posisi scroll. Kalau posisinya ikut berubah saat scroll, halaman
 * akan melompat setiap kali header berubah warna — dan itu yang paling
 * menonjolkan bug-nya.
 *
 * Hanya WARNA yang berubah saat scroll.
 *
 * ===================================================================
 *  CATATAN AKSESIBILITAS
 * ===================================================================
 * Teks terang di atas foto hanya aman kalau teks itu punya bayangan.
 * Foto banner milik admin, dan admin bisa memasang foto terang — kalau
 * tidak ada bayangan, navinya hilang. Karena itu kelas transparan
 * selalu menyertakan `drop-shadow`.
 *
 * Tanpa JavaScript, header tetap transparan di beranda (hasil render
 * server) — itu kondisi yang benar, karena beranda memang hero-nya ada
 * di paling atas.
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * Navigasi utama.
 *
 * Item pertama adalah `Koleksi` (bukan `Katalog`): `design.md` §3 menetapkan
 * menu global `Koleksi`, `Cerita Palo`, `Toko Senaru`. Diganti, BUKAN
 * ditambah — lima item tidak muat di 768px. `/produk` tetap terjangkau lewat
 * ikon pencarian di header, footer, breadcrumb produk, dan CTA di `/koleksi`.
 */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/koleksi", label: "Koleksi" },
  { href: "/cerita", label: "Cerita Palo" },
  { href: "/kontak", label: "Toko Senaru" },
  { href: "/lacak", label: "Lacak Pesanan" },
];

/**
 * Berapa piksel scroll sebelum header berubah warna.
 *
 * Bukan 0 supaya goyang kecil dari trackpad tidak langsung membalik
 * warna header. 8px cukup kecil untuk terasa seketika.
 */
const SCROLL_THRESHOLD = 8;

/** Tinggi header. Punya satu sumber kebenaran supaya hero bisa mengompensasi. */
export const HEADER_HEIGHT_CLASS = "h-20";

/* -------------------------------------------------------------------------- */
/* Langganan event scroll                                                    */
/* -------------------------------------------------------------------------- */

/*
 * `useSyncExternalStore` (bukan `useState` + `useEffect`) karena posisi scroll
 * adalah data dari LUAR React. Hook ini dirancang tepat untuk itu, dan
 * menyelesaikan dua masalah sekaligus:
 *
 *   1. Saat browser memulihkan posisi scroll setelah reload, React
 *      membandingkan snapshot server dengan snapshot client dan langsung
 *      renders ulang. Dengan `useState` + `useEffect`,/state baru hanya
 *      tersedia SETELAH efek berjalan — header sempat transparan di atas
 *      konten yang sebenarnya sudah tergulir.
 *
 *   2. Tidak perlu `setState()` di dalam efek, yang oleh aturan
 *      `react-hooks/set-state-in-effect` memang dilarang.
 */

/** Snapshot harus nilai primitif yang stabil — bukan objek baru tiap call. */
function subscribeScroll(onStoreChange: () => void): () => void {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function scrollSnapshot(): boolean {
  return window.scrollY > SCROLL_THRESHOLD;
}

/** Nilai saat render di server: belum ada scroll, jadi belum ter-scroll. */
function scrollServerSnapshot(): boolean {
  return false;
}

export function SiteHeader({
  cartCount,
  isLoggedIn,
}: {
  cartCount: number;
  /**
   * Hanya keberadaan cookie, bukan validitas token: kalau token sudah mati,
   * tautan `/me` akan mengarahkan ulang ke halaman masuk. Mengambil
   * `GET /auth/me` di setiap render layout terlalu mahal untuk sebuah ikon.
   */
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    scrollSnapshot,
    scrollServerSnapshot,
  );

  const transparan = isHome && !scrolled;

  return (
    <header
      className={[
        "z-50",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        transparan
          ? // Tanpa `backdrop-blur` di mode transparan: blur pada latar
            // transparan hanya menghasilkan kabut tipis yang justru
            // mengurangi kontras teks terang.
            "border-b border-transparent bg-transparent"
          : "border-b border-border-soft bg-surface-white/95 backdrop-blur-md",
      ].join(" ")}
    >
      <Container>
        <div className={`flex ${HEADER_HEIGHT_CLASS} items-center justify-between gap-3`}>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-md py-1"
          >
            {/* Logo sengaja TIDAK ikut berubah warna saat header
                transparan. Pemilik meminta logo tetap utuh di dalam
                petak putihnya, persis seperti berkas aslinya. */}
            <BrandLogo className="h-11 w-11 shrink-0" preload />
            <span className="hidden min-w-0 flex-col text-left tablet:flex">
              <span
                className={[
                  "truncate font-headline text-headline-sm font-semibold leading-tight tracking-tight",
                  transparan
                    ? "text-surface-white drop-shadow"
                    : "text-brand-deep",
                ].join(" ")}
              >
                Palo Mountain Goods
              </span>
              <span
                className={[
                  "text-caption uppercase tracking-widest",
                  transparan
                    ? "text-surface-white/85 drop-shadow"
                    : "text-text-secondary",
                ].join(" ")}
              >
                Senaru • Lombok Utara
              </span>
            </span>
            <span className="sr-only">Palo Mountain Goods — beranda</span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden tablet:block">
            <ul className="flex items-center gap-8">
              {PRIMARY_NAV.map((link) => (
                <li key={link.href}>
                  <ActiveLink
                    href={link.href}
                    className={`inline-flex ${HEADER_HEIGHT_CLASS} items-center border-b-2 text-label-md font-medium transition-colors`}
                    activeClassName={
                      transparan
                        ? "border-surface-white font-semibold text-surface-white"
                        : "border-brand-forest font-semibold text-brand-forest"
                    }
                    inactiveClassName={
                      transparan
                        ? "border-transparent text-surface-white/90 drop-shadow hover:border-surface-white hover:text-surface-white"
                        : "border-transparent text-text-secondary hover:border-brand-forest hover:text-text-primary"
                    }
                  >
                    {link.label}
                  </ActiveLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1 tablet:gap-2">
            <Link
              href="/produk"
              className={[
                "flex h-11 w-11 items-center justify-center rounded-md transition-colors",
                transparan
                  ? "text-surface-white drop-shadow hover:bg-surface-white/15"
                  : "text-text-secondary hover:bg-surface-sage hover:text-brand-forest",
              ].join(" ")}
            >
              <SearchIcon />
              <span className="sr-only">Cari produk</span>
            </Link>
            <Link
              href={isLoggedIn ? "/me" : "/masuk"}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-md transition-colors",
                transparan
                  ? "text-surface-white drop-shadow hover:bg-surface-white/15"
                  : "text-text-secondary hover:bg-surface-sage hover:text-brand-forest",
              ].join(" ")}
            >
              <AccountIcon />
              <span className="sr-only">
                {isLoggedIn ? "Akun saya" : "Akun pelanggan"}
              </span>
            </Link>
            <Link
              href="/keranjang"
              className={[
                "relative flex h-11 items-center gap-2 rounded-md border px-3 transition-colors",
                transparan
                  ? "border-surface-white/50 bg-surface-white/15 text-surface-white drop-shadow hover:bg-surface-white/25"
                  : "border-border-soft bg-surface-sage text-brand-forest hover:border-brand-forest",
              ].join(" ")}
            >
              <BagIcon />
              <span className="text-label-sm font-semibold tabular-nums">
                {cartCount}
              </span>
              <span className="sr-only">
                Keranjang belanja, {cartCount} item
              </span>
            </Link>

            <details className="relative tablet:hidden">
              <summary
                className={[
                  "flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md transition-colors",
                  transparan
                    ? "text-surface-white drop-shadow hover:bg-surface-white/15"
                    : "text-text-secondary hover:bg-surface-sage hover:text-brand-forest",
                ].join(" ")}
              >
                <MenuIcon />
                <span className="sr-only">Buka menu navigasi</span>
              </summary>
              {/*
                Panel dropdown TETAP berlatar putih, walaupun header sedang
                transparan. Menu yang mengambang tanpa latar akan menumpuk
                teks di atas foto dan isinya tidak terbaca.
              */}
              <nav
                aria-label="Navigasi utama seluler"
                className="absolute right-0 top-14 z-50 w-60 rounded-lg border border-border-soft bg-surface-white p-2 shadow-editorial-strong"
              >
                <ul className="flex flex-col">
                  {PRIMARY_NAV.map((link) => (
                    <li key={link.href}>
                      <ActiveLink
                        href={link.href}
                        className="flex min-h-11 items-center rounded-md px-3 text-label-md text-text-primary transition-colors hover:bg-surface-sage"
                        activeClassName="bg-surface-sage font-semibold text-brand-forest"
                        inactiveClassName=""
                      >
                        {link.label}
                      </ActiveLink>
                    </li>
                  ))}
                  {/*
                    "Katalog" hanya ada di drawer seluler. Tanpa ini pengguna
                    ponsel kehilangan satu-satunya tautan TEKS ke `/produk`
                    (ikon pencarian hanya terbaca "Cari produk" oleh pembaca
                    layar). Drawer bertumpuk vertikal, jadi tidak ada batas
                    lebar seperti nav tablet.
                  */}
                  <li>
                    <Link
                      href="/produk"
                      className="flex min-h-11 items-center rounded-md px-3 text-label-md text-text-primary transition-colors hover:bg-surface-sage"
                    >
                      Katalog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={isLoggedIn ? "/me" : "/daftar"}
                      className="flex min-h-11 items-center rounded-md px-3 text-label-md text-text-primary transition-colors hover:bg-surface-sage"
                    >
                      {isLoggedIn ? "Akun Saya" : "Buat Akun"}
                    </Link>
                  </li>
                </ul>
              </nav>
            </details>
          </div>
        </div>
      </Container>
    </header>
  );
}

/* Ikon inline (SVG) — bukan Material Symbols dari CDN. */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
