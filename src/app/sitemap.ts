import type { MetadataRoute } from "next";

import { getCategories, getCollectionList, getProducts } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";
import { PER_PAGE } from "@/lib/catalog-query";
import { absoluteUrl } from "@/lib/site";

/**
 * `sitemap.xml` dinamis.
 *
 * Isinya dibangun dari katalog yang benar-benar aktif, bukan daftar URL
 * statis. PRD §4.4: halaman katalog dan produk harus dapat ditemukan
 * mesin pencari, dan `KONTRAK-API.md` hanya mengembalikan produk yang sudah
 * diterbitkan — jadi sitemap otomatis barren ketika katalog kosong, tanpa
 * perlu diedit manual.
 *
 * Halaman yang tidak ada isinya TIDAK masuk sitemap: `/keranjang`,
 * `/checkout`, `/masuk`, `/daftar`, dan `/lacak` adalah halaman
 * utilitas/personal. Memasukkannya akan meminta crawler mengindeks
 * halaman kosong.
 *
 * `lastModified` sengaja dibiarkan `new Date()` di halaman statis, karena
 * katalog bisa berubah kapan saja. Untuk URL produk tidak ada field
 * `updated_at` di kontrak API, jadi tidak ada yang bisa diklaim.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/produk"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/koleksi"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/cerita"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/kontak"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const [categories, allProducts, collections] = await Promise.all([
    getCategories(),
    fetchAllProducts(),
    /*
     * Satu request mengembalikan SEMUA koleksi aktif (maks 100, tanpa
     * paginasi), dan `Collection::active()` sudah menyaring `is_active`,
     * `published_at <= now`, `ended_at >= now`. Jadi daftar sitemap menyusut
     * sendiri saat koleksi berakhir — tanpa cron, tanpa edit manual.
     * `null` (backend mati saat build) = tidak ada entri ditambahkan.
     */
    getCollectionList(),
  ]);

  const collectionEntries: MetadataRoute.Sitemap = (collections ?? []).map(
    (collection) => ({
      url: absoluteUrl(`/koleksi/${collection.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      ...(collection.banner_desktop
        ? { images: [absoluteUrl(collection.banner_desktop)] }
        : {}),
    }),
  );

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map(
    (category) => ({
      url: absoluteUrl(`/kategori/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const productEntries: MetadataRoute.Sitemap = allProducts.map((product) => ({
      url: absoluteUrl(`/produk/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      // `images` diisi hanya kalau produk benar-benar punya gambar. Kalau
      // tidak, `next/image` akan merender placeholder lokal yang tidak
      // berguna bagi index gambar Google — lebih baik tidak dideklarasikan.
      ...(product.image?.url ? { images: [absoluteUrl(product.image.url)] } : {}),
    }),
  );

  return [
    ...staticEntries,
    ...collectionEntries,
    ...categoryEntries,
    ...productEntries,
  ];
}

/**
 * Kumpulkan seluruh produk aktif dengan berjalan halaman demi halaman.
 *
 * Penting: `per_page` TIDAK boleh dibuat besar tanpa perhitungan.
 * `CatalogController` memvalidasi `per_page` dengan aturan `max:48`, dan nilai
 * yang melebihi batas itu membuat validasi gagal sehingga backend membalas
 * 422. Karena `getProducts` menelan error, sitemap lalu terlihat "sukses"
 * padahal isinya kosong — persis yang terjadi di versi pertama file ini yang
 * memakai `per_page: 100`.
 *
 * Jadi halaman diambil satu per satu memakai `PER_PAGE` (24), dan jumlah
 * halaman dibatasi `MAX_SITEMAP_PAGES` supaya biaya build tidak ikut tumbuh
 * tanpa batas bila katalog bertambah besar someday.
 */
const MAX_SITEMAP_PAGES = 50;

async function fetchAllProducts(): Promise<ProductListItem[]> {
  const collected: ProductListItem[] = [];

  for (let page = 1; page <= MAX_SITEMAP_PAGES; page += 1) {
    const result = await getProducts({
      q: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      sort: "latest",
      inStock: false,
      page,
      perPage: PER_PAGE,
    });

    if (!result) break;
    collected.push(...result.products);

    if (result.meta.last_page <= page) break;
    if (result.products.length === 0) break;
  }

  return collected;
}
