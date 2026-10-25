import type { CartItem } from "@/lib/types";

/**
 * Keadaan stok satu baris keranjang.
 *
 * Diturunkan dari tiga field yang SUDAH dikirim `GET /cart` (`quantity`,
 * `available_stock`, `is_out_of_stock`) — tidak ada field API baru. Kenapa
 * fungsi terpisah: baris keranjang, ringkasan, dan form tamu harus memakai
 * aturan yang sama; menyalin predikatnya ke tiga tempat adalah cara tercepat
 * membuat ketiganya menyimpang.
 *
 * Urutan penting: `habis` menang atas `kurang`, karena `available_stock: 0`
 * akan lolos uji `quantity > available_stock`.
 */
export type CartStockState = "cukup" | "kurang" | "habis";

export function stockStateOf(item: CartItem): CartStockState {
  if (item.is_out_of_stock || item.available_stock <= 0) return "habis";
  if (item.quantity > item.available_stock) return "kurang";
  return "cukup";
}
