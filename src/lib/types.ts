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
  /** `null` = server tidak mengirim angka stok (S7), bukan "stok 0". */
  stock: number | null;
  is_out_of_stock: boolean;
  is_active: boolean;
}

/**
 * Varian: kelompok SKU dengan atribut yang sama (`{ size: "M", color: "Black" }`).
 *
 * SKU **tidak** punya atribut sendiri. Meratakan varian menjadi daftar SKU
 * (bentuk lama) membuat "varian" dan "SKU" tidak bisa dibedakan saat satu
 * varian berisi lebih dari satu SKU, dan sintesis `default_sku` dari
 * `variants[0]` membuat pemilih varian tidak pernah muncul.
 */
export interface ProductVariant {
  id: number;
  /** Label cadangan dari server, mis. `"Black / Size M"`. */
  name: string;
  attributes: Record<string, string> | null;
  skus: ProductSku[];
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
  /** Varian bersarang: atribut menempel di varian, SKU di dalamnya. */
  variants: ProductVariant[];
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

/** Satu tombol aksi hero slider. `label` NOT NULL di DB, `url` boleh kosong. */
export interface HeroSliderAction {
  label: string | null;
  url: string | null;
}

/**
 * Satu slide hero dari `GET /hero-sliders`.
 *
 * Bentuk ini SAMA PERSIS dengan `HeroSliderResource` backend (termasuk objek
 * `images` / `actions` bersarang), bukan bentuk tampilan. Pemetaan ke
 * `HeroSlide` terjadi di `app/page.tsx`.
 *
 * CATATAN KONTRAK:
 * - `order` = kolom `sort_order`. Server sudah mengurutkan (`sort_order asc,
 *   id asc`) dan membatasi 100 baris, jadi frontend TIDAK mengurutkan ulang.
 * - `images.desktop_url` wajib, `images.mobile_url` opsional. Tidak ada
 *   `image_tablet`: aset hero adalah unggahan admin apa adanya.
 * - `secondary.url` biasanya `null` (label ber-default, URL nullable). Tombol
 *   tanpa URL tidak boleh dirender.
 */
export interface HeroSliderItem {
  id: number | null;
  /** Stempel kiri-atas. */
  series_tag: string | null;
  /** Stempel kanan-atas. */
  location_tag: string | null;
  /** Pill eyebrow di atas judul. */
  badge: string | null;
  title: string | null;
  description: string | null;
  images: {
    /** 16:9, wajib. URL absolut dari `Storage::disk('public')->url()`. */
    desktop_url: string | null;
    /** 4:5, opsional. `null` = pakai `desktop_url` (crop tengah). */
    mobile_url: string | null;
    /** `null` = gambar dekoratif (`alt=""`), bukan diisi judul. */
    alt_text: string | null;
  };
  actions: {
    primary: HeroSliderAction;
    secondary: HeroSliderAction;
  };
  order: number;
}

/* -------------------------------------------------------------------------- */
/* Koleksi                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Satu koleksi kurasi dari `GET /collections`.
 *
 * CATATAN KONTRAK: `CollectionListResource` mengirim `banner_desktop` /
 * `banner_mobile` sebagai string URL (bukan objek media), dan `products_count`
 * HANYA ada di endpoint daftar. Detail memakai `whenLoaded('products')`, jadi
 * jumlah produk di sana dibaca dari `products.pagination.total` — bukan dari
 * field ini.
 */
export interface CollectionListItem {
  id: number | null;
  name: string;
  slug: string;
  /** Kalimat kurasi dari admin. `null` = tidak dirender sama sekali. */
  tagline: string | null;
  badge_label: string | null;
  /** Banner 16:9 / 21:9. `null` = admin belum mengunggah. */
  banner_desktop: string | null;
  /** Banner vertikal untuk <768px. `null` = pakai banner desktop. */
  banner_mobile: string | null;
  is_featured: boolean;
  /** `null` = tidak dihitung backend (detail); `0` = memang belum berisi. */
  products_count: number | null;
  published_at: string | null;
  ended_at: string | null;
}

/**
 * `seo_meta` koleksi.
 *
 * Textarea Filament boleh tersimpan sebagai string kosong, jadi kedua field
 * bisa `null` maupun kosong — `api.ts` memperlakukan keduanya sama.
 */
export interface CollectionSeoMeta {
  meta_title: string | null;
  meta_description: string | null;
}

export interface CollectionDetail extends CollectionListItem {
  description: string | null;
  seo_meta: CollectionSeoMeta | null;
}

/**
 * Paginasi detail koleksi.
 *
 * Bentuknya BERBEDA dari `/products`: berada di `products.pagination`
 * (bukan `meta`) dan membawa `has_more`, bukan hanya `last_page`.
 */
export type CollectionPagination = PaginationMeta & { has_more: boolean };

export interface CollectionDetailResult {
  collection: CollectionDetail;
  products: ProductListItem[];
  pagination: CollectionPagination;
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
  /**
   * Halaman pembayaran host-to-host (DOKU Checkout). Inilah tujuan yang harus
   * dibuka pembeli setelah pesanan dibuat — tanpa ini, pembeli berhenti di
   * halaman instruksi yang tidak punya nomor VA/QR apa pun.
   */
  payment_url?: string | null;
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
  /** Salinan `payment_url` di level `payment`, selain di `instructions`. */
  payment_url?: string | null;
}

export type OrderStatus =
  | "menunggu_pembayaran"
  /** Pool WhatsApp tamu: pesanan ada, pembayaran menunggu verifikasi CS. */
  | "menunggu_konfirmasi_cs"
  | "dibayar"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "expired"
  | "dibatalkan"
  | "needs_reconciliation";

export interface CreatedOrder {
  order_number: string;
  /**
   * URL halaman pembayaran gateway (DOKU Checkout), `null` untuk metode yang
   * tidak memakai gateway (COD/WhatsApp tamu).
   */
  payment_url?: string | null;
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
  /**
   * Subdistrict RajaOngkir dari pemilih wilayah (`GET /shipping/destinations`).
   * Satu-satunya nilai yang dipakai kurir untuk menghitung ongkir;
   * `city_code` (teks bebas) tidak lagi dikirim.
   */
  destination_id: number;
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

/**
 * Metode pembayaran yang diterima `StoreOrderRequest::rules()`.
 *
 * Sejak 25-10-2026 checkout TIDAK lagi menanyakan kanal pembayaran: semua
 * pembayaran online lewat DOKU Checkout (host-to-host), dan pembeli memilih
 * QRIS / Virtual Account / E-Wallet / Kartu Kredit DI HALAMAN DOKU, bukan di
 * sini. `PaymentMethod` tetap berisi seluruh nilai yang sah karena itu bentuk
 * kontrak backend (`payment_method` juga dibaca di riwayat & detail pesanan).
 *
 * `DEFAULT_PAYMENT_METHOD` adalah nilai yang dikirim form checkout: satu
 * metode per transaksi, sisanya ditentukan kanal di sisi DOKU.
 */
export const PAYMENT_METHODS = [
  { value: "online", label: "Online (kanal dipilih di DOKU)" },
  { value: "qris", label: "QRIS" },
  { value: "virtual_account", label: "Virtual Account Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "credit_card", label: "Kartu Kredit" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/**
 * Metode yang dikirim `placeOrderAction`.
 *
 * HARUS `online`, bukan salah satu kanal (`qris`/`virtual_account`/…).
 * Backend memetakan metode ke `payment.payment_method_types` milik DOKU, dan
 * nilai kanal MENGUNCI halaman pembayaran ke kanal itu — `qris` menghasilkan
 * `/payment/page/qris?status=single-payment`, sehingga pembeli tidak pernah
 * ditawari VA, e-wallet, atau kartu. `online` tidak punya pemetaan, jadi DOKU
 * menampilkan seluruh kanal yang aktif di akun merchant.
 */
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "online";

/**
 * Satu baris `GET /shipping/destinations` — satu subdistrict RajaOngkir.
 *
 * `label` milik RajaOngkir (huruf kapital penuh, format bisa berubah), jadi
 * untuk tampilan susun sendiri dari field di bawah — lihat `titleCase`.
 */
export interface ShippingDestination {
  id: number;
  label: string;
  province_name: string | null;
  city_name: string | null;
  district_name: string | null;
  subdistrict_name: string | null;
  zip_code: string | null;
}

export interface ShippingQuoteRequest {
  /** Subdistrict RajaOngkir; jalur yang benar untuk `POST /shipping/quote`. */
  destination_id: number;
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
  /**
   * Nomor pesanan `PLR-...` untuk alur WhatsApp tamu.
   *
   * `null` pada `POST /guest/custom-inquiry`, karena inquiry partai memang
   * BUKAN pesanan (tidak membuat order).
   */
  order_number?: string | null;
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

export interface CancelGuestOrderRequest {
  order_number?: string | null;
  reference_code: string;
  reason?: string | null;
}

export interface CancelGuestOrderResult {
  success: boolean;
  message: string;
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
