"use client";

import { useState } from "react";

import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { ProductImageItem } from "@/lib/types";

/**
 * Galeri produk.
 *
 * Diperbarui untuk layout compact desktop:
 * - Ketinggian foto utama dibatasi maksimal 520px pada desktop dengan rasio 4:3
 *   agar foto tidak mendominasi layar laptop dan panel pembelian tetap terlihat utuh.
 * - Thumbnail kompak baris horizontal dengan active ring indicator.
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
    <div className="flex flex-col gap-3 tablet:gap-4 tablet:max-w-lg desktop:max-w-none">
      {images.length === 0 ? (
        <div
          data-pdp-gallery="empty"
          className="flex h-[220px] flex-col justify-center rounded-xl border border-dashed border-border-soft bg-surface-paper p-6 tablet:h-[280px]"
        >
          <p className="text-label-md font-semibold text-text-primary">
            Foto produk belum tersedia
          </p>
          <p className="mt-1 text-label-sm text-text-secondary">
            Foto produk ini akan segera kami perbarui. Pantau terus, ya!
          </p>
        </div>
      ) : (
        <div className="relative aspect-square tablet:aspect-4/3 desktop:aspect-4/3 max-h-[480px] desktop:max-h-[520px] w-full overflow-hidden rounded-xl border border-border-soft bg-surface-sage">
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
        <ul
          className="flex items-center gap-3 overflow-x-auto pb-1 pt-1"
          role="tablist"
          aria-label="Pilihan thumbnail foto produk"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={image.url} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  aria-label={`Tampilkan foto ${index + 1} dari ${images.length}`}
                  className={[
                    "relative block h-16 w-16 tablet:h-20 tablet:w-20 overflow-hidden rounded-lg border-2 bg-surface-sage transition-all",
                    isActive
                      ? "border-brand-forest ring-2 ring-brand-forest/20"
                      : "border-border-soft hover:border-brand-pine",
                  ].join(" ")}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.alt ?? `${productName} — foto ${index + 1}`}
                    fill
                    sizes="5rem"
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
