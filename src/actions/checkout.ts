"use server";

import { revalidatePath } from "next/cache";

import {
  addCartItem,
  applyVoucher,
  createOrder,
  getCart,
  getOrder,
  getShippingQuote,
  getToken,
  removeCartItem,
  searchDestinations,
} from "@/lib/api";
import { toActionError } from "@/lib/action-result";
import type { ActionError } from "@/lib/action-result";
import { isPaymentMethod, type AddressInput } from "@/lib/checkout-form";
import { paymentRedirectUrl } from "@/lib/url";
import type {
  AppliedVoucher,
  CheckoutLineItem,
  CreatedOrder,
  OrderDetail,
  ShippingDestination,
  ShippingQuote,
  ShippingService,
} from "@/lib/types";

/**
 * Server Actions untuk alur checkout pelanggan terdaftar (PRD §3.6 – §3.8).
 *
 * Prinsip yang dijaga di seluruh file ini:
 *
 * 1. **Cart adalah satu-satunya sumber item.** Client tidak boleh menentukan
 *    SKU mana yang dibeli. `quoteShipping` dan `placeOrder` membaca cart dari
 *    server, jadi tidak ada jalan untuk memesan sesuatu yang tidak ada di
 *    keranjang.
 * 2. **Ongkir yang dipakai adalah hasil quote server.** Angka ongkir hanya
 *    dikirim balik sebagai pencocokan; `CreateOrder` di backend memakai quote
 *    terverifikasi sendiri (lihat `OrderPricingService`).
 * 3. **503 = blokir.** PRD §3.8 AC: bila API kurir bermasalah, frontend WAJIB
 *    mencegah buyer lanjut ke pembayaran. Karena itu `quoteShipping` mengembalikan
 *    `kind: "courier"` yang tidak bisa diabaikan, bukan daftar layanan kosong
 *    dengan ongkir karangan.
 *
 * Catatan: module ini ber-direktif `"use server"`, jadi semua ekspor WAJIB
 * fungsi async. Helper sinkron seperti validasi alamat ada di
 * `src/lib/checkout-form.ts`.
 */

/* -------------------------------------------------------------------------- */
/* Keranjang dari halaman detail produk                                       */
/* -------------------------------------------------------------------------- */

export async function addSkuToCartAction(
  skuId: number,
  quantity: number,
): Promise<ActionError | null> {
  if (!Number.isFinite(skuId) || skuId <= 0) {
    return {
      ok: false,
      kind: "validation",
      message: "Varian produk belum dipilih.",
      fieldErrors: {},
    };
  }

  try {
    await addCartItem(skuId, Math.max(1, Math.floor(quantity)));
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/keranjang");
  revalidatePath("/");
  return null;
}

export async function removeSkuFromCartAction(
  skuId: number,
): Promise<ActionError | null> {
  try {
    await removeCartItem(skuId);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/keranjang");
  revalidatePath("/");
  return null;
}

/* -------------------------------------------------------------------------- */
/* Langkah 2 — ongkir (PRD §3.8)                                              */
/* -------------------------------------------------------------------------- */

/** Hasil quote ongkir, sudah dibentuk agar bisa langsung dirender. */
export interface ShippingQuoteResult {
  services: ShippingService[];
  destinationCity: string;
  /** `true` hanya bila ongkir terverifikasi dan boleh lanjut. */
  canProceed: boolean;
}

/** Hasil pencarian wilayah; `destinations` kosong = tidak ada yang cocok. */
export interface DestinationSearchResult {
  destinations: ShippingDestination[];
}

/**
 * Item checkout dari cart server.
 *
 * `sku_id` dan `quantity` SELALU dari cart server — client tidak boleh
 * menentukan apa yang dibeli.
 *
 * `price_seen` berbeda: backend tidak menyimpan harga di cart (hanya
 * `sku_id` + `quantity`; `CartService::formatCart()` menghitung
 * `unit_price` dari `$sku->effective_price` saat itu). Akibatnya mengirim
 * `item.unit_price` yang baru dibaca membuat `price_seen` selalu sama dengan
 * harga terkini, dan deteksi 409 `price_changed` tidak pernah menyala.
 *
 * Karena itu `priceSeen` diisi dari SNAPSHOT yang pembeli lihat di halaman
 * checkout (`CheckoutFlow` menerima `cart` hasil render server). `sku_id` yang
 * tidak ada di snapshot jatuh ke harga cart saat ini. Field ini murni peringatan
 * belaka — backend tetap memakai `effective_price` sebagai harga yang ditagih —
 * jadi mengirim nilai dari client tidak membuka celah harga.
 */
async function cartLineItems(
  priceSeen: Record<number, number> = {},
): Promise<CheckoutLineItem[]> {
  const cart = await getCart();
  return (cart?.items ?? []).map((item) => ({
    sku_id: item.sku_id,
    quantity: item.quantity,
    price_seen: priceSeen[item.sku_id] ?? item.unit_price,
  }));
}

/**
 * Cari wilayah tujuan (`GET /shipping/destinations`).
 *
 * Penjaga terakhir kuota: backend menolak `search` < 3 karakter, dan klien
 * sudah membatasi di komponen. Guard di sini memastikan tidak ada satu pun
 * request jaringan yang lolos karena bug UI.
 */
export async function searchDestinationsAction(
  query: string,
): Promise<DestinationSearchResult | ActionError> {
  const keyword = query.trim();
  if (keyword.length < 3) return { destinations: [] };

  if (!(await getToken())) {
    return {
      ok: false,
      kind: "auth",
      message: "Sesi masukmu berakhir. Yuk, masuk kembali untuk mencari wilayah pengiriman.",
      fieldErrors: {},
    };
  }

  try {
    return { destinations: await searchDestinations(keyword) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function quoteShippingAction(
  address: AddressInput,
): Promise<ShippingQuoteResult | ActionError> {
  // Endpoint ini dilindungi `auth:sanctum`. Tanpa token, QuoteController
  // membalas 401 — dan kita menampilkan "belum masuk", bukan ongkir fiktif.
  if (!(await getToken())) {
    return {
      ok: false,
      kind: "auth",
      message: "Sesi masukmu berakhir. Yuk, masuk kembali untuk menghitung ongkos kirim.",
      fieldErrors: {},
    };
  }

  // Item diambil dari cart server, bukan dari form. Inilah yang membuat quote
  // tidak bisa dimanipulasi dari client.
  const items = await cartLineItems();
  if (items.length === 0) {
    return {
      ok: false,
      kind: "validation",
      message: "Keranjang kosong. Tambahkan produk sebelum menghitung ongkir.",
      fieldErrors: {},
    };
  }

  try {
    const quote: ShippingQuote = await getShippingQuote({
      // Subdistrict RajaOngkir hasil pemilih wilayah. Jalur `destination_city`
      // (nama teks) di server me-resolve ke `rows[0]` pencarian — sumber ongkir
      // yang salah tanpa galat, jadi tidak dipakai lagi.
      destination_id: address.destination_id,
      items,
    });

    if (quote.services.length === 0) {
      // Tidak ada layanan berarti tidak ada ongkir terverifikasi. PRD §3.8
      // melarang menampilkan biaya default, jadi ini harus memblokir.
      return {
        ok: false,
        kind: "courier",
        message:
          "Belum ada layanan pengiriman yang bisa dihitung untuk kota ini. Pilih kota lain atau hubungi Customer Service.",
        fieldErrors: {},
      };
    }

    return {
      services: quote.services,
      destinationCity: address.city,
      canProceed: true,
    };
  } catch (error) {
    // `getShippingQuote` melempar `ApiError` 503 saat kurir down;
    // `toActionError` memetakannya ke `kind: "courier"` sehingga UI memblokir
    // langkah berikutnya alih-alih menampilkan ongkir default.
    return toActionError(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Langkah 3 — periksa kode voucher (baris 14–15 audit)                       */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MESSAGE =
  "Terlalu banyak percobaan. Tunggu sekitar satu menit, lalu coba lagi.";

/**
 * `POST /vouchers/apply` untuk langkah pembayaran.
 *
 * Item diambil dari cart server dengan bentuk `{ sku_id, quantity }` saja —
 * tanpa `price_seen` dan tanpa `subtotal` (harga dihitung server). Endpoint ini
 * publik, jadi tidak ada pemeriksaan token; halaman checkout sendiri sudah
 * bergerbang token.
 *
 * Voucher opsional: kegagalan di sini tidak boleh memblokir "Buat Pesanan".
 * `voucher_code` tetap dikirim ulang ke `POST /checkout/orders` sebagai
 * revalidasi terakhir.
 */
export async function applyVoucherAction(
  code: string,
): Promise<AppliedVoucher | ActionError> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return {
      ok: false,
      kind: "validation",
      message: "Masukkan kode voucher terlebih dahulu.",
      fieldErrors: {},
    };
  }

  const cart = await getCart();
  const items = (cart?.items ?? []).map((item) => ({
    sku_id: item.sku_id,
    quantity: item.quantity,
  }));

  if (items.length === 0) {
    return {
      ok: false,
      kind: "validation",
      message: "Keranjang kosong. Kode voucher tidak dapat diperiksa.",
      fieldErrors: {},
    };
  }

  try {
    const result = await applyVoucher(normalized, items);
    return { ...result, code: normalized };
  } catch (error) {
    const mapped = toActionError(error);

    // 422 membawa pesan spesifik per field (`errors.code`), dan itu yang paling
    // berguna bagi pembeli — pesan umum backend hanya mengulang hal yang sama.
    const codeMessage =
      mapped.kind === "voucher" ? mapped.fieldErrors.code?.[0] : undefined;
    if (codeMessage) return { ...mapped, message: codeMessage };

    // Jendela throttle bergeser, jadi hitungan mundur di klien akan berbohong.
    if (mapped.kind === "rate-limit") {
      return { ...mapped, message: RATE_LIMIT_MESSAGE };
    }

    return mapped;
  }
}

/* -------------------------------------------------------------------------- */
/* Langkah 3 — buat pesanan (PRD §3.6)                                         */
/* -------------------------------------------------------------------------- */

export interface PlaceOrderResult {
  order: CreatedOrder;
  /**
   * Halaman pembayaran gateway (DOKU Checkout) untuk pesanan yang baru dibuat.
   *
   * `null` bila gateway tidak mengirimnya — COD/WhatsApp tamu tidak memakai
   * gateway, dan gateway yang sedang bermasalah juga bisa tidak mengirim apa
   * pun. Pemanggil WAJIB punya jalur cadangan, bukan menganggap selalu ada.
   */
  paymentUrl: string | null;
}

export async function placeOrderAction(input: {
  address: AddressInput;
  service: ShippingService;
  paymentMethod: string;
  voucherCode: string | null;
  /**
   * Kirim `true` HANYA setelah pembeli melihat daftar perubahan harga hasil
   * 409 `price_changed` dan menyetujuinya. Backend menolak order selama flag
   * ini belum `true` (PRD §3.6 / KONTRAK-API §3).
   */
  acknowledgePriceChange?: boolean;
  /**
   * Harga yang dilihat pembeli di halaman checkout, dipetakan dari `sku_id`.
   * Dipakai sebagai `price_seen` supaya backend bisa mendeteksi perubahan
   * harga sejak halaman dibuka. Lihat catatan `cartLineItems()`.
   */
  priceSeen?: Record<number, number>;
}): Promise<PlaceOrderResult | ActionError> {
  if (!isPaymentMethod(input.paymentMethod)) {
    return {
      ok: false,
      kind: "validation",
      message: "Metode pembayaran belum dipilih.",
      fieldErrors: {},
    };
  }

  if (!(await getToken())) {
    return {
      ok: false,
      kind: "auth",
      message: "Sesi masukmu berakhir. Yuk, masuk kembali untuk menyelesaikan pesanan.",
      fieldErrors: {},
    };
  }

  const items = await cartLineItems(input.priceSeen);
  if (items.length === 0) {
    return {
      ok: false,
      kind: "stock",
      message: "Keranjang kosong. Pesanan tidak dapat dibuat.",
      fieldErrors: {},
    };
  }

  try {
    const order = await createOrder({
      shipping_address: input.address,
      items,
      shipping_courier: input.service.courier,
      shipping_service: input.service.service,
      shipping_cost: input.service.cost,
      shipping_etd: input.service.etd,
      payment_method: input.paymentMethod,
      voucher_code: input.voucherCode,
      acknowledge_price_change: input.acknowledgePriceChange === true,
    });

    // Cart dikosongkan di backend oleh `CreateOrder`. Yang perlu kita lakukan
    // hanya memaksa render ulang supaya badge keranjang di header ikut berubah.
    revalidatePath("/keranjang");
    revalidatePath("/");
    revalidatePath("/lacak");

    // `payment_url` ada di dua tempat pada respons backend; `paymentRedirectUrl`
    // memilih yang pertama tersedia dan menolak skema selain http(s).
    return { order, paymentUrl: paymentRedirectUrl(order) };
  } catch (error) {
    // 409 (stok habis), 422 (voucher), 503 (kurir), dan 429 (rate limit)
    // sampai ke sini apa adanya sebagai `ActionError` dengan `kind` yang
    // sesuai, sehingga UI bisa menampilkan perbandingan yang tepat.
    return toActionError(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Lacak pesanan                                                               */
/* -------------------------------------------------------------------------- */

export interface TrackOrderResult {
  orderNumber: string;
  /** `false` berarti 404, sesi habis, atau pesanan milik orang lain. */
  found: boolean;
  detail: OrderDetail | null;
  requiresLogin: boolean;
}

/**
 * Ambil detail pesanan untuk halaman lacak.
 *
 * PENTING: `GET /orders/{orderNumber}` hanya mengembalikan pesanan milik
 * pengguna yang sedang login — `OrderController::show` memfilter `user_id` di
 * dalam query. Artinya TIDAK ada lookup pesanan anonim yang aman, jadi
 * "lacak tanpa login" di PRD §3.11 tidak dapat dipenuhi lewat API ini. Agar
 * tidak membuka kebocoran data, halaman lacak untuk tamu hanya mengarahkan ke
 * login, dan nomor pesanan tetap tidak pernah terkonfirmasi ada atau tidak.
 */
export async function trackOrderAction(
  orderNumber: string,
): Promise<TrackOrderResult> {
  const normalized = orderNumber.trim().toUpperCase();

  if (!normalized) {
    return {
      orderNumber: normalized,
      found: false,
      detail: null,
      requiresLogin: false,
    };
  }

  if (!(await getToken())) {
    return {
      orderNumber: normalized,
      found: false,
      detail: null,
      requiresLogin: true,
    };
  }

  const detail = await getOrder(normalized);
  return {
    orderNumber: normalized,
    found: detail !== null,
    detail,
    requiresLogin: false,
  };
}
