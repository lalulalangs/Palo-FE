import Image from "next/image";
import Link from "next/link";

import { LineIcon } from "@/components/ui/LineIcon";
import type { ManifestoContent } from "@/lib/homepage-static";
import { readyOrNull } from "@/lib/homepage-static";

/**
 * Brand manifesto — panel gelap dengan kartu manifesyo di kiri dan teks di
 * kanan.
 *
 * ===================================================================
 *  SUMBER ASET
 * ===================================================================
 * Kartu manifesyo disajikan Next.js sendiri dari `public/media/drive/`
 * (path bermula `/`), bukan lewat `mediaUrl()`. Section ini TIDAK memanggil
 * backend.
 *
 * ===================================================================
 *  BLOUR DEKORATIF
 * ===================================================================
 * Lingkaran besar `blur-3xl` dipakai sebagai cahaya ambient. Ia diberi
 * `aria-hidden` — bulatan kabur tidak membawa informasi apa pun, jadi pembaca
 * layar tidak perlu membacakannya sebagai elemen.
 *
 * ===================================================================
 *  TOMBOL
 * ===================================================================
 * Tombol hanya dirender kalau punya tujuan yang diisi. Tombol yang menuju
 * `/` atau `#` hanya menambah langkah tanpa tujuan.
 */
export function ManifestoPanel({ content }: { content: ManifestoContent }) {
  const image = readyOrNull(content.image_path);
  const title = readyOrNull(content.title);
  const body = readyOrNull(content.body);
  const eyebrow = readyOrNull(content.eyebrow);
  const badge = readyOrNull(content.badge);
  const cta1Label = readyOrNull(content.cta_primary_label);
  const cta1Href = readyOrNull(content.cta_primary_url);
  const cta2Label = readyOrNull(content.cta_secondary_label);
  const cta2Href = readyOrNull(content.cta_secondary_url);

  // Tanpa isi teks maupun foto, section tidak punya apa untuk ditampilkan.
  if (!title && !body && !image) return null;

  return (
    <section className="relative overflow-hidden border-b border-border-soft bg-brand-ink py-14 text-surface-paper tablet:py-20">
      {/* Cahaya ambient */}
      <div
        className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-brand-forest/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 tablet:px-8">
        <div className="grid grid-cols-1 items-center gap-10 tablet:gap-14 lg:grid-cols-12">
          {/* ---------- Kartu manifesyo ---------- */}
          {image ? (
            <div className="flex justify-center lg:col-span-5">
              <div className="group relative aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded border border-brand-forest/40 bg-brand-deep shadow-2xl">
                <Image
                  src={image}
                  alt={title ?? "Kartu manifesto Palo Mountain Goods"}
                  fill
                  sizes="(min-width: 1024px) 26rem, 90vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {badge ? (
                  <div className="absolute left-4 top-4 z-10">
                    <span className="border border-surface-white/20 bg-brand-deep/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-earth backdrop-blur-sm">
                      {badge}
                    </span>
                  </div>
                ) : null}

                {readyOrNull(content.strip_left) || readyOrNull(content.strip_right) ? (
                  <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-between border border-surface-white/20 bg-brand-deep/80 p-3 font-mono text-[10px] text-surface-paper/90 backdrop-blur-sm">
                    <span className="tracking-wider">{readyOrNull(content.strip_left)}</span>
                    <span className="uppercase tracking-widest text-accent-earth">
                      {readyOrNull(content.strip_right)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ---------- Teks manifesyo ---------- */}
          <div className={`space-y-6 ${image ? "lg:col-span-7" : "lg:col-span-12"}`}>
            <div className="space-y-3">
              {eyebrow ? (
                <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-accent-earth">
                  <LineIcon name="mountain" />
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <h2 className="font-headline text-3xl leading-tight text-surface-white tablet:text-5xl">
                  {title}
                </h2>
              ) : null}

              {body ? (
                <p className="text-sm font-light leading-relaxed text-surface-paper/90 tablet:text-base">
                  {body}
                </p>
              ) : null}
            </div>

            {content.points.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 border-y border-brand-forest/30 py-4 sm:grid-cols-2">
                {content.points.map((point, i) => (
                  <div key={`${point.title ?? "poin"}-${i}`} className="space-y-1.5">
                    {point.title ? (
                      <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent-earth">
                        <LineIcon
                          name={i === 0 ? "compass" : "leaf"}
                          className="h-4 w-4 text-surface-white"
                        />
                        {point.title}
                      </p>
                    ) : null}
                    {point.body ? (
                      <p className="text-xs font-light leading-relaxed text-surface-dim/80">
                        {point.body}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {(cta1Label && cta1Href) || (cta2Label && cta2Href) ? (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {cta1Label && cta1Href ? (
                  <Link
                    href={cta1Href}
                    className="inline-flex items-center gap-2 bg-surface-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand-deep shadow-sm transition-all duration-150 hover:bg-surface-paper"
                  >
                    <LineIcon name="store" />
                    {cta1Label}
                  </Link>
                ) : null}

                {cta2Label && cta2Href ? (
                  <Link
                    href={cta2Href}
                    className="inline-flex items-center gap-2 border border-brand-forest bg-brand-forest/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-white transition-all duration-150 hover:bg-brand-forest"
                  >
                    <LineIcon name="book" />
                    {cta2Label}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
