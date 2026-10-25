import { cookies } from "next/headers";

// `ApiError` tinggal di modul sendiri supaya modul ini (yang memakai
// `next/headers`) tidak ikut terbawa ke bundel Client Component.
// Lihat src/lib/api-error.ts untuk alasannya.
import { ApiError, type PriceChange } from "@/lib/api-error";
import { mediaUrl } from "@/lib/media";
import { safeExternalUrl } from "@/lib/url";
export { ApiError } from "@/lib/api-error";

import type {
  AuthResponse,
  AuthUser,
  BannerItem,
  BrandInfo,
  Cart,
  CategoryItem,
  CheckoutRequest,
  CollectionDetailResult,
  CollectionListItem,
  CollectionPagination,
  CollectionSeoMeta,
  CreatedOrder,
  CustomInquiryRequest,
  GuestWhatsAppRequest,
  GuestWhatsAppResult,
  HeroSliderItem,
  LoginRequest,
  OrderDetail,
  OrderItemSnapshot,
  OrderStatus,
  OrderStatusHistory,
  OrderSummary,
  PaymentInfo,
  PaymentInstruction,
  ProductDetail,
  ProductImageItem,
  ProductListItem,
  ProductListMeta,
  ProductSku,
  RegisterRequest,
  ShippingAddressSnapshot,
  ShippingDestination,
  ShippingQuote,
  ShippingQuoteRequest,
  SortKey,
  Voucher,
  VoucherApplyResult,
} from "./types";

/**
 * Client HTTP tipis ke Laravel API v1.
 *
 * Prinsip yang tidak boleh dilanggar:
 * - Storefront **tidak pernah** menyentuh database (ARSITEKTUR §1). Semua
 *   data lewat endpoint ini.
 * - Read memakai `cache: "no-store"`. PRD §3.2 AC: "Ketika buyer refresh
 *   halaman produk, harga baru tampil tanpa cache lama." Stok & harga adalah
 *   hal yang paling tidak boleh basi di halaman ini, jadi cache statis
 *   ditolak walaupun PRD §4.1 secara umum menyebut caching — untuk endpoint
 *   katalog, Redis/Nginx yang menahan, bukan Next.
 * - `apiSafe*` tidak pernah melempar exception. Halaman katalog wajib tetap
 *   ter-render saat backend mati; yang berubah adalah penanda
 *   "belum dapat dimuat", bukan seluruh halaman 500.
 */

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

/** Nama cookie tempat token Sanctum disimpan setelah login. */
export const AUTH_TOKEN_COOKIE = "palorinjani_token";

/**
 * Cookie sisi-Next untuk token keranjang tamu.
 *
 * Backend menyimpan keranjang tamu di Redis dengan kunci `guest_token` dan
 * mengirimkannya lewat cookie `guest_cart_id` pada respons `GET /cart` dan
 * `POST /cart/items` (`CartController`). Cookie itu disetel di domain API,
 * BUKAN domain storefront — jadi SSR Next tidak boleh mengandalkannya. Karena
 * itu storefront menyimpan token yang sama di cookie miliknya sendiri dan
 * mengirimnya kembali lewat header `X-Guest-Token`, yang dibaca
 * `CartService::resolveGuestToken()` lebih dulu sebelum cookie apa pun.
 *
 * Tanpa ini, setiap request keranjang tamu membuat sesi baru: isi keranjang
 * "hilang" begitu halaman dimuat ulang.
 */
export const GUEST_TOKEN_COOKIE = "palorinjani_guest_token";

/** Umur cookie tamu, disamakan dengan TTL keranjang tamu backend (30 hari). */
export const GUEST_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Timeout request supaya satu backend yang menggantung tidak menahan SSR. */
const REQUEST_TIMEOUT_MS = 8_000;


type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  token?: string | null;
  /**
   * Token keranjang tamu. Dikirim sebagai header `X-Guest-Token` supaya
   * backend memakai sesi keranjang yang sama di setiap request.
   */
  guestToken?: string | null;
  /** Teruskan cookie permintaan (dipakai untuk guest cart di Redis). */
  forwardCookies?: boolean;
  signal?: AbortSignal;
}

function buildQuery(
  query: RequestOptions["query"],
): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

async function requestCookieHeader(): Promise<string> {
  try {
    const store = await cookies();
    return store.toString();
  } catch {
    // Di luar request scope (mis. saat build sitemap) cookie tidak tersedia.
    return "";
  }
}

/**
 * Token keranjang tamu dari cookie storefront sendiri.
 *
 * Mengembalikan `null` di luar request scope (build sitemap) atau saat tamu
 * belum punya keranjang — keduanya bukan kesalahan.
 */
export async function getGuestToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(GUEST_TOKEN_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Simpan token tamu yang baru dibuat backend.
 *
 * `cookies().set()` hanya boleh dipanggil dari Server Action / Route Handler.
 * Fungsi ini juga dipanggil dari jalur read (mis. `GET /cart` saat render);
 * di konteks itu Next melempar, dan memang tidak ada yang perlu disimpan karena
 * token hanya muncul saat item pertama ditambahkan. Karena itu kegagalannya
 * ditelan diam-diam, bukan dibiarkan menggagalkan render.
 */
export async function persistGuestToken(token: string | null | undefined): Promise<void> {
  if (typeof token !== "string" || token.trim().length === 0) return;
  try {
    const store = await cookies();
    store.set(GUEST_TOKEN_COOKIE, token, {
      maxAge: GUEST_TOKEN_TTL_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  } catch {
    // Konteks render — cookie tidak bisa ditulis di sini.
  }
}

/**
 * Hapus token tamu.
 *
 * Dipanggil setelah login/register: backend sudah menggabungkan keranjang tamu
 * ke keranjang akun, jadi token lamanya tidak boleh dipakai lagi.
 */
export async function clearGuestToken(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(GUEST_TOKEN_COOKIE);
  } catch {
    // Konteks render — tidak ada yang perlu dihapus.
  }
}

/**
 * Satu-satunya titik keluar ke backend.
 * Melempar `ApiError` — pemanggil read yang tahan banting memakai `apiSafe*`.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    token,
    guestToken,
    forwardCookies = false,
    signal,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  // Prioritas tertinggi di `CartService::resolveGuestToken()` — dipakai agar
  // sesi keranjang tamu tidak bergantung pada cookie lintas-domain.
  if (guestToken) headers["X-Guest-Token"] = guestToken;

  if (forwardCookies) {
    const cookieHeader = await requestCookieHeader();
    if (cookieHeader) headers.Cookie = cookieHeader;
  }

  // Abort manual supaya SSR tidak menggantung saat backend tidak merespons.
  const timeoutController = new AbortController();
  const timeout = setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // PRD §3.2 AC — lihat catatan di kepala file.
      cache: "no-store",
      signal: signal ?? timeoutController.signal,
    });

    const raw = await response.text();
    const payload: unknown = raw ? safeParseJson(raw) : null;

    if (!response.ok) {
      const { message, errors, errorCode, priceChanges, newGrandTotal } =
        readErrorPayload(payload);
      throw new ApiError(message, response.status, errors, {
        errorCode,
        priceChanges,
        newGrandTotal,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Jaringan gagal / timeout / abort. Pesannya sengaja generik supaya
    // detail internal tidak bocor ke pengguna (PRD §3.12: log tanpa data
    // sensitif) dan supaya halaman bisa memakai jalur placeholder.
    throw new ApiError(
      "Layanan sedang tidak dapat dihubungi. Silakan coba lagi sebentar.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Baca `message`, `errors`, dan penanda mesin dari balasan error.
 *
 * `error_code` dipakai supaya frontend membedakan `price_changed` dari
 * `stock_unavailable` tanpa mencocokkan teks pesan. `changes` dan
 * `new_grand_total` ikut dibaca karena `PriceChangedException` mengirimnya dan
 * UI perlu menampilkannya apa adanya.
 */
function readErrorPayload(payload: unknown): {
  message: string;
  errors: Record<string, string[]>;
  errorCode: string | null;
  priceChanges: PriceChange[];
  newGrandTotal: number | null;
} {
  if (!isRecord(payload)) {
    return {
      message: "Permintaan gagal diproses server.",
      errors: {},
      errorCode: null,
      priceChanges: [],
      newGrandTotal: null,
    };
  }

  const message =
    typeof payload.message === "string"
      ? payload.message
      : "Permintaan gagal diproses server.";

  const newGrandTotal =
    typeof payload.new_grand_total === "number" &&
    Number.isFinite(payload.new_grand_total)
      ? payload.new_grand_total
      : null;

  return {
    message,
    errors: readFieldErrors(payload.errors),
    errorCode:
      typeof payload.error_code === "string" ? payload.error_code : null,
    priceChanges: readPriceChanges(payload.changes),
    newGrandTotal,
  };
}

/** Normalisasi `changes[]` dari `PriceChangedException`. */
function readPriceChanges(value: unknown): PriceChange[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => ({
    sku_id: readNumber(row.sku_id, 0),
    sku_code: readString(row, "sku_code") ?? "",
    product_name: readString(row, "product_name") ?? "",
    old_price: readNumber(row.old_price, 0),
    new_price: readNumber(row.new_price, 0),
    quantity: readNumber(row.quantity, 0),
  }));
}

function readFieldErrors(
  errors: unknown,
): Record<string, string[]> {
  if (!isRecord(errors)) return {};
  const result: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      result[field] = value.filter((item): item is string => typeof item === "string");
    } else if (typeof value === "string") {
      result[field] = [value];
    }
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Bentuk balasan backend belum terkunci 100%; ini normalisasi satu pintu. */
function unwrap<T>(payload: unknown, key: "data" | "meta"): T | null {
  if (!isRecord(payload)) return null;
  const value = payload[key];
  return value === undefined ? null : (value as T);
}

/* -------------------------------------------------------------------------- */
/* Pemanggil yang tahan kegagalan (semua halaman SSR)                        */
/* -------------------------------------------------------------------------- */

/** `GET /brand` — dari `app_settings`, bukan hardcode (PRD §3.11). */
export async function getBrand(): Promise<BrandInfo | null> {
  try {
    const payload = await apiRequest<unknown>("/brand");
    return normalizeBrand(unwrap<Record<string, unknown>>(payload, "data"));
  } catch {
    return null;
  }
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * `GET /brand` → bentuk storefront.
 *
 * CATATAN KONTRAK: `CatalogController::brand()` mengirim `name`, `story`,
 * `address`, `city`, `whatsapp`, dan `opening_hours`, sedangkan
 * `docs/KONTRAK-API.md` §1 dan bentuk di `types.ts` memakai `brand_name`,
 * `about`, `store_address`, `whatsapp_cs`, dan `store_opening_hours`.
 *
 * `readFirstString` mencoba nama field dari dokumen lebih dulu, lalu nama
 * field dari backend. Dengan begitu data yang sudah diisi admin di
 * `app_settings` tetap terlihat di storefront tanpa menunggu dokumen
 * diperbarui, dan kalau backend berubah ke bentuk dokumen someday, kode ini
 * tidak perlu diubah.
 *
 * `city` digabung ke alamat karena `store_address` di dokumen dianggap
 * alamat lengkap, sementara backend menyimpannya sebagai field terpisah.
 */
function normalizeBrand(
  source: Record<string, unknown> | null,
): BrandInfo | null {
  if (!source) return null;

  const address = readFirstString(source, ["store_address", "address"]);
  const city = readFirstString(source, ["store_city", "city"]);

  return {
    brand_name: readFirstString(source, ["brand_name", "name"]),
    tagline: readFirstString(source, ["tagline"]),
    about: readFirstString(source, ["about", "story"]),
    logo_url: readFirstString(source, ["logo_url"]),
    whatsapp_cs: readFirstString(source, ["whatsapp_cs", "whatsapp"]),
    email: readFirstString(source, ["email"]),
    // Tautan kanal brand disanitasi, bukan dipakai mentah: nilainya diketik
    // bebas di panel admin dan masuk langsung ke `href`. Tanpa `safeExternalUrl`,
    // skema `javascript:` akan lolos dan ikon footer jadi pembawa skrip.
    instagram_url: safeExternalUrl(readFirstString(source, ["instagram_url"])),
    instagram_handle: readFirstString(source, ["instagram_handle"]),
    facebook_url: safeExternalUrl(readFirstString(source, ["facebook_url"])),
    tiktok_url: safeExternalUrl(readFirstString(source, ["tiktok_url"])),
    store_name: readFirstString(source, ["store_name"]),
    store_address: address && city ? `${address}, ${city}` : (address ?? city),
    store_maps_url: readFirstString(source, ["store_maps_url"]),
    store_coordinates: readFirstString(source, ["store_coordinates"]),
    store_opening_hours: readFirstString(source, [
      "store_opening_hours",
      "opening_hours",
    ]),
    site_url: readFirstString(source, ["site_url"]),
  };
}

/**
 * Kunci pertama yang terisi, dari daftar nama field alternatif.
 *
 * `readString` mengembalikan `null` untuk string kosong, jadi field yang belum
 * diisi admin otomatis dilewati dan kunci berikutnya dicoba.
 */
function readFirstString(
  source: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | null {
  for (const key of keys) {
    const value = readString(source, key);
    if (value) return value;
  }
  return null;
}

/** `GET /categories` — hanya kategori aktif. */
export async function getCategories(): Promise<CategoryItem[] | null> {
  try {
    const payload = await apiRequest<unknown>("/categories");
    const list = unwrap<unknown[]>(payload, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map(normalizeCategory)
      .filter((item): item is CategoryItem => item !== null);
  } catch {
    return null;
  }
}

function normalizeCategory(value: unknown): CategoryItem | null {
  if (!isRecord(value)) return null;
  const name = readString(value, "name");
  const slug = readString(value, "slug");
  if (!name || !slug) return null;
  const count = value.products_count;
  return {
    id: typeof value.id === "number" ? value.id : null,
    name,
    slug,
    products_count: typeof count === "number" ? count : null,
  };
}

/** `GET /banners` — backend sudah memfilter tanggal tayang. */
export async function getBanners(): Promise<BannerItem[] | null> {
  try {
    const payload = await apiRequest<unknown>("/banners");
    const list = unwrap<unknown[]>(payload, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map(normalizeBanner)
      .filter((item): item is BannerItem => item !== null);
  } catch {
    return null;
  }
}

/**
 * Banner hero.
 *
 * Menerima DUA bentuk field karena backend dan mockup berbeda penamaan:
 *
 *   - `image` / `image_alt` / `cta_url` / `cta_label`  -> `CatalogController::banners()`
 *   - `image_url` / `image_alt` / `link_url` / `link_label` -> bentuk di mockup lama
 *
 * Kalau hanya satu yang dikenali, banner diam-diam tampil tanpa gambar —
 * dan itu sulit terdeteksi karena tidak ada error sama sekali.
 */
function normalizeBanner(value: unknown): BannerItem | null {
  if (!isRecord(value)) return null;

  const title = readString(value, "title");
  // `path` relatif -> URL penuh (ARSITEKTUR §3).
  const imageUrl = mediaUrl(
    readString(value, "image") ?? readString(value, "image_url"),
  );

  if (!title && !imageUrl) return null;

  return {
    id: typeof value.id === "number" ? value.id : null,
    title,
    subtitle: readString(value, "subtitle"),
    image_url: imageUrl,
    image_alt: readString(value, "image_alt") ?? title,

    // Varian crop per orientasi. `null` kalau crop-nya belum dibuat —
    // pemanggil wajib jatuh ke `image_url`, bukan menampilkan kotak rusak.
    image_landscape_url: mediaUrl(readString(value, "image_landscape")),
    image_portrait_url: mediaUrl(readString(value, "image_portrait")),
    image_tablet_url: mediaUrl(readString(value, "image_tablet")),
    link_url: readString(value, "cta_url") ?? readString(value, "link_url"),
    link_label: readString(value, "cta_label") ?? readString(value, "link_label"),

    // Elemen editorial lookbook. Semua opsional — komponen hero punya
    // fallback untuk masing-masing, jadi banner yang belum diisi field
    // baru ini tetap tampil utuh.
    stamp_left: readString(value, "stamp_left"),
    stamp_right: readString(value, "stamp_right"),
    eyebrow: readString(value, "eyebrow"),
    cta2_label: readString(value, "cta2_label"),
    cta2_url: readString(value, "cta2_url"),

    // `theme` menentukan warna teks di atas foto. Default "light" (teks
    // terang) karena itu yang aman untuk foto gelap — kondisi paling umum.
    theme: readString(value, "theme") === "dark" ? "dark" : "light",

    // Kekuatan scrim. Default 45% supaya teks tetap terbaca walau admin
    // belum menyetelnya.
    overlay_opacity: readNumber(value.overlay_opacity, 45),
  };
}

/**
 * `GET /hero-sliders` — sumber hero beranda.
 *
 * `null` = backend tidak terjangkau. `[]` = tidak ada slide aktif, dan itu
 * respons SAH (admin belum mengaktifkan slide apa pun) — beranda lalu
 * menampilkan piring teks dari nilai fallback, bukan hero kosong.
 *
 * Urutan TIDAK diubah di sini: `PublicHeroSliderController` sudah memakai
 * `active()->ordered()->limit(100)` (`sort_order asc, id asc`).
 */
export async function getHeroSliders(): Promise<HeroSliderItem[] | null> {
  try {
    const payload = await apiRequest<unknown>("/hero-sliders");
    const list = unwrap<unknown[]>(payload, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map(normalizeHeroSlider)
      .filter((item): item is HeroSliderItem => item !== null);
  } catch {
    return null;
  }
}

/**
 * Normalisasi satu slide `/hero-sliders` — satu pintu, seperti
 * `normalizeBanner()`. Bentuknya bersarang (`images`, `actions`), jadi
 * pembacaan field dilakukan lewat `isRecord` dulu.
 */
function normalizeHeroSlider(value: unknown): HeroSliderItem | null {
  if (!isRecord(value)) return null;

  const images = isRecord(value.images) ? value.images : {};
  const actions = isRecord(value.actions) ? value.actions : {};
  const primary = isRecord(actions.primary) ? actions.primary : {};
  const secondary = isRecord(actions.secondary) ? actions.secondary : {};

  // `image_desktop` NOT NULL di DB: slide tanpa foto desktop bukan slide yang
  // bisa ditampilkan, jadi dibuang di sini alih-alih menjadi kotak kosong.
  const desktopUrl = mediaUrl(readString(images, "desktop_url"));
  if (!desktopUrl) return null;

  return {
    id: typeof value.id === "number" ? value.id : null,
    series_tag: readString(value, "series_tag"),
    location_tag: readString(value, "location_tag"),
    badge: readString(value, "badge"),
    title: readString(value, "title"),
    description: readString(value, "description"),
    images: {
      desktop_url: desktopUrl,
      // `mediaUrl` meneruskan URL absolut apa adanya, jadi tetap benar kalau
      // media pindah ke CDN.
      mobile_url: mediaUrl(readString(images, "mobile_url")),
      alt_text: readString(images, "alt_text"),
    },
    actions: {
      primary: {
        label: readString(primary, "label"),
        url: readString(primary, "url"),
      },
      secondary: {
        label: readString(secondary, "label"),
        url: readString(secondary, "url"),
      },
    },
    order: readNumber(value.order, 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Katalog                                                                    */
/* -------------------------------------------------------------------------- */

export interface CatalogParams {
  q: string | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  /**
   * `SortKey`, bukan `string` bebas: `parseCatalogParams` sudah memvalidasi
   * nilai dari query string terhadap `SORT_OPTIONS`, jadi menyisipkan nilai
   * lain di sini akan lolos ke URL tanpa pernah dicek.
   */
  sort: SortKey;
  inStock: boolean;
  page: number;
  perPage: number;
}

export interface CatalogResult {
  products: ProductListItem[];
  meta: ProductListMeta;
}

const EMPTY_META: ProductListMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 24,
  total: 0,
};

/**
 * Normalisasi satu baris katalog.
 *
 * WAJIB ADA, bukan sekadar mengandalkan cast langsung. Sebelumnya `getProducts()` hanya
 * melakukan `filter()` lalu menyerahkan objek mentah backend apa adanya
 * sebagai `ProductListItem`. Akibatnya field `image` berisi
 * `{ path, alt }`, padahal tipenya mendeklarasikan `{ url, alt }` — sehingga:
 *   - `product.image.url` selalu `undefined`
 *   - TypeScript tidak menangkap apa pun, karena datanya hasil cast tanpa tipe
 *
 * Gejalanya di layar: setiap kartu produk tanpa gambar, padahal API
 * sudah mengirim foto. Sulit dicari karena tidak ada error sama sekali.
 */
function normalizeListItem(source: Record<string, unknown>): ProductListItem {
  return {
    id: readNumber(source.id, 0),
    name: readString(source, "name") ?? "",
    slug: readString(source, "slug") ?? "",
    is_placeholder: source.is_placeholder === true,
    short_description: readString(source, "short_description"),
    // `ProductListResource` mengirim `base_price`/`formatted_base_price`,
    // sementara dokumen kontrak menyebut `price_min`/`price_display`.
    // Keduanya diterima supaya kartu tidak pernah menampilkan "Rp 0".
    price_min: readNumber(source.price_min, readNumber(source.base_price, 0)),
    price_max: readNumber(source.price_max, readNumber(source.base_price, 0)),
    price_display:
      readString(source, "price_display") ??
      readString(source, "formatted_base_price") ??
      "",
    is_out_of_stock: source.is_out_of_stock === true,

    // Badge promosi. `warning` hanya diakui kalau backend mengirimnya;
    // nilai lain jatuh ke `neutral` supaya kelas warna yang tidak dikenal
    // tidak pernah sampai ke DOM.
    badge: readString(source, "badge"),
    badge_tone: readString(source, "badge_tone") === "warning" ? "warning" : "neutral",

    // Label ukuran. Disaring ke string non-kosong supaya kartu tidak
    // pernah mencetak chip berisi spasi.
    sizes: Array.isArray(source.sizes)
      ? source.sizes
          .filter((row): row is string => typeof row === "string")
          .map((row) => row.trim())
          .filter((row) => row.length > 0)
      : [],

    // `thumbnail_url` (string, sudah URL absolut dari backend) adalah bentuk
    // sebenar `ProductListResource`; objek `image` hanya ada di dokumen
    // kontrak. Tanpa fallback ini setiap kartu tampil tanpa foto.
    image:
      normalizeMediaImage(source.image) ??
      normalizeImageUrl(source.thumbnail_url, readString(source, "name")),
    category: isRecord(source.category)
      ? {
          name: readString(source.category, "name") ?? "",
          slug: readString(source.category, "slug") ?? "",
        }
      : null,
  };
}

/**
 * Ubah satu objek media dari backend menjadi bentuk yang siap dipakai komponen.
 *
 * Backend mengirim `path` RELATIF (`products/produk-01-433.webp`), bukan URL
 * absolut — supaya bucket/CDN bisa diganti tanpa update baris database
 * (ARSITEKTUR §3). URL penuh dirangkai di sini, satu tempat, lewat `mediaUrl()`.
 *
 * Terima `path` maupun `url` supaya tahan terhadap kedua bentuk — tapi
 * `path` adalah yang benar sesuai kontrak.
 */
function normalizeMediaImage(
  value: unknown,
): { url: string | null; alt: string | null } | null {
  if (!isRecord(value)) return null;

  const raw = readString(value, "path") ?? readString(value, "url");
  const url = mediaUrl(raw);
  if (!url) return null;

  return { url, alt: readString(value, "alt") ?? readString(value, "image_alt") };
}

/**
 * Bungkus URL/path media TUNGGAL (mis. `thumbnail_url`) menjadi `{ url, alt }`.
 *
 * Berbeda dari `normalizeMediaImage` yang mengharapkan objek, helper ini
 * menangani field berbentuk string. `mediaUrl` mengembalikan URL apa adanya
 * bila sudah absolut (bentuk yang dikirim `ProductListResource`).
 */
function normalizeImageUrl(
  value: unknown,
  alt: string | null,
): ProductImageItem | null {
  const url = mediaUrl(typeof value === "string" ? value : null);
  return url ? { url, alt } : null;
}

/** Ambil `attributes` sebagai peta string→string, atau `null` bila kosong. */
function readAttributes(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

/**
 * `GET /products` — filter & sort sudah diteruskan apa adanya ke query param
 * supaya URL tetap shareable (PRD §3.3 + KONTRAK-API §1).
 */
export async function getProducts(
  params: CatalogParams,
): Promise<CatalogResult | null> {
  try {
    const payload = await apiRequest<unknown>("/products", {
      query: {
        // Backend membaca `search` (`ProductController::index`), BUKAN `q`.
        // Sebelumnya di sini dikirim `q`, sehingga kotak pencarian tidak
        // pernah menyaring apa pun — hasilnya selalu katalog penuh.
        search: params.q,
        category: params.category,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        sort: params.sort,
        in_stock: params.inStock ? 1 : null,
        page: params.page,
        per_page: params.perPage,
      },
    });
    if (!isRecord(payload)) return null;
    const list = payload.data;
    if (!Array.isArray(list)) return null;

    return {
      products: list
        .filter(isRecord)
        .filter((item) => typeof item.slug === "string")
        .map((item) => normalizeListItem(item)),
      meta: normalizeMeta(payload.meta),
    };
  } catch {
    return null;
  }
}

function normalizeMeta(value: unknown): ProductListMeta {
  if (!isRecord(value)) return EMPTY_META;

  return {
    current_page: readNumber(value.current_page, 1),
    last_page: readNumber(value.last_page, 1),
    per_page: readNumber(value.per_page, 24),
    total: readNumber(value.total, 0),
  };
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeCategoryRef(value: unknown): { name: string; slug: string } | null {
  if (!isRecord(value)) return null;
  const name = readString(value, "name");
  const slug = readString(value, "slug");
  if (!name || !slug) return null;
  return { name, slug };
}

/** `GET /products/{slug}` */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const payload = await apiRequest<unknown>(
      `/products/${encodeURIComponent(slug)}`,
    );
    const data = unwrap<Record<string, unknown>>(payload, "data");
    if (!data || typeof data.slug !== "string") return null;
    return normalizeProductDetail(data);
  } catch {
    return null;
  }
}

function normalizeProductDetail(
  source: Record<string, unknown>,
): ProductDetail {
  const images = normalizeDetailImages(source);
  const variants = normalizeDetailVariants(source);

  // `default_sku` diutamakan kalau backend mengirimnya; kalau tidak, SKU
  // pertama dari `variants[]` hasil ratakan dipakai (PRD §3.2 AC: produk
  // tanpa varian tetap punya satu SKU yang bisa ditambahkan ke keranjang).
  const defaultSku =
    (isRecord(source.default_sku) ? normalizeSku(source.default_sku) : null) ??
    firstSkuFromList(source.skus) ??
    variants[0] ??
    null;

  return {
    id: readNumber(source.id, 0),
    name: readString(source, "name") ?? "",
    slug: readString(source, "slug") ?? "",
    is_placeholder: source.is_placeholder === true,
    short_description: readString(source, "short_description"),
    description: readString(source, "description"),
    // `ProductDetailResource` mengirim `base_price`/`formatted_base_price`.
    // `price_display` tetap `null` (bukan string kosong) supaya `formatHarga`
    // bisa membedakan "harga belum diisi admin" dari "harga 0".
    price_min: readNumber(source.price_min, readNumber(source.base_price, 0)),
    price_max: readNumber(source.price_max, readNumber(source.base_price, 0)),
    price_display:
      readString(source, "price_display") ??
      readString(source, "formatted_base_price"),
    is_out_of_stock: source.is_out_of_stock === true,
    badge: readString(source, "badge"),
    images,
    variants,
    default_sku: defaultSku,
    category: isRecord(source.category) ? normalizeCategoryRef(source.category) : null,
  };
}

/**
 * Susun `images[]` dari endpoint detail.
 *
 * `ProductDetailResource` menaruh foto di `media[]` (`{ id, url, ... }`),
 * sedangkan dokumen kontrak menyebut `images[]`. Keduanya diterima; item
 * berupa objek dengan `path`-atau-`url` dinormalkan oleh `normalizeMediaImage`.
 */
function normalizeDetailImages(source: Record<string, unknown>): ProductImageItem[] {
  const raw = Array.isArray(source.images)
    ? source.images
    : Array.isArray(source.media)
      ? source.media
      : [];

  return raw
    .map(normalizeMediaImage)
    .filter((item): item is ProductImageItem => item !== null);
}

/**
 * Ratakan varian detail menjadi satu daftar SKU.
 *
 * Backend (`ProductDetailResource`) mengelompokkan SKU di dalam varian:
 * `variants[] = [{ id, name, attributes, skus: [...] }]`. Frontend memakai
 * satu daftar SKU rata, jadi atribut varian induk disalin ke setiap SKU-nya
 * supaya label varian ("M · Black") tetap punya sumber. Bentuk kontrak lama
 * (`variants[]` berisi SKU langsung) juga tetap didukung.
 */
function normalizeDetailVariants(source: Record<string, unknown>): ProductSku[] {
  const raw = source.variants;
  if (!Array.isArray(raw)) return [];

  const out: ProductSku[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;

    if (Array.isArray(item.skus)) {
      const attributes = readAttributes(item.attributes);
      for (const skuRaw of item.skus) {
        const sku = normalizeSku(skuRaw, attributes);
        if (sku) out.push(sku);
      }
      continue;
    }

    const sku = normalizeSku(item);
    if (sku) out.push(sku);
  }

  return out;
}

/** SKU pertama dari array `skus[]`, atau `null` bila tidak ada. */
function firstSkuFromList(value: unknown): ProductSku | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const sku = normalizeSku(item);
    if (sku) return sku;
  }
  return null;
}

function normalizeSku(
  value: unknown,
  attributesOverride?: Record<string, string> | null,
): ProductSku | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "number") return null;
  return {
    id,
    // `ProductDetailResource` memakai `sku_code`/`formatted_price`/
    // `is_available`; dokumen kontrak memakai `code`/`price_display`/
    // `is_out_of_stock`. Keduanya diterima supaya varian tidak pernah hilang.
    code: readString(value, "code") ?? readString(value, "sku_code") ?? "",
    price: readNumber(value.price, 0),
    price_display:
      readString(value, "price_display") ?? readString(value, "formatted_price"),
    stock: typeof value.stock === "number" ? value.stock : null,
    is_out_of_stock: value.is_out_of_stock === true || value.is_available === false,
    attributes: attributesOverride ?? readAttributes(value.attributes),
  };
}

/* -------------------------------------------------------------------------- */
/* Koleksi                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Nilai `per_page` untuk detail koleksi.
 *
 * Sama dengan `PER_PAGE` di `lib/catalog-query.ts`, tapi TIDAK diimpor dari
 * sana: modul itu dipakai Client Component, sedangkan file ini memakai
 * `next/headers`. Satu impor saja akan menyeret `next/headers` ke bundel client.
 */
const COLLECTION_PER_PAGE = 24;

/**
 * `GET /collections` — seluruh koleksi aktif (maks 100, tanpa paginasi).
 *
 * `null` = backend tidak bisa dihubungi. `[]` = backend hidup, memang belum ada
 * koleksi yang tayang. Dua keadaan itu dirender berbeda.
 */
export async function getCollectionList(): Promise<CollectionListItem[] | null> {
  try {
    const payload = await apiRequest<unknown>("/collections");
    /*
     * `CollectionController::index()` menyerahkan
     * `CollectionListResource::collection(...)` langsung ke `respond()` TANPA
     * `->resolve()` — berbeda dari `CategoryController`. Bentuk kabelnya jadi
     * bergantung serializer: `data: [...]` ATAU `data: { data: [...] }`.
     *
     * Salah tebak bentuk berarti `/koleksi` tampil kosong padahal status 200 —
     * tanpa satu pun error. Karena itu keduanya diterima di sini.
     */
    const raw = unwrap<unknown>(payload, "data");
    const list = Array.isArray(raw) ? raw : unwrap<unknown[]>(raw, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map(normalizeCollection)
      .filter((item): item is CollectionListItem => item !== null);
  } catch {
    return null;
  }
}

/**
 * Hasil `getCollectionDetail`: `"not_found"` = backend menjawab 404 (koleksi
 * tidak ada / sudah berakhir), `null` = backend mati atau gagal.
 *
 * Sentinel itu perlu: `ApiError.status === 404` harus dibedakan dari
 * `status === 0` (jaringan mati). Outage yang dipetakan ke 404 akan mencabut
 * seluruh halaman koleksi dari indeks mesin pencari.
 */
export type CollectionLookup = CollectionDetailResult | "not_found" | null;

/** `GET /collections/{slug}?page=N&per_page=24` */
export async function getCollectionDetail(
  slug: string,
  page = 1,
): Promise<CollectionLookup> {
  try {
    const payload = await apiRequest<unknown>(
      `/collections/${encodeURIComponent(slug)}`,
      { query: { page, per_page: COLLECTION_PER_PAGE } },
    );
    const data = unwrap<Record<string, unknown>>(payload, "data");
    if (!data) return null;

    const collection = normalizeCollection(data);
    if (!collection) return null;

    // `CollectionDetailResource` menaruh produk di `products.data` +
    // `products.pagination`. Produknya bentuk `ProductListResource`, jadi
    // normalizer katalog yang sudah ada dipakai ulang.
    const productsBlock = isRecord(data.products) ? data.products : null;
    const products = (Array.isArray(productsBlock?.data) ? productsBlock.data : [])
      .filter(isRecord)
      .filter((item) => typeof item.slug === "string")
      .map((item) => normalizeListItem(item));

    return {
      collection: {
        ...collection,
        description: readString(data, "description"),
        seo_meta: normalizeCollectionSeo(data.seo_meta),
      },
      products,
      pagination: normalizeCollectionPagination(
        productsBlock?.pagination,
        page,
        products.length,
      ),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return "not_found";
    return null;
  }
}

function normalizeCollection(value: unknown): CollectionListItem | null {
  if (!isRecord(value)) return null;

  // Slug wajib karena itu satu-satunya jalan ke detail. Nama sengaja TIDAK
  // wajib: kartu punya placeholder yang sudah ada, sedangkan koleksi yang
  // dibuang karena namanya kosong akan hilang dari daftar tanpa jejak.
  const slug = readString(value, "slug");
  if (!slug) return null;

  const count = value.products_count;

  return {
    id: typeof value.id === "number" ? value.id : null,
    name: readString(value, "name") ?? "",
    slug,
    tagline: readString(value, "tagline"),
    badge_label: readString(value, "badge_label"),
    // Backend mengirim URL absolut, tapi path relatif tetap dirangkai di satu
    // pintu (`mediaUrl`) supaya aman kalau penyimpanan berpindah.
    banner_desktop: mediaUrl(readString(value, "banner_desktop")),
    banner_mobile: mediaUrl(readString(value, "banner_mobile")),
    is_featured: value.is_featured === true,
    products_count:
      typeof count === "number" && Number.isFinite(count) ? count : null,
    published_at: readString(value, "published_at"),
    ended_at: readString(value, "ended_at"),
  };
}

/** Baca `seo_meta` secara defensif; objek yang seluruhnya kosong jadi `null`. */
function normalizeCollectionSeo(value: unknown): CollectionSeoMeta | null {
  if (!isRecord(value)) return null;

  const meta_title = readString(value, "meta_title");
  const meta_description = readString(value, "meta_description");
  if (!meta_title && !meta_description) return null;

  return { meta_title, meta_description };
}

function normalizeCollectionPagination(
  value: unknown,
  page: number,
  loaded: number,
): CollectionPagination {
  if (!isRecord(value)) {
    // Detail tanpa blok paginasi: anggap satu halaman berisi semua yang dimuat.
    // Lebih jujur daripada mengarang `last_page: 0`.
    return {
      current_page: page,
      last_page: 1,
      per_page: COLLECTION_PER_PAGE,
      total: loaded,
      has_more: false,
    };
  }

  return {
    current_page: readNumber(value.current_page, page),
    last_page: readNumber(value.last_page, 1),
    per_page: readNumber(value.per_page, COLLECTION_PER_PAGE),
    total: readNumber(value.total, loaded),
    has_more: value.has_more === true,
  };
}

/* -------------------------------------------------------------------------- */
/* Keranjang                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `GET /cart`.
 *
 * Keranjang tamu disimpan per sesi di Redis (KONTRAK-API §2). Sesi itu
 * diidentifikasi oleh `guest_token`: dikirim lewat header `X-Guest-Token`
 * (prioritas tertinggi di `CartService::resolveGuestToken()`), dan token baru
 * yang dibuat backend disimpan kembali ke cookie storefront lewat
 * `persistGuestToken()`.
 */
export async function getCart(): Promise<Cart | null> {
  try {
    const payload = await apiRequest<unknown>("/cart", {
      forwardCookies: true,
      token: await getToken(),
      guestToken: await getGuestToken(),
    });
    const data = unwrap<Record<string, unknown>>(payload, "data");
    if (!data) return null;
    await persistGuestToken(readString(data, "guest_token"));
    return {
      items: Array.isArray(data.items)
        ? data.items.filter((item): item is Cart["items"][number] => isRecord(item))
        : [],
      summary: isRecord(data.summary)
        ? {
            item_count: readNumber(data.summary.item_count, 0),
            subtotal: readNumber(data.summary.subtotal, 0),
            subtotal_display:
              readString(data.summary, "subtotal_display") ?? "",
          }
        : { item_count: 0, subtotal: 0, subtotal_display: "" },
    };
  } catch {
    return null;
  }
}

const EMPTY_CART: Cart = {
  items: [],
  summary: { item_count: 0, subtotal: 0, subtotal_display: "" },
};

/**
 * Simpan `guest_token` dari body cart, lalu kembalikan cart-nya.
 *
 * Dipisah supaya keempat operasi cart menulis cookie dengan cara yang sama
 * persis — satu yang lupa menyimpan token akan membuat itemnya hilang di
 * request berikutnya.
 */
async function cartFromPayload(payload: unknown): Promise<Cart> {
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!data) return EMPTY_CART;
  await persistGuestToken(readString(data, "guest_token"));
  return data as unknown as Cart;
}

export async function addCartItem(
  skuId: number,
  quantity: number,
): Promise<Cart> {
  const payload = await apiRequest<unknown>("/cart/items", {
    method: "POST",
    body: { sku_id: skuId, quantity },
    forwardCookies: true,
    token: await getToken(),
    guestToken: await getGuestToken(),
  });
  return cartFromPayload(payload);
}

export async function updateCartItem(
  skuId: number,
  quantity: number,
): Promise<Cart> {
  const payload = await apiRequest<unknown>(`/cart/items/${skuId}`, {
    method: "PATCH",
    body: { quantity },
    forwardCookies: true,
    token: await getToken(),
    guestToken: await getGuestToken(),
  });
  return cartFromPayload(payload);
}

export async function removeCartItem(skuId: number): Promise<Cart> {
  const payload = await apiRequest<unknown>(`/cart/items/${skuId}`, {
    method: "DELETE",
    forwardCookies: true,
    token: await getToken(),
    guestToken: await getGuestToken(),
  });
  return cartFromPayload(payload);
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Batas hasil pencarian wilayah — SATU nilai tetap.
 *
 * `limit` ikut masuk kunci cache server (`ShippingRateService::searchDestinations`),
 * jadi mengganti-ganti limit berarti satu HIT kuota baru untuk kata kunci yang
 * sudah pernah dicari. Delapan baris cukup untuk dipilih tanpa memanjangkan form.
 */
const DESTINATION_SEARCH_LIMIT = 8;

/**
 * `GET /shipping/destinations?search=&limit=` — pencarian subdistrict RajaOngkir.
 *
 * MELEMPAR `ApiError` (beda dengan `getCategories` yang menelan kegagalan jadi
 * `null`): 429 dan status 0 harus sampai ke pemanggil supaya pembeli melihat
 * sebabnya, bukan daftar kosong yang menyamar sebagai "tidak ada hasil".
 */
export async function searchDestinations(
  query: string,
): Promise<ShippingDestination[]> {
  const payload = await apiRequest<unknown>("/shipping/destinations", {
    query: { search: query, limit: DESTINATION_SEARCH_LIMIT },
    token: await getToken(),
  });
  // Balasan `ShippingController::destinations`: `{ data: { destinations: [...] } }`.
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!Array.isArray(data?.destinations)) return [];

  return data.destinations
    .filter(isRecord)
    .map((row) => ({
      id: readNumber(row.id, 0),
      label: readString(row, "label") ?? "",
      province_name: readString(row, "province_name"),
      city_name: readString(row, "city_name"),
      district_name: readString(row, "district_name"),
      subdistrict_name: readString(row, "subdistrict_name"),
      zip_code: readString(row, "zip_code"),
    }))
    .filter((destination) => destination.id > 0);
}

export async function getShippingQuote(
  request: ShippingQuoteRequest,
): Promise<ShippingQuote> {
  const payload = await apiRequest<unknown>("/shipping/quote", {
    method: "POST",
    body: request,
    token: await getToken(),
  });
  const data = unwrap<Record<string, unknown>>(payload, "data");
  const services = Array.isArray(data?.services) ? data.services : [];
  return {
    services: services.filter((item): item is ShippingQuote["services"][number] =>
      isRecord(item) && typeof item.courier === "string",
    ),
  };
}

export async function createOrder(
  request: CheckoutRequest,
): Promise<CreatedOrder> {
  const payload = await apiRequest<unknown>("/checkout/orders", {
    method: "POST",
    body: request,
    token: await getToken(),
  });
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!data) {
    throw new ApiError("Server tidak mengembalikan data pesanan.", 502);
  }
  return data as unknown as CreatedOrder;
}

/* -------------------------------------------------------------------------- */
/* Voucher                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `GET /vouchers` — kode yang sedang berlaku, publik (tanpa token).
 *
 * Pola sama dengan `getCategories()`: satu pintu normalisasi, gagal → `null`.
 * Daftar yang gagal dimuat tidak boleh menghalangi checkout; input kode tetap
 * bisa dipakai manual.
 */
export async function getVoucherList(): Promise<Voucher[] | null> {
  try {
    const payload = await apiRequest<unknown>("/vouchers");
    const list = unwrap<unknown[]>(payload, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map(normalizeVoucher)
      .filter((item): item is Voucher => item !== null);
  } catch {
    return null;
  }
}

function normalizeVoucher(value: unknown): Voucher | null {
  if (!isRecord(value)) return null;
  const code = readString(value, "code");
  if (!code) return null;

  return {
    id: readNumber(value.id, 0),
    code,
    type: readString(value, "type"),
    value: readNumber(value.value, 0),
    formatted_value: readString(value, "formatted_value"),
    min_purchase: readNumber(value.min_purchase, 0),
    formatted_min_purchase: readString(value, "formatted_min_purchase"),
    start_date: readString(value, "start_date"),
    end_date: readString(value, "end_date"),
    description: readString(value, "description"),
  };
}

/**
 * `POST /vouchers/apply` — simulasi diskon, publik, throttle 10/menit.
 *
 * `items` HANYA `{ sku_id, quantity }`: subtotal dihitung server dari harga
 * live. Melempar `ApiError` supaya 422/429/0 dipetakan `toActionError` yang
 * sudah ada.
 */
export async function applyVoucher(
  code: string,
  items: Array<{ sku_id: number; quantity: number }>,
): Promise<VoucherApplyResult> {
  const payload = await apiRequest<unknown>("/vouchers/apply", {
    method: "POST",
    body: { code, items },
  });
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!data) {
    throw new ApiError("Server tidak mengembalikan hasil perhitungan voucher.", 502);
  }
  return {
    discount_amount: readNumber(data.discount_amount, 0),
    formatted_discount_amount: readString(data, "formatted_discount_amount"),
    formatted_subtotal: readString(data, "formatted_subtotal"),
    final_subtotal: readNumber(data.final_subtotal, 0),
    formatted_final_subtotal: readString(data, "formatted_final_subtotal"),
  };
}

/* -------------------------------------------------------------------------- */
/* Pesanan                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Hasil `lookupOrder`: `"not_found"` = backend menjawab 404 (pesanan tidak ada
 * atau bukan milik pengguna ini — `OrderController::show` memfilter `user_id`),
 * `"unauthorized"` = token di cookie sudah tidak berlaku (401), `null` = backend
 * mati atau gagal.
 *
 * Sentinels itu perlu, sama seperti `CollectionLookup`: 404 dan outage harus
 * dirender berbeda. "Pesanan tidak ditemukan" saat server mati membuat pembeli
 * mengira pesanannya hilang.
 */
export type OrderLookup = OrderDetail | "not_found" | "unauthorized" | null;

/** `GET /orders/{orderNumber}` — dibaca dari snapshot, bukan katalog live. */
export async function lookupOrder(
  orderNumber: string,
): Promise<OrderLookup> {
  try {
    const payload = await apiRequest<unknown>(
      `/orders/${encodeURIComponent(orderNumber)}`,
      { forwardCookies: true, token: await getToken() },
    );
    const data = unwrap<Record<string, unknown>>(payload, "data");
    if (!data) return null;
    return normalizeOrder(data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return "not_found";
      if (error.status === 401) return "unauthorized";
    }
    return null;
  }
}

/**
 * Versi tanpa pembedaan sebab gagal — dipakai `trackOrderAction` dan halaman
 * sukses checkout yang sudah punya pesannya sendiri.
 */
export async function getOrder(orderNumber: string): Promise<OrderDetail | null> {
  const result = await lookupOrder(orderNumber);
  return typeof result === "string" || result === null ? null : result;
}

export async function getOrderList(): Promise<OrderSummary[] | null> {
  try {
    const payload = await apiRequest<unknown>("/orders", {
      forwardCookies: true,
      token: await getToken(),
    });
    const list = unwrap<unknown[]>(payload, "data");
    if (!Array.isArray(list)) return null;
    return list
      .map((item) => (isRecord(item) ? normalizeOrderSummary(item) : null))
      .filter((item): item is OrderSummary => item !== null);
  } catch {
    return null;
  }
}

/**
 * Normalisasi order di satu pintu.
 *
 * `OrderResource` mengirim nama field yang berbeda dari `KONTRAK-API.md` §3:
 * `status_histories` berisi `from_status`/`to_status`/`actor_type`, tanggal
 * pesanan ada di `created_at`, dan label Bahasa Indonesia sudah disediakan
 * backend lewat `status_label`. Daripada cast buta — yang membuat komponen
 * gagal render saat `order.history` ternyata `undefined` — semua field
 * dinormalisasi di sini.
 */
function normalizeOrder(source: Record<string, unknown>): OrderDetail | null {
  const summary = normalizeOrderSummary(source);
  if (!summary) return null;

  const items = Array.isArray(source.items)
    ? source.items
        .map((item) => (isRecord(item) ? normalizeOrderItem(item) : null))
        .filter((item): item is OrderItemSnapshot => item !== null)
    : [];

  const rawHistory = Array.isArray(source.status_histories)
    ? source.status_histories
    : Array.isArray(source.history)
      ? source.history
      : [];

  const history: OrderStatusHistory[] = rawHistory
    .filter(isRecord)
    .map((entry) => ({
      from_status: readString(entry, "from_status"),
      // Fallback ke `status` supaya frontend tidak bergantung pada satu nama
      // field saja kalau backend berubah.
      to_status: readString(entry, "to_status") ?? readString(entry, "status"),
      actor_type: readString(entry, "actor_type") ?? readString(entry, "actor"),
      note: readString(entry, "note"),
      occurred_at: readString(entry, "occurred_at") ?? "",
    }))
    .filter((entry) => entry.occurred_at.length > 0)
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

  return {
    ...summary,
    items,
    history,
    shipping_address: isRecord(source.shipping_address)
      ? normalizeAddressSnapshot(source.shipping_address)
      : null,
    shipping_courier: readString(source, "shipping_courier"),
    shipping_service: readString(source, "shipping_service"),
    shipping_etd: readString(source, "shipping_etd"),
    tracking_number: readString(source, "tracking_number"),
    // `OrderDetailResource` mengirim `payment_method` dan objek `payment`
    // (metode, jumlah, status, plus instruksi gateway di `instructions`).
    payment_method: readString(source, "payment_method"),
    payment: normalizePayment(source.payment),
  };
}

/**
 * Objek `payment` dari `OrderDetailResource`.
 *
 * `instructions` = kolom `payments.raw_response`, dan berisi persis bentuk
 * `PaymentInstruction`: `qr_string`, `va_number`, `bank_name`,
 * `instructions_text`, `expires_at`. Semua boleh null — QRIS tidak punya nomor
 * VA, dan VA tidak punya string QR.
 */
function normalizePayment(value: unknown): PaymentInfo | null {
  if (!isRecord(value)) return null;
  const instructions = normalizePaymentInstruction(value.instructions);
  return {
    method: readString(value, "method"),
    amount: readNumber(value.amount, 0),
    status: readString(value, "status") ?? "",
    instructions,
    // `payment_url` dikirim di dua tempat (level `payment` dan di dalam
    // `instructions`, yang merupakan salinan `payments.raw_response`). Ambil
    // yang tersedia supaya tidak bergantung pada satu bentuk saja.
    payment_url:
      readString(value, "payment_url") ?? instructions?.payment_url ?? null,
  };
}

function normalizePaymentInstruction(value: unknown): PaymentInstruction | null {
  if (!isRecord(value)) return null;
  return {
    qr_string: readString(value, "qr_string"),
    va_number: readString(value, "va_number"),
    bank_name: readString(value, "bank_name"),
    instructions_text: readString(value, "instructions_text"),
    expires_at: readString(value, "expires_at"),
    method: readString(value, "method"),
    payment_url: readString(value, "payment_url"),
  };
}

function normalizeOrderSummary(
  source: Record<string, unknown>,
): OrderSummary | null {
  const orderNumber = readString(source, "order_number");
  if (!orderNumber) return null;

  return {
    order_number: orderNumber,
    status: (readString(source, "status") ??
      "needs_reconciliation") as OrderStatus,
    status_label: readString(source, "status_label"),
    first_item_name: readString(source, "first_item_name"),
    item_count: readNumber(source.item_count, 0),
    subtotal: readNumber(source.subtotal, 0),
    discount_total: readNumber(source.discount_total, 0),
    shipping_cost: readNumber(source.shipping_cost, 0),
    service_fee: readNumber(source.service_fee, 0),
    grand_total: readNumber(source.grand_total, 0),
    grand_total_display: readString(source, "grand_total_display"),
    voucher_code: readString(source, "voucher_code"),
    payment_expires_at: readString(source, "payment_expires_at"),
    needs_reconciliation: source.needs_reconciliation === true,
    placed_at:
      readString(source, "created_at") ?? readString(source, "placed_at") ?? "",
  };
}

function normalizeOrderItem(
  source: Record<string, unknown>,
): OrderItemSnapshot | null {
  const productName = readString(source, "product_name");
  if (!productName) return null;

  return {
    product_name: productName,
    product_slug: readString(source, "product_slug"),
    variant_name: readString(source, "variant_name"),
    sku_code: readString(source, "sku_code") ?? "",
    unit_price: readNumber(source.unit_price, 0),
    quantity: readNumber(source.quantity, 0),
    subtotal: readNumber(source.subtotal, 0),
    // Path relatif dari backend dirangkai lewat `mediaUrl()` (ARSITEKTUR §3).
    image: mediaUrl(readString(source, "image")),
  };
}

/** Mengikuti `CreateOrder::buildAddressSnapshot()`. */
function normalizeAddressSnapshot(
  source: Record<string, unknown>,
): ShippingAddressSnapshot {
  return {
    recipient_name: readString(source, "recipient_name") ?? "",
    phone: readString(source, "phone") ?? "",
    street: readString(source, "street") ?? "",
    district: readString(source, "district"),
    subdistrict: readString(source, "subdistrict"),
    city: readString(source, "city") ?? "",
    city_code: readString(source, "city_code"),
    province: readString(source, "province") ?? "",
    province_code: readString(source, "province_code"),
    postal_code: readString(source, "postal_code"),
    notes: readString(source, "notes"),
  };
}

/* -------------------------------------------------------------------------- */
/* Guest WhatsApp                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `POST /guest/whatsapp-checkout` — BUKAN order (KONTRAK-API §5). Yang terjadi
 * hanya pencatatan niat menghubungi CS di `guest_checkout_logs`, tanpa
 * reservasi stok dan tanpa payment gateway.
 */
export async function createGuestWhatsAppCheckout(
  request: GuestWhatsAppRequest,
): Promise<GuestWhatsAppResult> {
  const payload = await apiRequest<unknown>("/guest/whatsapp-checkout", {
    method: "POST",
    body: request,
    forwardCookies: true,
  });
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!data || typeof data.wa_url !== "string") {
    throw new ApiError("Server tidak mengembalikan tautan WhatsApp.", 502);
  }
  return data as unknown as GuestWhatsAppResult;
}

/** `POST /guest/custom-inquiry` — PRD §6A, tidak membuat cart maupun order. */
export async function createCustomInquiry(
  request: CustomInquiryRequest,
): Promise<GuestWhatsAppResult> {
  const payload = await apiRequest<unknown>("/guest/custom-inquiry", {
    method: "POST",
    body: request,
    forwardCookies: true,
  });
  const data = unwrap<Record<string, unknown>>(payload, "data");
  if (!data || typeof data.wa_url !== "string") {
    throw new ApiError("Server tidak mengembalikan tautan WhatsApp.", 502);
  }
  return data as unknown as GuestWhatsAppResult;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Login sekaligus menggabungkan keranjang tamu (PRD §3.4 / KONTRAK-API §9.5).
 *
 * `AuthController::login` membaca `guest_token` dari body ATAU header
 * `X-Guest-Token` ATAU cookie, lalu memanggil `mergeGuestCart()`. Body dipilih
 * supaya penggabungan tidak bergantung pada cookie lintas-domain.
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const data = await apiRequest<unknown>("/auth/login", {
    method: "POST",
    body: { ...payload, guest_token: await getGuestToken() },
  });
  return unwrap<AuthResponse>(data, "data") ?? { token: "", user: { id: 0, name: "", email: "" } };
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const data = await apiRequest<unknown>("/auth/register", {
    method: "POST",
    body: { ...payload, guest_token: await getGuestToken() },
  });
  return unwrap<AuthResponse>(data, "data") ?? { token: "", user: { id: 0, name: "", email: "" } };
}

export async function getToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(AUTH_TOKEN_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * `GET /auth/me` — profil singkat pemilik sesi saat ini.
 *
 * Dipakai halaman checkout untuk menampilkan siapa yang sedang memesan, dan
 * header untuk yells "Keluar". Tidak pernah melempar: kalau token sudah
 * kedaluwarsa, hasilnya `null` dan halaman bertindak seolah belum masuk.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const payload = await apiRequest<unknown>("/auth/me", { token });
    const data = unwrap<Record<string, unknown>>(payload, "data");
    if (!data) return null;
    const id = typeof data.id === "number" ? data.id : null;
    const name = readString(data, "name");
    const email = readString(data, "email");
    if (id === null || !name || !email) return null;
    return { id, name, email };
  } catch {
    return null;
  }
}
