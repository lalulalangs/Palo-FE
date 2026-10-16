import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * `robots.txt`.
 *
 * Halaman utilitas dikecualikan karena tidak ada yang daarinya yang layak
 * diindeks: isinya personal (keranjang, checkout, riwayat pesanan) atau
 * bermutu satu (halaman masuk/daftar menghasilkan form kosong di hasil
 * pencarian). Mengecualikannya juga menghemat kuota crawl untuk katalog.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/keranjang",
          "/checkout",
          "/lacak",
          "/masuk",
          "/daftar",
          // Query param katalog: mengindeks tiap kombinasi filter membuat
          // crawler terjebak di ruang parameter yang praktis tak berujung
          // (PRD §3.3 tetap bisa dibagikan lewat URL, tapi tidak perlu
          // diindeks satu per satu).
          "/produk?",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
