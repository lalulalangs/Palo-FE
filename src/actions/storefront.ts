"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_TOKEN_COOKIE,
  addCartItem,
  apiRequest,
  clearGuestToken,
  createCustomInquiry,
  createGuestWhatsAppCheckout,
  getToken,
  login,
  register,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";
import { toActionError } from "@/lib/action-result";
import type {
  GuestCheckoutActionState,
  GuestResultHandoff,
} from "@/lib/guest-handoff";
import type { ActionError, ActionResult } from "@/lib/action-result";
import type { GuestWhatsAppResult } from "@/lib/types";

/**
 * Server Actions untuk seluruh mutasi storefront.
 *
 * Kenapa Server Actions, bukan `fetch` dari komponen client:
 * 1. Token Sanctum disimpan di cookie httpOnly. Kalau `POST /auth/login`
 *    dipanggil dari browser, tokennya pernah masuk ke JavaScript yang bisa
 *    dibaca skrip pihak ketiga.
 * 2. Cookie sesi guest (penyimpanan cart Redis) juga httpOnly, jadi `GET
 *    /cart` tidak bisa dilakukan dari client tanpa meneruskan cookie.
 * 3. `api.ts` memakai `cookies()` dari `next/headers`, yang hanya boleh
 *    dipanggil di server.
 *
 * Catatan keamanan (ARSITEKTUR §7): Server Action dapat dipanggil lewat POST
 * langsung, bukan hanya dari UI. Karena itu tidak ada keputusan bisnis yang
 * diambil di sini — harga, stok, ongkir, dan voucher tetap divalidasi penuh
 * oleh backend (PRD §3.6). File ini hanya meneruskan, lalu menerjemahkan
 * `ApiError` menjadi bentuk yang bisa ditampilkan.
 */

/* -------------------------------------------------------------------------- */
/* Utilitas input                                                             */
/* -------------------------------------------------------------------------- */

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

/**
 * Cegah open redirect.
 *
 * `redirect_to` berasal dari form, jadi bisa diisi siapa saja. Hanya path
 * internal yang diterima; `//evil.com` dan `https://evil.com` ditolak karena
 * keduanya bisa dipakai mengarahkan pengguna ke situs palsu tepat setelah
 * login berhasil.
 */
function safeRedirect(target: string | null, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//")) return fallback;
  return target;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

async function persistToken(token: string): Promise<void> {
  if (!token) return;
  const store = await cookies();
  store.set(AUTH_TOKEN_COOKIE, token, {
    // 30 hari: cukup untuk belanja berulang tanpa sering login, dan cukup
    // pendek supaya sesi lama tidak menggantung selamanya.
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function loginAction(
  _prev: ActionError | null,
  formData: FormData,
): Promise<ActionError | null> {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const remember = formData.get("remember") === "on";

  try {
    const response = await login({ email, password, remember });
    await persistToken(response.token);
    // Backend sudah menggabungkan keranjang tamu ke keranjang akun saat login
    // (PRD §3.4). Token tamu tidak boleh dipakai lagi setelah ini.
    await clearGuestToken();
  } catch (error) {
    return toActionError(error);
  }

  // Login juga merge cart guest ke cart akun (PRD §3.4). `revalidatePath`
  // untuk `/` diperlukan karena badge keranjang di-render di root layout.
  revalidatePath("/keranjang");
  revalidatePath("/checkout");
  revalidatePath("/");

  // `redirect()` melempar exception, jadi HARUS di luar blok `try` — kalau
  // tidak, exception-nya tertangkap `catch` dan dibaca sebagai login gagal.
  redirect(safeRedirect(readOptionalText(formData, "redirect_to"), "/keranjang"));
}

export async function registerAction(
  _prev: ActionError | null,
  formData: FormData,
): Promise<ActionError | null> {
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const passwordConfirmation = readText(formData, "password_confirmation");

  // Konfirmasi password dicek di server juga, bukan hanya di client: validasi
  // client bisa dilewati, dan pesan "konfirmasi tidak cocok" jauh lebih
  // berguna daripada 422 generik dari backend.
  if (password !== passwordConfirmation) {
    return {
      ok: false,
      kind: "validation",
      message: "Periksa kembali isian form.",
      fieldErrors: {
        password_confirmation: ["Konfirmasi password tidak cocok."],
      },
    };
  }

  try {
    const response = await register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    await persistToken(response.token);
    await clearGuestToken();
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/keranjang");
  revalidatePath("/checkout");
  revalidatePath("/");

  redirect(safeRedirect(readOptionalText(formData, "redirect_to"), "/keranjang"));
}

export async function logoutAction(): Promise<void> {
  const token = await getToken();
  if (token) {
    // Cabut token di server bila memungkinkan. Kegagalan tidak boleh
    // menahan pengguna: cookie lokal tetap dihapus supaya sesi di browser
    // benar-benar berakhir di sisi klien.
    try {
      await apiRequest<unknown>("/auth/logout", { method: "POST", token });
    } catch {
      // Sengaja diabaikan, lihat catatan di atas.
    }
  }
  const store = await cookies();
  store.delete(AUTH_TOKEN_COOKIE);

  revalidatePath("/", "layout");
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* Keranjang (PRD §3.4)                                                       */
/* -------------------------------------------------------------------------- */

export async function addToCartAction(
  skuId: number,
  quantity: number,
): Promise<ActionResult<null>> {
  try {
    await addCartItem(skuId, quantity);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/keranjang");
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function updateCartItemAction(
  skuId: number,
  quantity: number,
): Promise<ActionResult<null>> {
  try {
    await updateCartItem(skuId, quantity);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/keranjang");
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function removeCartItemAction(
  skuId: number,
): Promise<ActionResult<null>> {
  try {
    await removeCartItem(skuId);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/keranjang");
  revalidatePath("/");
  return { ok: true, data: null };
}

/* -------------------------------------------------------------------------- */
/* Guest WhatsApp (PRD §3.11)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Baca item keranjang dari satu field form `sku_id:quantity` yang dipisah koma.
 *
 * Bentuk ini dipilih supaya client tidak perlu mengirim array yang bisa
 * dirusak. Perlu ditegaskan: ini BUKAN jaminan keamanan — backend tetap
 * re-validasi SKU, harga, dan stok dari database (PRD §3.6).
 */
function readCartItems(
  formData: FormData,
): Array<{ sku_id: number; quantity: number }> {
  const raw = readText(formData, "items");
  if (!raw) return [];

  const items: Array<{ sku_id: number; quantity: number }> = [];
  for (const chunk of raw.split(",")) {
    const [skuRaw, quantityRaw] = chunk.split(":");
    const skuId = Number.parseInt(skuRaw ?? "", 10);
    const quantity = Number.parseInt(quantityRaw ?? "", 10);
    if (!Number.isFinite(skuId) || !Number.isFinite(quantity)) continue;
    if (skuId <= 0 || quantity <= 0) continue;
    items.push({ sku_id: skuId, quantity });
  }
  return items;
}

/**
 * Kirim keranjang tamu ke Customer Service via WhatsApp.
 *
 * Hasil DIKEMBALIKAN ke form, bukan dioper lewat cookie + redirect. Riwayat
 * lengkapnya ada di `src/lib/guest-handoff.ts`: cookie serah-terima membuat
 * halaman hasil 500 (mutasi cookie saat render), lalu setelah itu diperbaiki
 * cookienya tetap tidak sampai ke browser sehingga pembeli selalu melihat
 * "belum ada pesan" padahal endpoint sukses.
 */
export async function createGuestCheckoutAction(
  _prev: GuestCheckoutActionState | null,
  formData: FormData,
): Promise<GuestCheckoutActionState> {
  const items = readCartItems(formData);
  if (items.length === 0) {
    return {
      ok: false,
      kind: "validation",
      message: "Keranjang kosong. Tambahkan produk sebelum melanjutkan.",
      fieldErrors: {},
    };
  }

  let result: GuestWhatsAppResult;
  try {
    result = await createGuestWhatsAppCheckout({
      items,
      guest_name: readOptionalText(formData, "guest_name"),
      guest_phone: readOptionalText(formData, "guest_phone"),
      note: readOptionalText(formData, "note"),
    });
  } catch (error) {
    return toActionError(error);
  }

  const handoff: GuestResultHandoff = {
    reference_code: result.reference_code,
    order_number: result.order_number ?? null,
    wa_url: result.wa_url,
    notice: result.notice,
    estimated_total: result.estimated_total,
    estimated_total_display: result.estimated_total_display,
  };

  revalidatePath("/keranjang");

  return { ok: true, handoff };
}

/* -------------------------------------------------------------------------- */
/* Inquiry grosir / B2B (PRD §6A)                                             */
/* -------------------------------------------------------------------------- */

/**
 * `POST /guest/custom-inquiry` — pertanyaan grosir/ekspedisi yang berakhir di
 * WhatsApp CS. Bukan pesanan, bukan reservasi stok.
 *
 * Dua hal yang disengaja:
 * 1. **`items: null`.** Keranjang tidak dilampirkan — `items` tidak pernah
 *    masuk pesan WhatsApp (`GuestCheckoutService::customInquiry()`) dan hanya
 *    tersimpan di `cart_snapshot` tanpa UI admin. Mengirimnya berarti menyimpan
 *    daftar SKU tanpa manfaat.
 * 2. **Tanpa `cookies()`, `redirect()`, `revalidatePath()`.** Tidak ada yang
 *    di-cache yang berubah; hasilnya ditampilkan di komponen, bukan di halaman
 *    hasil terpisah.
 */
export async function createCustomInquiryAction(
  _prev: ActionResult<GuestWhatsAppResult> | null,
  formData: FormData,
): Promise<ActionResult<GuestWhatsAppResult>> {
  const quantityRaw = readText(formData, "quantity");
  let quantity: number | null = null;

  if (quantityRaw.length > 0) {
    const parsed = Number.parseInt(quantityRaw, 10);
    // `quantity.integer` dan `quantity.max` belum punya pesan Indonesia di
    // `CustomInquiryRequest::messages()`, jadi nilai di luar kontrak ditolak di
    // sini supaya pembeli tidak menerima teks Inggris dari backend.
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10000) {
      return {
        ok: false,
        kind: "validation",
        message: "Periksa kembali isian di bawah ini.",
        fieldErrors: {
          quantity: ["Jumlah harus angka bulat antara 1 dan 10.000."],
        },
      };
    }
    quantity = parsed;
  }

  try {
    const data = await createCustomInquiry({
      name: readText(formData, "name"),
      phone: readText(formData, "phone"),
      quantity,
      note: readOptionalText(formData, "note"),
      items: null,
    });
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
