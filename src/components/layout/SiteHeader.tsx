"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { Container } from "./Container";
import { BrandLogo } from "./BrandLogo";
import { ActiveLink } from "./ActiveLink";

export interface NavLink {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavLink[] = [
  { href: "/produk", label: "Katalog" },
  { href: "/koleksi", label: "Koleksi" },
  { href: "/cerita", label: "Cerita Palo" },
  { href: "/kontak", label: "Toko Senaru" },
  { href: "/lacak", label: "Lacak Pesanan" },
];

const SCROLL_THRESHOLD = 8;
export const HEADER_HEIGHT_CLASS = "h-20";

function subscribeScroll(onStoreChange: () => void): () => void {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function scrollSnapshot(): boolean {
  return window.scrollY > SCROLL_THRESHOLD;
}

function scrollServerSnapshot(): boolean {
  return false;
}

export function SiteHeader({
  cartCount,
  isLoggedIn,
}: {
  cartCount: number;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    scrollSnapshot,
    scrollServerSnapshot,
  );

  const transparan = isHome && !scrolled;

  const closeMenu = () => {
    if (detailsRef.current?.open) {
      detailsRef.current.open = false;
    }
  };

  const handleNavClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a")) {
      closeMenu();
    }
  };

  // Tutup menu mobile ketika navigasi berpindah halaman
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // Click-outside, tap-outside, dan tombol Escape
  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!details.open) return;
      // Jika interaksi terjadi di luar elemen <details>, tutup menu
      if (!details.contains(event.target as Node)) {
        details.open = false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        details.open = false;
        summaryRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Tutup menu jika layar diperlebar ke ukuran tablet/desktop (>= 768px)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 48rem)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  return (
    <header
      className={[
        "z-50",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        transparan
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border-soft bg-surface-white/95 backdrop-blur-md",
      ].join(" ")}
    >
      <Container>
        <div className={`flex ${HEADER_HEIGHT_CLASS} items-center justify-between gap-3`}>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-md py-1"
          >
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
            <ul className="flex items-center gap-4 desktop:gap-8">
              {PRIMARY_NAV.map((link) => (
                <li key={link.href}>
                  <ActiveLink
                    href={link.href}
                    className={`inline-flex ${HEADER_HEIGHT_CLASS} shrink-0 items-center whitespace-nowrap border-b-2 text-label-md font-medium transition-colors`}
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

            <details ref={detailsRef} className="relative tablet:hidden">
              <summary
                ref={summaryRef}
                className={[
                  "flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md transition-colors [&::-webkit-details-marker]:hidden",
                  transparan
                    ? "text-surface-white drop-shadow hover:bg-surface-white/15"
                    : "text-text-secondary hover:bg-surface-sage hover:text-brand-forest",
                ].join(" ")}
              >
                <MenuIcon />
                <span className="sr-only">Buka menu navigasi</span>
              </summary>
              <nav
                aria-label="Navigasi utama seluler"
                onClick={handleNavClick}
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
