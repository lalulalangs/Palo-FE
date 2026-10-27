import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { ProductCard } from "./ProductCard";
import {
  PLACEHOLDER_NOTICE_BODY,
  PLACEHOLDER_NOTICE_TITLE,
} from "@/lib/placeholders";
import type { ProductListItem } from "@/lib/types";

/**
 * Grid produk. Satu-satunya grid produk di seluruh situs — beranda,
 * `/produk`, `/kategori/[slug]`, dan "Produk lain" di halaman detail
 * semuanya lewat ke sini.
 *
 * ===================================================================
 *  KOLOM DIATUR DARI LEBAR CONTAINER, BUKAN LEBAR VIEWPORT
 * ===================================================================
 * Grid ini hidup di dua lebar yang sangat berbeda, dan keduanya pada
 * viewport yang sama:
 *
 *   - beranda & "Produk lain"  -> container 1304px
 *   - `/produk` & `/kategori`   -> container 856px (grid 8 dari 12 kolom,
 *                                 sisanya sidebar filter)
 *
 * Kalau jumlah kolom mengikuti breakpoint viewport, grid yang sama
 * menghasilkan kartu 308px di satu halaman dan 196px di halaman lain —
 * dan yang 196px itu cukup sempit untuk membuat dua badge saling menutup.
 * `@container` membaca lebar yang sebenarnya, jadi kartu selalu punya
 * ruang yang layak ke mana pun grid ini dipasang.
 *
 * Ambang kolom (2 -> 3 -> 4) dipilih supaya lebar kartu naik monoton dan
 * tidak pernah turun saat ruang bertambah:
 *
 *   container < 480px   -> 2 kolom   (ponsel 356px  -> kartu 164px)
 *   480 - 1040px        -> 3 kolom   (856px         -> kartu 269px)
 *   >= 1040px           -> 4 kolom   (1304px        -> kartu 308px)
 *
 * Bandingkan dengan breakpoint viewport versi lama (`tablet:grid-cols-3
 * desktop:grid-cols-4`): di tablet 768px hasilnya 214px, di `/produk`
 * desktop 856px hanya 196px — lebih kecil daripada di tablet.
 *
 * Hanya `tablet:` dan `desktop:` yang boleh dipakai untuk memengaruhi
 * TIPOGRAFI di seluruh repo ini; `globals.css` mendefinisikan tepat dua
 * breakpoint itu, dan memakai `sm:`/`md:`/`lg:` akan memperkenalkan
 * ambiguitas lebar layar ketiga. `@container` bukan pengecualian — ia
 * mengukur lebar elemen, bukan layar.
 *
 * `apiAvailable` membedakan dua kondisi yang berbeda artinya:
 * - `false` -> backend tidak bisa dihubungi sama sekali.
 * - `true` dengan array kosong -> backend hidup, memang belum ada produk.
 * Menggabungkan keduanya jadi "kosong" akan menyembunyikan masalah operasional.
 */
export function ProductGrid({
  products,
  apiAvailable,
  emptyTitle,
  emptyBody,
  className = "",
  limit,
}: {
  products: ProductListItem[];
  apiAvailable: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  className?: string;
  /** Batasi jumlah kartu. Beranda memakainya untuk 8 dari 24. */
  limit?: number;
}) {
  if (products.length === 0) {
    return (
      <PlaceholderNotice
        title={emptyTitle ?? PLACEHOLDER_NOTICE_TITLE}
        body={emptyBody ?? PLACEHOLDER_NOTICE_BODY}
        variant={apiAvailable ? "sage" : "paper"}
        className={className}
      />
    );
  }

  const tampil = typeof limit === "number" ? products.slice(0, limit) : products;

  return (
    /*
      `@container` WAJIB ada di elemen TERPISAH dari `<ul>`, bukan di
      `<ul>` itu sendiri. Ini batasan spec CSS container query: sebuah
      elemen container hanya bisa menata ANAK-ANAKNYA, tidak bisa menata
      dirinya sendiri. Kalau `@container` dan varian `@lg:` /
      `@5xl:` menempel pada elemen yang sama, blok `@container` diabaikan
      diam-diam dan grid jatuh ke `grid-cols-2` di semua lebar — persis
      yang terjadi di percobaan pertama, tanpa satu pun error build.

      Catatan: nama kelas container query sengaja ditulis terpisah di
      sini, tidak pernah sebagai satu token utuh di dalam komentar.
      Tailwind memindai SELURUH file sumber — termasuk komentar — untuk
      mencari nama kelas, dan token container-query yang utuh di dalam
      komentar akan ikut dijadikan kandidat utility lalu menghasilkan CSS
      yang gagal di-parse.
    */
    <div className={["@container w-full min-w-0", className].filter(Boolean).join(" ")}>
      <ul className="grid w-full min-w-0 grid-cols-2 gap-4 @lg:grid-cols-3 @lg:gap-6 @5xl:grid-cols-4">
        {tampil.map((product, index) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} preload={index < 2} />
          </li>
        ))}
      </ul>
    </div>
  );
}
