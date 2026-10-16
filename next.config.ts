import type { NextConfig } from "next";

/**
 * Host yang boleh dimuat `next/image`.
 *
 * Di produksi, media disajikan lewat Object Storage / CDN dengan HTTPS.
 * Di pengembangan, Laravel menyajikan media lewat symlink `public/storage`
 * pada HTTP `localhost:8080` — dan itu TIDAK boleh masuk daftar.
 *
 * Kenapa ini penting: `next/image` diam-diam menolak gambar dari origin yang
 * tidak diizinkan. Gejalanya bukan error di console, melainkan kotak kosong
 * dengan alt text — yang persis seperti "produk tidak punya foto".
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

let mediaUrl: URL;
try {
  mediaUrl = new URL(MEDIA_BASE);
} catch {
  // URL tidak valid — pakai default agar build tidak gagal total.
  mediaUrl = new URL("http://localhost:8080");
}

const isHttps = mediaUrl.protocol === "https:";

/**
 * Apakah host media adalah alamat jaringan lokal?
 *
 * ===================================================================
 *  MENGAPA JADI FUNGSI, BUKAN `NODE_ENV === "development"`
 * ===================================================================
 * Proteksi SSRF Next.js memblokir hostname yang resolve ke IP privat
 * (127.0.0.1, ::1, 192.168.x.x). Selama backend hanya dilayani lewat
 * `npm run dev`, `NODE_ENV` sudah cukup. Tapi begitu storefront dijalankan
 * lewat `next build && next start` untuk ditinjau, `NODE_ENV` menjadi
 * `production` KALAU-PUN media masih dilayani `localhost:8080` — dan
 * seluruh foto/banner hilang tanpa jejak:
 *
 *   ⨯ upstream image http://localhost:8080/storage/media/... hostname
 *     resolved to private IP ["::1","127.0.0.1"]
 *
 * Gejalanya di browser cuma kotak kosong dengan alt text, persis seperti
 * "produk tidak punya foto". Sangat mahal dicari.
 *
 * Jadi kuncinya adalah faktanya — "apakah host media ini lokal?" — bukan
 * mode apa yang sedang dijalankan. Kalau nanti media dipindah ke domain
 * sungguhan (S3/CDN), fungsi ini otomatis mengembalikan `false` dan
 * proteksi SSRF tetap utuh tanpa perlu menyentuh kode.
 *
 * Daftar host lokal yang dikenali:
 *   - `localhost`
 *   - `127.0.0.0/8` dan `::1`
 *   - `10.x`, `172.16–31.x`, `192.168.x` (LAN)
 *   - `.local` (mDNS)
 */
function isLocalMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;

  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

/** Host media lokal? Hanya itu yang butuh melonggarkan proteksi SSRF. */
const mediaHostLokal = isLocalMediaHost(mediaUrl.hostname);

const nextConfig: NextConfig = {
  /**
   * `metadataBase` (di `src/app/layout.tsx`) adalah pasangan wajib dari
   * SEO — tanpa itu `alternates.canonical` melempar error saat build.
   */
  poweredByHeader: false,

  images: {
    // Format modern + lazy-loading otomatis (PRD §4.1 mensyaratkan WebP).
    formats: ["image/webp"],

    // Minimum cache satu tahun: nama file berisi ukuran, jadi kalau isi
    // berubah versinya juga berubah — aman di-cache lama.
    minimumCacheTTL: 31_536_000,

    /**
     * Izinkan muat gambar dari host jaringan lokal.
     *
     * Hanya menyala kalau `NEXT_PUBLIC_MEDIA_BASE_URL` menunjuk ke alamat
     * loopback/LAN. Di produksi sungguhan (media di domain/CDN dengan HTTPS)
     * nilainya `false` dan proteksi SSRF Next.js tetap utuh.
     *
     * Kalau sengaja mengaktifkan ini di produksi, konfigurasi gambar yang
     * dikendalikan penyerang bisa membuat server Next.js menarik URL
     * internal. Itu risikonya, dan itu sebabnya syaratnya dibuat sempit.
     */
    dangerouslyAllowLocalIP: mediaHostLokal,

    remotePatterns: [
      // Aset statis milik Next.js sendiri (logo, SVG placeholder).
      { protocol: "https", hostname: "**" },

      // Media dari backend / object storage.
      {
        protocol: isHttps ? "https" : "http",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port || undefined,
        pathname: "/storage/media/**",
      },

      // Bucket S3 / CDN. Hanya perlu kalau media basing ke CDN, tapi
      // dibiarkan terbuka untuk hostname bucket agar tidak perlu edit
      // config setiap kali bucket berganti.
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "**.cloudfront.net", pathname: "/**" },
    ],
  },

  /**
   * Halaman checkout & lacik selalu dinamis (data per pengguna + token
   * Sanctum). Tidak ada ISR di sana.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
