import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Jaring pengaman untuk `kembali dari DOKU` — BUKAN implementasi kedua.
 *
 * Route yang sebenarnya dipakai adalah `/orders/{order_number}`:
 * `DokuCheckoutClient::callbackUrl()` mengirim
 * `FRONTEND_URL.'/orders/'.$order->order_number` ke DOKU sebagai
 * `callback_url`, jadi pembeli mendarat di sana tanpa lewat file ini.
 *
 * File ini hanya menangani satu kemungkinan: Back Office DOKU diisi path
 * lain (`/doku`) beserta parameter yang berbeda. Semua nilainya diteruskan ke
 * halaman yang sama — tidak ada logika status, pembayaran, atau tampilan di
 * sini, supaya tidak ada dua tempat yang bisa berbeda hasilnya.
 *
 * Tanpa `order`/`invoice_number` yang bisa dipakai, tujuan jatuh ke `/lacak`
 * (bukan 404, karena pembeli tetap harus punya jalan keluar).
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const raw = params.get("order") ?? params.get("invoice_number") ?? "";
  const orderNumber = raw.trim().toUpperCase();

  const target = orderNumber
    ? `/orders/${encodeURIComponent(orderNumber)}`
    : "/lacak";

  return NextResponse.redirect(new URL(target, request.url));
}
