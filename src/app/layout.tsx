import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import "./globals.css";

import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getBrand, getCart, getToken } from "@/lib/api";
import { resolveBrand } from "@/lib/brand";
import { organizationJsonLd } from "@/lib/jsonld";
import { PLACEHOLDER_BRAND } from "@/lib/placeholders";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * BlinkMacSystemFont — satu-satunya keluarga font di seluruh UI.
 *
 * ===================================================================
 *  PERGANTIAN INI MEMBAWA 2 KONSEKUENSI DESAIN
 * ===================================================================
 * Sebelumnya ada tiga keluarga: Manrope (teks), Source Serif 4 (judul), dan
 * JetBrains Mono (label editorial). Semuanya sekarang diganti satu font.
 *
 * 1. **Judul tidak lagi serif.** `font-headline` dulu dipakai Source Serif 4,
 *    dan itu yang memberi karakter "lookbook" pada hero. Sekarang judul pakai
 *    huruf sans yang sama dengan teks. karakter editorial itu hilang, dan tampilan jadi
 *    jauh lebih netral dan kurang "editorial".
 *
 * 2. **Label editorial tidak lagi monospace.** "FORM. 01 — RINJANI SERIES"
 *    dan "SENARU / 601 MDPL" sebelumnya dirangkai dengan JetBrains Mono plus
 *    `tracking-widest`, yang menghasilkan kesan cap rubber. Sekarang keduanya
 *    memakai font proporsional, jadi label itu terbaca seperti teks kapital
 *    biasa — legibility naik, kesan editorial hilang.
 *
 * Kedua hal di atas adalah EFEK LANGSUNG dari permintaan pemilik, bukan
 * cacat. Tapi saya catat karena keduanya terlihat sekali di layar.
 *
 * ===================================================================
 *  HANYA 6 BERKAS YANG DISALIN
 * ===================================================================
 * Font asli punya 8 weight + 8 italic (32 berkas woff2, ± 2,9 MB). Yang
 * dipakai token tipografi `globals.css` dan kelas komponen hanya:
 *
 *   300 Light · 400 Regular · 500 Medium · 600 Semibold · 700 Bold
 *   600 Semibold Italic
 *
 * Semibold Italik diambil karena ada tepat satu elemen yang memakai kelas
 * `italic` (`src/app/cerita/page.tsx`). Sisanya (Thin, Ultralight, Black, dan
 * seluruh italic lain) tidak pernah dirender, jadi tidak perlu di repo.
 * Hasil: 552 KB, bukan 2,9 MB.
 *
 * `next/font/local` dipakai, bukan `<link>` manual ke `/public`, karena Next
 * lalu mem-hash nama berkasnya (cache busted otomatis saat font berubah) dan
 * menuliskan `font-display: swap` serta fallback dengan metrik yang disesuaikan
 * supaya tidak ada layout shift saat font tiba.
 */
const blink = localFont({
  src: [
    { path: "./fonts/blink-light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/blink-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/blink-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/blink-semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/blink-bold.woff2", weight: "700", style: "normal" },
    {
      path: "./fonts/blink-semibold-italic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-blink",
  /**
   * `preload: false` — JANGAN diubah tanpa alasan.
   *
   * Dengan `preload: true` (default), Next.js akan mem-preload **semua enam**
   * berkas di `<head>`, padahal layar pertama hanya butuh 400 dan 600.
   * Itu ~550 KB yang diunduh sebelum teks pertama tampil.
   *
   * `display: "swap"` membuat teks tetap terbaca dengan font sistem selama
   * berkas arrive, jadi tidak ada teks kosong.
   */
  preload: false,
  /**
   * Fallback dengan metrik disesuaikan (size-adjust) supaya tinggi baris
   * tidak bergeser setelah font asli tiba. `Arial` adalah default yang tepat
   * untuk font sans seperti ini.
   */
  adjustFontFallback: "Arial",
});

/**
 * `metadataBase` wajib ada supaya `alternates.canonical`, `openGraph.image`,
 * dan `sitemap.ts` menghasilkan URL absolut. Tanpa ini Next melempar error saat
 * build. Nilai diambil dari env dengan fallback yang terlihat jelas.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Merchandise Penjelajahan dari Senaru`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Merchandise Penjelajahan dari Senaru`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#123F31",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const isMaintenanceHeader = headerList.get("x-maintenance-mode") === "1";
  const pathname = headerList.get("x-pathname") ?? "";
  const isMaintenanceEnv = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const isMaintenance =
    isMaintenanceEnv || isMaintenanceHeader || pathname === "/maintenance";

  // Data shell diambil di layout supaya header, footer, dan JSON-LD konsisten.
  // Jika sedang mode maintenance, cart tidak perlu diambil.
  // `getToken()` hanya membaca cookie, tidak memanggil backend. Dipakai
  // semata-mata untuk memilih tujuan ikon Akun (`/me` vs `/masuk`); validitas
  // token tetap diperiksa di halaman /me itu sendiri.
  const [brand, cart, isLoggedIn] = await Promise.all([
    getBrand(),
    isMaintenance ? Promise.resolve(null) : getCart(),
    getToken().then(Boolean),
  ]);

  return (
    <html lang="id" className={blink.variable}>
      <body className="flex min-h-screen flex-col bg-surface-paper text-text-primary antialiased">
        <a href="#konten-utama" className="skip-link">
          Lompat ke konten utama
        </a>

        <JsonLd
          data={organizationJsonLd({
            brandName: brand?.brand_name ?? PLACEHOLDER_BRAND.brandName,
            logoUrl: brand?.logo_url ?? PLACEHOLDER_BRAND.logo,
            address: brand?.store_address ?? null,
            email: brand?.email ?? null,
            instagramUrl: brand?.instagram_url ?? null,
            facebookUrl: brand?.facebook_url ?? null,
            tiktokUrl: brand?.tiktok_url ?? null,
            whatsapp: brand?.whatsapp_cs ?? null,
          })}
        />

        {/*
         * Header navigasi HANYA tampil jika BUKAN mode maintenance.
         */}
        {!isMaintenance && (
          <SiteHeader
            cartCount={cart?.summary.item_count ?? 0}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/*
         * `scroll-mt-20`: di beranda header memakai `position: fixed`, jadi
         * `main` tidak lagi menyisakan ruang untuknya.
         */}
        <main
          id="konten-utama"
          className={isMaintenance ? "flex-1" : "flex-1 scroll-mt-20"}
        >
          {children}
        </main>

        {/*
         * Footer navigasi HANYA tampil jika BUKAN mode maintenance.
         */}
        {!isMaintenance && <SiteFooter brand={resolveBrand(brand)} />}

        <noscript>
          <div className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-body-sm text-text-secondary">
            Sebagian fitur keranjang dan filter memerlukan JavaScript. Katalog,
            halaman produk, cerita brand, dan informasi toko tetap dapat dibaca
            tanpa JavaScript.
          </div>
        </noscript>
      </body>
    </html>
  );
}
