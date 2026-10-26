"use client";

import { useState } from "react";

import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
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
 * Rasio: 1:1 di mobile (390 px: 358×358) karena foto 4:5 setinggi ±487 px
 * mendorong harga keluar layar pertama; 4:5 dari 768 px, dibatasi 512 px di
 * tablet supaya panel tidak terdorong. Foto tetap di atas judul.
 *
 * Media kosong (`media: []`) bukan "gambar yang gagal dimuat": itu fakta
 * tentang data. Karena itu tidak ada `<img>` sama sekali dan tidak ada
 * placeholder bergambar — blok tenang dengan dua baris teks.
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
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="flex flex-col gap-4 tablet:max-w-lg desktop:max-w-none">
      {images.length === 0 ? (
        <div
          data-pdp-gallery="empty"
          className="flex h-[220px] flex-col justify-center rounded-xl border border-dashed border-border-soft bg-surface-paper p-6 tablet:h-[280px]"
        >
          <p className="text-label-md font-semibold text-text-primary">
            Foto produk belum tersedia
          </p>
          <p className="mt-1 text-label-sm text-text-secondary">
            Foto belum diunggah admin.
          </p>
        </div>
      ) : (
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border-soft bg-surface-sage tablet:aspect-4/5">
          <ImageWithFallback
            src={active.url}
            alt={active.alt ?? `${productName} — foto 1`}
            fill
            preload
            sizes="(min-width: 1280px) 45rem, (min-width: 768px) 32rem, 100vw"
            className="object-cover object-center"
          />
          {badge ? (
            <span className="absolute left-4 top-4 rounded-md border border-border-soft bg-surface-white/95 px-2 py-1 text-caption font-semibold text-brand-forest">
              {badge}
            </span>
          ) : null}
        </div>
      )}

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3">
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={image.url}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  aria-label={`Tampilkan foto ${index + 1} dari ${images.length}`}
                  className={[
                    "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-surface-sage transition-colors",
                    isActive
                      ? "border-brand-forest"
                      : "border-border-soft hover:border-brand-pine",
                  ].join(" ")}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.alt ?? `${productName} — foto ${index + 1}`}
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
