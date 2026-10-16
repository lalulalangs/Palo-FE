import Image from "next/image";

import type { LookbookPanel } from "@/lib/homepage-static";
import { readyOrNull } from "@/lib/homepage-static";

/**
 * Lookbook split: dua panel editorial bersebelahan, masing-masing dengan
 * foto besar dan teks di bawahnya.
 *
 * ===================================================================
 *  SUMBER ASET
 * ===================================================================
 * Foto disajikan Next.js sendiri dari `public/media/drive/` (path bermula
 * `/`), bukan lewat `mediaUrl()`. Jadi section ini TIDAK memanggil backend.
 *
 * ===================================================================
 *  KENAPA `aspect-[4/5]`, BUKAN TINGGI TETAP
 * ===================================================================
 * Kedua foto adalah potret 1080x1350 (4:5). Dengan `aspect-[4/5]` proporsi
 * kotak sama dengan aslinya, jadi tidak ada bahagian foto yang terpotong dan
 * tingginya stabil di semua lebar layar.
 *
 * Panel tanpa foto disembunyikan — panel kosong besar dengan teks di atasnya
 * kelihatan seperti aset gagal dimuat, bukan pilihan reka bentuk.
 */
export function LookbookSplit({ panels }: { panels: LookbookPanel[] }) {
  const tampil = panels.filter((panel) => readyOrNull(panel.image_path) !== null);

  if (tampil.length === 0) return null;

  return (
    <section className="w-full bg-brand-ink text-surface-paper">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-1 md:grid-cols-2">
        {tampil.map((panel, i) => (
          <article
            key={`${panel.image_path ?? "panel"}-${i}`}
            className="group relative aspect-[4/5] overflow-hidden bg-brand-deep md:aspect-auto md:min-h-[560px]"
          >
            <Image
              src={panel.image_path as string}
              alt={panel.title ?? "Lookbook Palo Mountain Goods"}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 tablet:p-8">
              {readyOrNull(panel.eyebrow) ? (
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent-earth">
                  {readyOrNull(panel.eyebrow)}
                </p>
              ) : null}

              {readyOrNull(panel.title) ? (
                <h2 className="font-headline text-2xl text-surface-white tablet:text-3xl">
                  {readyOrNull(panel.title)}
                </h2>
              ) : null}

              {readyOrNull(panel.body) ? (
                <p className="max-w-md text-xs font-light leading-relaxed text-surface-paper/80">
                  {readyOrNull(panel.body)}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
