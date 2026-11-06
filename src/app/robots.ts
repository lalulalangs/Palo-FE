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
        allow: [
          "/",
          "/produk?page=*",
          "/kategori/*?page=*",
          "/koleksi/*?page=*",
        ],
        disallow: [
          "/keranjang",
          "/checkout",
          "/lacak",
          "/masuk",
          "/daftar",
          "/me",
          "/orders/",
          "/api/",
          "/*?*sort=*",
          "/*?*min_price=*",
          "/*?*max_price=*",
          "/*?*in_stock=*",
          "/*?*q=*",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
