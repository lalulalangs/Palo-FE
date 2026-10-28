"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { LineIcon } from "@/components/ui/LineIcon";
import type { FilmContent } from "@/lib/homepage-static";
import { readyOrNull } from "@/lib/homepage-static";

/**
 * Opening film: video vertikal + visual essay.
 *
 * ===================================================================
 *  SUMBER ASET
 * ===================================================================
 * Video & poster disajikan Next.js sendiri dari `public/media/drive/`
 * (path bermula `/`), bukan lewat `mediaUrl()`. Jadi section ini TIDAK
 * memanggil backend.
 *
 * ===================================================================
 *  KENAPA CLIENT COMPONENT
 * ===================================================================
 * Tombol play, mute, dan fullscreen semuanya butuh state, dan state hanya
 * bisa hidup di client.
 *
 * ===================================================================
 *  AUTOPLAY MUTED — BUKAN KEBETULAN
 * ===================================================================
 * Browser modern memblokir autoplay yang bersuara. Jadi video bermula muted,
 * dan tombol volume ada untuk pengunjung yang memang mau mendengar.
 * `playsInline` wajib: tanpa itu iOS membuka video fullscreen saat diputar
 * dan section ini hilang.
 *
 * `IntersectionObserver` menghentikan video saat frame-nya keluar dari layar,
 * supaya video tidak boros baterai dan buffer saat tidak dilihat.
 */
export function OpeningFilm({ content }: { content: FilmContent }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const videoUrl = readyOrNull(content.video_path) ?? "";
  const posterUrl = readyOrNull(content.poster_path) ?? undefined;

  const eyebrow = readyOrNull(content.eyebrow);
  const title = readyOrNull(content.title);
  const body = readyOrNull(content.body);
  const chapter = readyOrNull(content.chapter);
  const tag = readyOrNull(content.tag);
  const caption = readyOrNull(content.caption);
  const spec = readyOrNull(content.spec);
  const ctaLabel = readyOrNull(content.cta_primary_label);
  const ctaHref = readyOrNull(content.cta_primary_url) ?? "/produk";

  // Auto-mulai muted kalau browser mengizinkan. Kalau ditolak, video tetap
  // diam dan tombol play manual tetap berfungsi.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = true;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  // Berhenti saat frame keluar layar.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const terlihat = entries[0]?.isIntersecting ?? false;
        if (terlihat) {
          el.play().then(() => setPlaying(true)).catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => undefined);
    } else {
      el.pause();
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const toggleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen().catch(() => undefined);
    }
  };

  // Tanpa video, section ini tidak punya subject. Poster saja tidak cukup —
  // jadi seluruh section disembunyikan.
  if (!videoUrl) return null;

  return (
    <section className="border-b border-border-soft bg-surface-paper py-14 tablet:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-4 tablet:px-8">
        <div className="mb-8 flex items-end justify-between border-b border-border-soft pb-4 tablet:mb-12">
          <div>
            <span className="block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
              VISUAL LOG // SENARU 601 MDPL
            </span>
            <h2 className="mt-1 text-base font-bold uppercase tracking-wider text-text-primary tablet:text-lg">
              SINEMATIK RINJANI : OPENING FILM
            </h2>
          </div>

          {spec ? (
            <p className="hidden items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-secondary sm:flex">
              <span className="h-2 w-2 rounded-full bg-brand-forest" />
              {spec}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 items-center gap-8 tablet:gap-14 lg:grid-cols-12">
          {/* ---------- Frame video vertikal ---------- */}
          <div className="flex justify-center lg:col-span-5">
            <div className="group relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded border border-border-soft bg-brand-deep shadow-lg">
              <video
                ref={videoRef}
                className="h-full w-full object-cover object-center"
                poster={posterUrl}
                src={videoUrl}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={caption ?? "Video Opening Film Palo Mountain Goods"}
              >
                {/*
                  `<track>` untuk aksesibilitas. Tiada fail VTT di repo, jadi
                  trek kosong disembunyikan agar tidak menghasilkan permintaan
                  jaringan gagal.
                */}
                <track kind="captions" />
              </video>

              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"
                aria-hidden="true"
              />

              {/* pojok atas: chapter + tombol suara */}
              <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
                {chapter ? (
                  <span className="border border-border-soft bg-surface-white/95 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-deep">
                    {chapter}
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Nyalakan suara video" : "Matikan suara video"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-white/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-surface-white"
                >
                  <LineIcon name={muted ? "volume-off" : "volume-up"} className="h-4 w-4" />
                </button>
              </div>

              {/* tengah: tombol play */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Jeda video" : "Putar video"}
                className={[
                  "absolute inset-0 z-10 flex items-center justify-center",
                  // Sembunyikan tombol selama video berjalan: video sudah
                  // terlihat bergerak, jadi tombol hanya menambah elemen di
                  // atas subjek.
                  playing ? "opacity-0" : "opacity-100",
                  "transition-opacity duration-300",
                  "hover:opacity-100 focus-visible:opacity-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-16 w-16 items-center justify-center rounded-full",
                    "bg-surface-white/95 text-brand-deep shadow-md transition-all",
                    "group-hover:bg-brand-forest group-hover:text-surface-white",
                  ].join(" ")}
                >
                  <LineIcon name="play" className="h-8 w-8" strokeWidth={1.4} />
                </span>
              </button>

              {/* bawah: durasi, tag, caption */}
              <div className="absolute inset-x-4 bottom-4 z-10 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-surface-paper/90">
                  {spec ? (
                    <span className="flex items-center gap-1.5">
                      <LineIcon name="film" className="h-4 w-4 text-accent-earth" />
                      {spec.split("•")[0]?.trim()}
                    </span>
                  ) : (
                    <span />
                  )}

                  {tag ? (
                    <span className="border border-surface-white/20 bg-brand-deep/80 px-2 py-0.5 text-[9px] uppercase tracking-widest">
                      {tag}
                    </span>
                  ) : null}
                </div>

                {caption ? (
                  <p className="line-clamp-1 text-[11px] font-medium tracking-tight text-surface-paper">
                    {caption}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* ---------- Teks visual essay ---------- */}
          <div className="space-y-6 lg:col-span-7">
            <div className="space-y-3">
              {eyebrow ? (
                <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-brand-forest">
                  <LineIcon name="film" />
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <h3 className="font-headline text-2xl leading-tight text-text-primary tablet:text-4xl">
                  {title}
                </h3>
              ) : null}

              {body ? (
                <p className="text-xs font-light leading-relaxed text-text-secondary tablet:text-sm">
                  {body}
                </p>
              ) : null}
            </div>

            {content.facts.length > 0 ? (
              <dl className="grid grid-cols-1 gap-4 border-y border-border-soft py-2 sm:grid-cols-2">
                {content.facts.map((fact, i) => (
                  <div key={`${fact.label ?? "fakta"}-${i}`} className="space-y-1">
                    <dt className="block font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                      {fact.label}
                    </dt>
                    <dd className="text-xs font-semibold text-text-primary">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {ctaLabel ? (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 bg-brand-forest px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-white shadow-sm transition-colors duration-150 hover:bg-brand-deep"
                >
                  <LineIcon name="bag" />
                  {ctaLabel}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 border border-border-soft bg-surface-white px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-primary transition-colors duration-150 hover:bg-surface-paper"
              >
                <LineIcon name="expand" />
                Putar Mode Layar Penuh
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
