import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import type { BrandInfo, ProductDetail } from "./types";

/**
 * Pembuat JSON-LD structured data (PRD §4.4 + ARSITEKTUR §9).
 *
 * Audit mockup: 0 dari 15 file punya JSON-LD. Bagian ini harus bertahan.
 * Semua helper mengembalikan `Record<string, unknown>` supaya bebas dari
 * `any`, dan komponen `JsonLd` melakukan serialisasi sekali di server.
 */

export type JsonLdObject = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export interface OrganizationOptions {
  brandName: string | null;
  logoUrl: string | null;
  address: string | null;
  email: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  threadsUrl?: string | null;
  whatsapp: string | null;
}

/**
 * `Organization` untuk layout root.
 *
 * Note: nomor telepon, alamat, dan Instagram TIDAK pernah di-hardcode. Kalau
 * `GET /brand` belum mengembalikan nilainya, field-nya dihilangkan dari
 * structured data — lebih baik tidak ada daripada menyesatkan crawlers.
 */
export function organizationJsonLd(options: OrganizationOptions): JsonLdObject {
  const name = options.brandName ?? SITE_NAME;

  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name,
    url: SITE_URL,
  };

  if (options.logoUrl) {
    node.logo = {
      "@type": "ImageObject",
      url: absoluteUrl(options.logoUrl),
    };
  }

  const contact: JsonLdObject = {};
  if (options.email) contact.email = options.email;
  if (options.whatsapp) {
    contact.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: options.whatsapp,
        areaServed: "ID",
        availableLanguage: ["id"],
      },
    ];
  }
  if (Object.keys(contact).length > 0) node.contactPoint = contact.contactPoint;

  // `sameAs` memberi mesin pencari daftar akun resmi brand. Hanya kanal
  // yang benar-benar terisi yang dimasukkan — nilai `null` akan muncul
  // sebagai `"sameAs": [null]` dan membingungkan crawler.
  const sameAs: string[] = [];
  for (const url of [
    options.instagramUrl,
    options.facebookUrl,
    options.tiktokUrl,
    options.threadsUrl,
  ]) {
    if (url) sameAs.push(url);
  }
  if (sameAs.length > 0) node.sameAs = sameAs;

  if (options.address) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: options.address,
      addressCountry: "ID",
    };
  }

  return node;
}

/** `WebSite` + `SearchAction` untuk kotak pencarian di beranda. */
export function webSiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "id-ID",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/produk?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ProductJsonLdOptions {
  product: ProductDetail;
  brandName: string | null;
}

/**
 * `Product` untuk halaman detail.
 *
 * PENTING (PRD §1.1A): kalau `is_placeholder` true, `name` tetap
 * placeholder apa adanya. Kita TIDAK mengarang nama/harga, dan `offers` pun
 * TIDAL emitted karena tidak ada harga terverifikasi — memalsukan offer berarti
 * menyesatkan crawler dan bisa menyalahartikan Data Richtlinie yang sama.
 */
export function productJsonLd(options: ProductJsonLdOptions): JsonLdObject | null {
  const { product } = options;

  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/produk/${product.slug}`)}#product`,
    name: product.name,
    url: absoluteUrl(`/produk/${product.slug}`),
    inLanguage: "id-ID",
    brand: {
      "@type": "Brand",
      name: options.brandName ?? SITE_NAME,
    },
  };

  if (product.description) node.description = product.description;
  if (product.badge) node.disambiguatingDescription = product.badge;
  if (product.images.length > 0) {
    node.image = product.images.map((image) => absoluteUrl(image.url));
  }

  if (!product.is_placeholder) {
    // Varian bersarang: SKU pertama dari varian pertama. `default_sku` tidak
    // ada di kontrak, jadi tidak boleh disintesis di sini.
    const skuCount = product.variants.reduce(
      (total, variant) => total + variant.skus.length,
      0,
    );
    const sku = product.variants[0]?.skus[0] ?? null;
    if (sku) {
      node.sku = sku.code;
    }
    node.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "IDR",
      offerCount: Math.max(skuCount, 1),
      availability:
        product.is_out_of_stock
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    };
  }

  return node;
}

export interface BreadcrumbItem {
  name: string;
  /** Path relatif, mis. `/produk` atau `/kategori/apparel`. */
  href: string;
}

/** `BreadcrumbList` diserialisasi di server, sekali saja per halaman. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

/** `CollectionPage` untuk listing katalog & kategori (PRD §4.4). */
export function collectionPageJsonLd(options: {
  name: string;
  path: string;
  description: string | null;
}): JsonLdObject {
  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    url: absoluteUrl(options.path),
    inLanguage: "id-ID",
    isPartOf: { "@id": WEBSITE_ID },
  };
  if (options.description) node.description = options.description;
  return node;
}

/** `ContactPage` untuk halaman toko/kontak. */
export function contactPageJsonLd(brand: BrandInfo): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Kontak & Toko Senaru",
    url: absoluteUrl("/kontak"),
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Organization",
      name: brand.brand_name ?? SITE_NAME,
      ...(brand.store_address
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: brand.store_address,
              addressCountry: "ID",
            },
          }
        : {}),
      ...(brand.email ? { email: brand.email } : {}),
      ...(brand.whatsapp_cs
        ? {
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: brand.whatsapp_cs,
                areaServed: "ID",
                availableLanguage: ["id"],
              },
            ],
          }
        : {}),
      ...(brand.instagram_url ? { sameAs: [brand.instagram_url] } : {}),
    },
  };
}
