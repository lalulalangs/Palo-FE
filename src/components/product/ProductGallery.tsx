"use client";

import { useState } from "react";

import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { PLACEHOLDER } from "@/lib/placeholders";
import type { ProductImageItem } from "@/lib/types";

/**
 * Galeri produk.
 *
 * Kenapa Client Component: mockup lama menukar gambar utama lewat
 * `onclick` inline + `document.getElementById`, sehingga tombol thumbnail-nya
 * tidak punya state React dan tidak bisa dioperasikan dengan keyboard tanpa
 * `onclick` inline. Di sini state thumbnail hidup di React, dan setiap
 * thumbnail adalah `<button>` dengan `aria-pressed` sehingga pembaca layar
 * tahu gambar mana yang sedang tampil.
 *
 * Kalau belum ada media resmi (KONTRAK-API `images: []`), galeri tetap
 * tampil sebagai placeholder yang jujur, bukan ruang kosong 4:5 yang
 * terlihat seperti gambar yang gagal dimuat.
 */
export function ProductGallery({
  images,
  productName,
  badge,
}: {
  images: ProductImageItem[];
  productName: string;
  badge: string | null;
}) {
  // Index 0 selalu ada: kalau backend tidak mengirim gambar, pakai satu
  // entri placeholder supaya layout dan rasio aspek tetap konsisten.
  const gallery: ProductImageItem[] =
    images.length > 0
      ? images
      : [{ url: PLACEHOLDER.image, alt: productName }];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[Math.min(activeIndex, gallery.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-4/5 overflow-hidden rounded-lg border border-border-soft bg-surface-sage">
        <ImageWithFallback
          src={active.url}
          alt={active.alt ?? productName}
          fill
          preload
          sizes="(min-width: 1024px) 45rem, 100vw"
          className="object-cover object-center"
        />
        {badge ? (
          <span className="absolute left-4 top-4 rounded-md border border-border-soft bg-surface-white/95 px-3 py-1 text-label-sm font-semibold text-brand-forest">
            {badge}
          </span>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3">
          {gallery.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={image.url}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  aria-label={`Tampilkan gambar ${index + 1} dari ${productName}`}
                  className={[
                    "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-surface-sage transition-colors",
                    isActive
                      ? "border-brand-forest"
                      : "border-border-soft hover:border-brand-pine",
                  ].join(" ")}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.alt ?? `${productName} — gambar ${index + 1}`}
                    fill
                    sizes="8rem"
                    className="object-cover object-center"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
