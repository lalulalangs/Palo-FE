import Image from "next/image";

import { LOCAL_ASSET } from "@/lib/media";

/**
 * Logo brand.
 *
 * Sumber gambar
 * -------------
 * DESIGN.md baris 177 menyebut logo asli 150x150 JPEG dengan placeholder
 * `{{DATA:IMAGE:IMAGE_5}}` — token Stitch yang tidak pernah di-resolve.
 *
 * Sekarang logo asli TERSEDIA di repo (`assets_img/logo.jpg`) dan sudah
 * diproses jadi `public/img/logo-150.webp` oleh `scripts/prepare_images.py`.
 *
 * Aturan yang DIJAGA dari DESIGN.md:
 *   - "jangan diperbesar atau digambar ulang" -> ukuran asli 150x150,
 *     ditampilkan pada 48px (header) dan 40px (footer), tidak pernah
 *     di-upscale lewat CSS.
 *   - "tampilkan di atas latar putih bersih" -> wadah memakai
 *     `bg-surface-white`.
 *
 * ===================================================================
 *  KENAPA LATAR PUTIH LOGO SENGAJA DIJAGA
 * ===================================================================
 * Berkas logo tetap opaque. Sempat diberi kanal alfa supaya
 * logo "tampil mengambang" di atas foto hero ketika header transparan —
 * pemilik menolak: logonya harus tetap utuh seperti aslinya.
 *
 * Maka pada header transparan pun logo tetap tampil di dalam petak putih
 * 48x48. Itu memang terlihat sebagai kotak putih di atas foto, tapi itu
 * keputusan pemilik, bukan kelalaian.
 *
 * Karena logo berlatar putih, warnanya juga TIDAK boleh dibalik
 * (`brightness-0 invert`) — kalau dibalik, petak putihnya jadi hitam dan
 * tulisannya jadi magenta.
 *
 * Alt text ditulis mendeskriptif, bukan sekadar "logo", supaya pembaca
 * layar tidak menemukan gambar tanpa konteks.
 */
export function BrandLogo({
  className,
  size = 48,
  preload = false,
}: {
  className?: string;
  /** Ukuran tampil dalam piksel. Selalu <= 150 (ukuran asli). */
  size?: number;
  /**
   * Cerminan prop `preload` Next.js 16 (pengganti `priority` yang deprecated).
   */
  preload?: boolean;
}) {
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center rounded-md bg-surface-white p-1",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
    >
      <Image
        src={LOCAL_ASSET.logo}
        alt="Logo Palo Mountain Goods"
        width={150}
        height={150}
        // `sizes` wajib ada kalau `fill` dipakai; di sini tidak, tapi
        // tetap declaringkan rasio asli supaya browser tidak melakukan
        // layout shift saat logo dimuat.
        preload={preload}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
