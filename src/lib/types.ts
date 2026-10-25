/**
 * Bentuk data mengikuti `docs/KONTRAK-API.md` persis.
 *
 * Prinsip yang dipegang di file ini:
 * 1. Harga SELALU integer rupiah (KONTRAK-API "Mata uang"), TIDAK pernah
 *    string berkoma. Tampilan rupiah dibuat di `src/lib/format.ts`.
 * 2. `*_display` bisa berisi string placeholder `[Harga dari Admin]`, jadi
 *    tipenya `string`, bukan `number`.
 * 3. Semua field yang boleh `null` Definitely NULL, bukan `?`. KONTRAK-API
 *    mengirim `null` eksplisit, jadi tipe `?` akan membuka celah
 *    `undefined` yang tidak pernah terjadi.
 * 4. Tidak ada `any`. Bentuk yang belum pasti dari backend dikubectl lewat
 *    normalisasi di `api.ts`, bukan lewat `any`.
 */

/* -------------------------------------------------------------------------- */
/* C envelope bersama                                                         */
/* -------------------------------------------------------------------------- */

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DataEnvelope<T> {
  data: T;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

/* -------------------------------------------------------------------------- */
/* Katalog                                                                    */
/* -------------------------------------------------------------------------- */

export interface ProductImage {
  url: string | null;
  alt: string | null;
}

export interface CategoryRef {
  name: string;
  slug: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  is_placeholder: boolean;
  short_description: string | null;
  price_min: number;
  price_max: number;
  price_display: string;
  is_out_of_stock: boolean;

  /**
   * Label promosi di kartu produk, pilihan admin.
   *
   * Sengaja TIDAK dihitung dari `on_hand`: "Sisa Sedikit" adalah keputusan
   * promosi, dan kalau ikut berubah tiap kali stok naik-turun, labelnya
   * hilang sendiri padahal produknya tidak berubah. "Stok Habis" tetap
   * otomatis dari `is_out_of_stock` karena itu fakta.
   */
  badge: string | null;
  /** `warning` = badge mendesak; `neutral` = badge biasa. */
  badge_tone: "neutral" | "warning";

  /** Label ukuran yang tersedia, mis. `["S", "M", "L"]`. */
  sizes: string[];

  image: ProductImage | null;
  category: CategoryRef | null;
}

export interface ProductSku {
  id: number;
  code: string;
  price: number;
  price_display: string | null;
  stock: number | null;
  is_out_of_stock: boolean;
  attributes: Record<string, string> | null;
}

export interface ProductImageItem {
  url: string;
  alt: string | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  is_placeholder: boolean;
  short_description: string | null;
  description: string | null;
  /**
   * Backend mengirim `price_min`/`price_max` juga di endpoint detail, dan
   * `price_display` bisa `null` ketika admin belum mengisi harga. Karena itu
   * panel pembelian memakai `formatHarga(price_min, price_display)` — sama
   * seperti kartu katalog — supaya tidak pernah merender baris harga kosong.
   */
  price_min: number;
  price_max: number;
  price_display: string | null;
  is_out_of_stock: boolean;
  badge: string | null;
  images: ProductImageItem[];
  variants: ProductSku[];
  default_sku: ProductSku | null;
  category: CategoryRef | null;
}

/**
 * Meta katalog dari backend.
 *
 * CATATAN KONTRAK: `GET /products` di backend hanya mengirim `meta` paginasi
 * (`current_page`, `last_page`, `per_page`, `total`) — tidak ada
 * `available_filters` (kategori/atribut/rentang harga) seperti di dokumen.
 * Daftar kategori untuk pil filter diambil terpisah dari `GET /categories`.
 */
export type ProductListMeta = PaginationMeta;

export interface ProductListResult {
  products: ProductListItem[];
  meta: ProductListMeta;
}

export type SortKey = "latest" | "price_asc" | "price_desc";

export interface CatalogQuery {
  q: string | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
  inStock: boolean;
  page: number;
  perPage: number;
}

/* -------------------------------------------------------------------------- */
/* Brand, kategori, banner                                                    */
/* -------------------------------------------------------------------------- */

export interface BrandInfo {
  brand_name: string | null;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  /** Nomor CS dari `app_settings` — BUKAN hardcode (PRD §3.11). */
  whatsapp_cs: string | null;
  email: string | null;

  /* --- Kanal media sosial (dikelola di /admin/media-sosial) --- */
  /**
   * `null` berarti admin belum mengisi link, BUKAN "toko tidak punya akun".
   *
   * Footer memakai perbedaan ini untuk menyembunyikan ikon. Ikon yang
   * menuju ke tautan kosong membuat pengunjung mengira akunnya hilang.
   */
  instagram_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;

  store_name: string | null;
  store_address: string | null;
  store_maps_url: string | null;
  store_coordinates: string | null;
  /**
   * PENTING: `app_settings` boleh mengembalikan jam operasional, tapi
   * sistem_map §4.1.4 melarang mengaktifkannya sebelum kebijakan pemilik
   * dikonfirmasi (OD-05). Frontend hanya menampilkan bila backend mengirim
   * nilai non-null; kalau null, halaman menampilkan catatan "menunggu
   * konfirmasi" alih-alih mengarang jam buka.
   */
  store_opening_hours: string | null;
  site_url: string | null;
}

export interface CategoryItem {
  id: number | null;
  name: string;
  slug: string;
  products_count: number | null;
}

export interface BannerItem {
  id: number | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  image_alt: string | null;

  /**
   * Varian crop untuk desktop >= 1280px (2:1).
   *
   * Diisi kalau `scripts/prepare_banner_crops.py` sudah dijalankan untuk
   * banner ini. Kalau `null`, pemanggil WAJIB jatuh ke `image_url` —
   * `null` berarti "tidak ada", bukan "boleh disembunyikan".
   */
  image_landscape_url: string | null;

  /**
   * Varian crop untuk HP (4:5).
   *
   * Rasio kotak hero dikunci per kelompok perangkat di `.hero-frame`
   * (globals.css), dan crop dibuat pada rasio yang sama persis oleh
   * `scripts/prepare_banner_crops.py`. Hasilnya potong nol.
   */
  image_portrait_url: string | null;

  /**
   * Varian crop untuk tablet (6:5), lebar 768 - 1279px.
   *
   * Ada karena kotak tablet berada di tengah rentang: lebih lebar dari
   * crop HP tapi lebih sempit dari crop desktop. Tanpa varian sendiri,
   * tablet memotong sekitar 40% dari crop mana pun yang dipakai.
   */
  image_tablet_url: string | null;

  link_url: string | null;
  /** Label tombol CTA, mis. "Lihat Katalog". */
  link_label: string | null;

  /* --- Elemen editorial lookbook (gaya banner yang diminta) --- */

  /** Label mono di sudut kiri atas, mis. "FORM. 01 — RINJANI SERIES". */
  stamp_left: string | null;
  /** Label mono di sudut kanan atas, mis. "SENARU / 601 MDPL". */
  stamp_right: string | null;
  /** Pill kecil di atas judul. */
  eyebrow: string | null;
  /** Label tombol kedua — hero editorial selalu berpasangan. */
  cta2_label: string | null;
  /** Tujuan tombol kedua. */
  cta2_url: string | null;
  /**
   * `dark` = teks gelap di atas foto terang.
   * Default `light` karena aman untuk foto gelap, kondisi paling umum.
   */
  theme: "light" | "dark";
  /** Kekuatan lapisan gelap penutup, 0-100. */
  overlay_opacity: number;
}

/* -------------------------------------------------------------------------- */
/* Keranjang                                                                  */
/* -------------------------------------------------------------------------- */

export interface CartItem {
  sku_id: number;
  product_name: string;
  product_slug: string | null;
  variant_name: string | null;
  sku_code: string;
  unit_price: number;
  unit_price_display: string;
  quantity: number;
  subtotal: number;
  subtotal_display: string;
  available_stock: number;
  is_out_of_stock: boolean;
  image: string | null;
}

export interface CartSummary {
  item_count: number;
  subtotal: number;
  subtotal_display: string;
}

export interface Cart {
  items: CartItem[];
  summary: CartSummary;
}

/* -------------------------------------------------------------------------- */
/* Checkout, pengiriman, pembayaran                                          */
/* -------------------------------------------------------------------------- */

export interface ShippingService {
  courier: string;
  service: string;
  description: string;
  cost: number;
  /** Estimasi hari sampai, mis. "2-3" (string dari backend). */
  etd: string | null;
}

export interface ShippingQuote {
  services: ShippingService[];
}

export interface PaymentInstruction {
  /** QRIS/VA/e-wallet — isi bergantung metode (KONTRAK-API §3). */
  qr_string: string | null;
  va_number: string | null;
  bank_name: string | null;
  instructions_text: string | null;
  expires_at: string | null;
  /**
   * `qris` | `virtual_account` | metode lain. Backend menyertakannya di
   * `raw_response`; dipakai untuk memilih cara render (QR vs nomor VA).
   */
  method?: string | null;
}

/**
 * Detail pembayaran sebuah pesanan (`OrderDetailResource.payment`).
 *
 * `instructions` berasal langsung dari `payments.raw_response` dan TIDAK
 * pernah ditafsir ulang di frontend — nomor VA/QR hanya boleh ditampilkan apa
 * adanya dari server.
 */
export interface PaymentInfo {
  method: string | null;
  amount: number;
  status: string;
  instructions: PaymentInstruction | null;
}

export type OrderStatus =
  | "menunggu_pembayaran"
  | "dibayar"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "expired"
  | "dibatalkan"
  | "needs_reconciliation";

export interface CreatedOrder {
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  shipping_cost: number;
  grand_total: number;
  grand_total_display: string | null;
  payment_expires_at: string | null;
  payment: {
    method: string;
    instructions: PaymentInstruction | null;
  } | null;
}

/**
 * Alamat pengiriman.
 *
 * CATATAN KONTRAK: `docs/KONTRAK-API.md` §3 masih menyebut
 * `shipping_address_id`, padahal
 * `backend/app/Http/Requests/StoreOrderRequest.php` meminta objek
 * `shipping_address` yang terisi lengkap, dan `routes/api.php` tidak punya
 * endpoint CRUD alamat sama sekali. Yang dikirim frontend adalah bentuk yang
 * benar-benar diterima backend, supaya checkout tidak selalu ditolak 422.
 * `shipping_address_id` tetap ada di `CheckoutRequest` supaya tidak menyimpang
 * dari dokumen begitu endpoint alamat someday tersedia.
 */
export interface ShippingAddress {
  recipient_name: string;
  phone: string;
  street: string;
  /** Wajib: API kurir butuh kode kota, bukan teks bebas. */
  city_code: string;
  city: string;
  province: string;
  postal_code: string | null;
  district: string | null;
  subdistrict: string | null;
  notes: string | null;
}

export interface CheckoutLineItem {
  sku_id: number;
  quantity: number;
  /**
   * Harga satuan terakhir yang dilihat pembeli di keranjang.
   *
   * Backend membandingkannya dengan harga terbaru; bila berbeda, order ditolak
   * 409 `price_changed` (KONTRAK-API §3). Wajib diisi supaya deteksi itu AKTIF:
   * sebelum ini field-nya tidak pernah dikirim, sehingga perubahan harga tidak
   * pernah terdeteksi dan checkout memakai harga baru secara diam-diam.
   */
  price_seen?: number | null;
}

export interface CheckoutRequest {
  shipping_address: ShippingAddress;
  items: CheckoutLineItem[];
  shipping_courier: string;
  shipping_service: string;
  shipping_cost: number;
  shipping_etd: string | null;
  payment_method: string;
  voucher_code: string | null;
  /**
   * Kirim `true` hanya setelah pembeli melihat daftar perubahan harga dan
   * menyetujuinya. Backend menolak order dengan 409 `price_changed` selama
   * flag ini belum `true` (KONTRAK-API §3).
   */
  acknowledge_price_change?: boolean;
  /**
   * Tetap disimpan supaya tidak menyimpang dari `KONTRAK-API.md`. Backend
   * saat ini mengabaikan field yang tidak ada di `StoreOrderRequest::payload()`.
   */
  shipping_address_id?: number;
}

/** Metode pembayaran yang diterima `StoreOrderRequest::rules()`. */
export const PAYMENT_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "virtual_account", label: "Virtual Account Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "credit_card", label: "Kartu Kredit" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export interface ShippingQuoteRequest {
  destination_city: string;
  items: Array<{ sku_id: number; quantity: number }>;
}

/* -------------------------------------------------------------------------- */
/* Voucher                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Satu voucher dari `GET /vouchers`.
 *
 * Hanya voucher yang sedang berlaku yang dikirim backend (`available()`),
 * dan kontraknya **tidak** menyebut cakupan kategori/produk — jadi daftar ini
 * tidak boleh dipresentasikan sebagai "berlaku untuk pesanan ini".
 */
export interface Voucher {
  id: number;
  code: string;
  /** Enum backend. Tidak dipakai untuk menyusun kalimat apa pun. */
  type: string | null;
  value: number;
  formatted_value: string | null;
  /** `0` berarti tanpa minimal belanja. */
  min_purchase: number;
  formatted_min_purchase: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

/**
 * Hasil `POST /vouchers/apply`.
 *
 * `final_subtotal` adalah subtotal **produk** setelah diskon — TIDAK termasuk
 * ongkir (`VoucherService::performValidation`). Karena itu ongkir terpilih
 * masih boleh ditambahkan untuk "Total tagihan", dan label yang dipakai di UI
 * adalah "Subtotal setelah diskon", bukan "Total".
 */
export interface VoucherApplyResult {
  discount_amount: number;
  formatted_discount_amount: string | null;
  formatted_subtotal: string | null;
  final_subtotal: number;
  formatted_final_subtotal: string | null;
}

/** Voucher yang sedang dipakai di halaman checkout. */
export interface AppliedVoucher extends VoucherApplyResult {
  code: string;
}

/* -------------------------------------------------------------------------- */
/* Pesanan                                                                    */
/* -------------------------------------------------------------------------- */

export interface OrderItemSnapshot {
  product_name: string;
  product_slug: string | null;
  variant_name: string | null;
  sku_code: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image: string | null;
}

/**
 * Satu entri audit trail status pesanan.
 *
 * CATATAN KONTRAK: backend mengirim `from_status`, `to_status`, dan
 * `actor_type` (lihat `OrderResource`), bukan `status`/`actor`. Field di sini
 * mengikuti bentuk yang benar-benar dikirim, dan `api.ts` yang menormalisasi
 * supaya bentuk data dari backend tidak bocor mentah ke komponen.
 */
export interface OrderStatusHistory {
  from_status: string | null;
  to_status: string | null;
  /** `admin` | `customer` | `gateway` | `system` (ARSITEKTUR §6). */
  actor_type: string | null;
  note: string | null;
  occurred_at: string;
}

/**
 * Snapshot alamat pada saat order dibuat.
 *
 * Mengikuti `CreateOrder::buildAddressSnapshot()`. Tidak ada key `village` —
 * mockup lama memakai istilah itu, tapi backend tidak pernah menyimpannya, jadi
 * menampilkan kolom tersebut berarti mengarang data.
 */
export interface ShippingAddressSnapshot {
  recipient_name: string;
  phone: string;
  street: string;
  district: string | null;
  subdistrict: string | null;
  city: string;
  city_code: string | null;
  province: string;
  province_code: string | null;
  postal_code: string | null;
  notes: string | null;
}

/**
 * Ringkasan pesanan.
 *
 * `placed_at` berasal dari `created_at` di `OrderResource`.
 */
export interface OrderSummary {
  order_number: string;
  status: OrderStatus;
  status_label: string | null;
  first_item_name: string | null;
  item_count: number;
  subtotal: number;
  discount_total: number;
  shipping_cost: number;
  service_fee: number;
  grand_total: number;
  grand_total_display: string | null;
  voucher_code: string | null;
  payment_expires_at: string | null;
  needs_reconciliation: boolean;
  placed_at: string;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemSnapshot[];
  history: OrderStatusHistory[];
  shipping_address: ShippingAddressSnapshot | null;
  shipping_courier: string | null;
  shipping_service: string | null;
  shipping_etd: string | null;
  tracking_number: string | null;
  payment_method: string | null;
  /** Detail pembayaran dari `OrderDetailResource.payment`. */
  payment: PaymentInfo | null;
}

/* -------------------------------------------------------------------------- */
/* Guest WhatsApp                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Permintaan checkout guest via WhatsApp.
 *
 * CATATAN KONTRAK: `KONTRAK-API.md` §5 menulis `guest_name`/`guest_phone`
 * sebagai wajib dan tidak menyebut `items`, sedangkan
 * `backend/app/Http/Controllers/Api/GuestCheckoutController.php` justru
 * mewajibkan `items` (min 1) dan membuat nama/telepon opsional. Yang dikirim
 * adalah bentuk yang benar-benar diterima backend.
 */
export interface GuestWhatsAppRequest {
  items: CheckoutLineItem[];
  guest_name: string | null;
  guest_phone: string | null;
  note: string | null;
}

export interface GuestWhatsAppResult {
  reference_code: string;
  wa_url: string;
  message: string;
  estimated_total: number;
  /**
   * `null` ketika totalnya sudah angka nyata; string placeholder
   * `[Harga dari Admin]` ketika belum ada harga terverifikasi.
   */
  estimated_total_display: string | null;
  notice: string;
}

export interface CustomInquiryRequest {
  name: string;
  phone: string;
  quantity: number | null;
  note: string | null;
  items: CheckoutLineItem[] | null;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
