import type { Metadata } from "next";

import { absoluteUrl, SITE_NAME, SITE_OG_IMAGE } from "./site";

/**
 * Pembangun `Metadata` terpusat.
 *
 * ARSITEKTUR §9: audit 15 mockup menemukan **0 dari 15** punya meta
 * description, canonical, maupun JSON-LD. Supaya bagian SEO tidak hilang lagi
 * saat menambah halaman baru, setiap route memanggil `buildMetadata()` alih-alih
 * menulis objek `Metadata` sendiri. Dengan begitu `alternates.canonical`,
 * `openGraph`, dan `twitter` tidak akan pernah terlupa di satu halaman pun.
 */

export interface BuildMetadataOptions {
  title: string;
  description: string;
  /** Path relatif untuk `canonical`, mis. `/produk/nama-produk`. */
  path: string;
  /** Matikan indexing untuk halaman utilitas (auth, lacak, 404). */
  noIndex?: boolean;
  image?: string;
  /**
   * `openGraph.type` hanya menerima `"website"` | `"article"` pada tipe
   * Next.js. Halaman produk TIDAK memakai tipe khusus (schema.org
   * `Product` ditangani lewat JSON-LD, bukan og:type), jadi default
   * `"website"` juga untuk detail produk — lebih baik satu tipe yang valid
   * daripada nilai yang di-cast paksa.
   */
  type?: "website" | "article";
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(options.path);
  const image = absoluteUrl(options.image ?? SITE_OG_IMAGE);
  const openGraphType = options.type ?? "website";

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: openGraphType,
      url,
      title: options.title,
      description: options.description,
      siteName: SITE_NAME,
      locale: "id_ID",
      images: [{ url: image, alt: options.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image],
    },
    // Halaman auth / lacak tidak punya nilai untuk mesin pencari: isinya
    // personal atau tidak terindekskan dengan baik.
    ...(options.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
