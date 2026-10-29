"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { safeExternalUrl } from "@/lib/url";

/**
 * Carousel hero bergaya lookbook.
 *
 * ===================================================================
 *  SUMBER DATA
 * ===================================================================
 * Slide dipetakan dari `GET /api/v1/hero-sliders` di `app/page.tsx`. Komponen
 * ini tidak pernah memanggil API sendiri dan tidak tahu nama field kontrak.
 *
 * ===================================================================
 *  AKSESIBILITAS — LIMA ATURAN YANG SERING DILANGGAR DI CAROUSEL
 * ===================================================================
 *  1. Geser otomatis yang tidak bisa dihentikan melanggar WCAG 2.2.2
 *     ("Moving, Blinking, Scrolling"). Karena itu ada jeda saat hover, saat
 *     fokus masuk, saat tab tidak aktif, DAN tombol jeda eksplisit 44×44.
 *  2. Hanya slide yang SEDANG TAMPIL yang dirender. Kalau slide tersembunyi
 *     ikut dirender dengan `opacity: 0`, isinya masih bisa difokus keyboard
 *     dan pembaca layar akan menelusuri semua slide sekaligus.
 *  3. Label tombol navigasi menyebut posisinya ("Ke slide 2 dari 3").
 *  4. `prefers-reduced-motion: reduce` dihormati: autoplay tidak dipasang,
 *     dan tombol jeda tidak dirender karena tidak ada yang bisa dijeda.
 *  5. Satu slide bukan carousel: tanpa panah, dot, autoplay, dan tanpa
 *     `role="carousel"` — itu pembohongan struktur.
 */

export interface HeroSlide {
  id: number | null;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  stampLeft: string | null;
  stampRight: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  cta2Label: string | null;
  cta2Url: string | null;
  imageUrl: string | null;
  /**
   * `null` = `alt=""` (dekoratif) — BUKAN diisi judul. `h1` sudah
   * menyuarakan kalimat yang sama; mengulanginya di `alt` membuat pembaca
   * layar membacanya dua kali.
   */
  imageAlt: string | null;

  /** Varian 16:9 (tablet + desktop). `null` = tidak ada foto. */
  imageLandscapeUrl: string | null;

  /** Varian 4:5 untuk HP. `null` = pakai `imageUrl` (crop tengah). */
  imagePortraitUrl: string | null;

  /**
   * Slot lama dari jalur `/banners`. `/hero-sliders` tidak punya aset 6:5,
   * jadi variabel ini TIDAK dirender sebagai `<source>` lagi — kalau
   * dipasang, tablet akan cocok ke `<source>` berisi crop yang salah.
   */
  imageTabletUrl: string | null;

  /**
   * JEBAKAN PENAMAAN: `HeroFrame` menghitung `isDark = theme !== "dark"`,
   * jadi `"light"` = teks PUTIH + scrim gelap. `"dark"` justru teks gelap di
   * atas scrim paper. Jalur `/hero-sliders` memakai `"light"`.
   */
  theme: "light" | "dark";
  /** 0-100. Jalur `/hero-sliders` memakai 100; default 45 gagal kontras AA. */
  overlayOpacity: number;
}

/** Durasi tiap slide dalam milidetik. Diminta pemilik: 10 detik. */
const AUTOPLAY_MS = 10_000;

/**
 * Jarak minimal finger travel (piksel) agar gestur dianggap "geser".
 *
 * Why 45 and not 10: pada layar sentuh, jitter tangan saat menyentuh bisa
 * sampai belasan piksel. Ambang terlalu kecil membuat slide berganti sendiri
 * saat pengguna cuma intending untuk menekan CTA. 45px cukup jauh untuk
 * unmistakable dan masih jauh di bawah lebar swipe rata-rata (~200px).
 */
const SWIPE_THRESHOLD_PX = 45;

/**
 * Kelas bersama dua CTA (§4a): tinggi 44px (WCAG 2.5.5), tanpa `uppercase`
 * (design.md §50: uppercase hanya untuk eyebrow/nav/label kategori).
 */
const CTA_BASE =
  "inline-flex min-h-11 max-w-full items-center justify-center px-6 py-2.5 text-center text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-white tablet:px-8";

/** Primer: `brand.forest` + teks putih (7,43:1), hover `brand.deep`. */
const CTA_PRIMARY = `${CTA_BASE} bg-brand-forest text-surface-white hover:bg-brand-deep`;

/**
 * Sekunder: outline putih tanpa isi.
 *
 * Bukan hijau karena outline `#1F6048` di atas scrim gelap hanya 1,6:1 —
 * garis tombolnya hilang (WCAG 1.4.11 butuh 3:1).
 */
const CTA_SECONDARY = `${CTA_BASE} border border-surface-white text-surface-white hover:bg-surface-white hover:text-brand-deep`;

/** Fokus di dalam hero: outline global (`brand-forest`) tidak terlihat di scrim. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-white";

export function HeroCarousel({
  slides,
  fallbackTitle,
  fallbackTagline,
  fallbackEybrow,
}: {
  slides: HeroSlide[];
  fallbackTitle: string;
  fallbackTagline: string;
  fallbackEybrow: string;
}) {
  const [index, setIndex] = useState(0);
  const [pausedByPointer, setPausedByPointer] = useState(false);
  const [pausedByFocus, setPausedByFocus] = useState(false);
  const [pausedByTab, setPausedByTab] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const total = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      // Modulo ganda supaya index selalu valid, termasuk untuk nilai negatif
      // (tombol "sebelumnya" di slide pertama).
      setIndex((((next % total) + total) % total));
    },
    [total],
  );

  const isPaused =
    pausedByPointer || pausedByFocus || pausedByTab || pausedByUser;

  /**
   * `prefers-reduced-motion` dibaca sebagai STATE, bukan hanya di dalam
   * effect: tombol jeda tidak boleh muncul untuk pengguna yang tidak pernah
   * melihat animasi apa pun.
   */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /** Autoplay hanya masuk akal untuk ≥2 slide dan bila gerak tidak dikurangi. */
  const canAutoplay = total > 1 && !reducedMotion;

  /**
   * Timer autoplay.
   *
   * `index` sengaja ada di dependensi: setiap navigasi (otomatis maupun
   * manual) mereset timer, sehingga "10 detik" selalu dihitung dari slide
   * yang baru tampil — bukan dari slide sebelumnya.
   */
  useEffect(() => {
    if (!canAutoplay || isPaused) return;

    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearTimeout(timer);
  }, [index, total, canAutoplay, isPaused]);

  /**
   * Jeda saat tab browser tidak aktif.
   *
   * Tanpa ini carousel tetap berjalan di background; pengguna kembali
   * menemukan slide sudah berganti tanpa interaksi apa pun.
   */
  useEffect(() => {
    const onVisibility = () => setPausedByTab(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Kalau admin mengurangi jumlah slide lewat panel, index yang sedang aktif
  // bisa jadi tidak valid. Clamp supaya tidak menampilkan `undefined`.
  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1);
  const current = slides[safeIndex] ?? null;

  /** 1 slide bukan carousel (§5): tanpa kontrol, tanpa role carousel. */
  const isCarousel = total > 1;
  /** Dot hanya berguna sampai 6; di atas itu panah + penanda posisi. */
  const showDots = total >= 2 && total <= 6;
  const showArrows = total >= 7;

  /* ------------------------------------------------------------------ */
  /* Gestur geser (swipe)                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Titik awal gestur.
   *
   * Disimpan di `ref`, bukan `state`, karena alasan teknis yang nyata:
   * `setState` memicu re-render, dan re-render di tengah gerakan jari
   * berisiko membuat `pointerup` datang terlambat sehingga gestur yang
   * sudah terjadi ikut terlewat. Nilainya hanya dibaca di handler yang
   * sama, jadi `ref` memang yang tepat secara semantik juga.
   */
  const gestureStart = useRef<{ x: number; y: number } | null>(null);

  /**
   * Penanda bahwa gestur sudah dihitung sebagai navigasi.
   *
   * Kenapa perlu flag tersendiri: setelah `pointerup`, browser masih bisa
   * mengirim `click` ke elemen di bawahnya. Tanpa penanda ini, pengguna
   * yang menggeser dengan ujung jari ikut memicu tombol CTA slide yang
   * sedang tampil. Satu `preventDefault` di handler pertama tidak
   * cukup, jadi penahanannya dilakukan eksplisit saat klik berikutnya.
   */
  const swipeConsumedClick = useRef(false);

  /**
   * Memakai Pointer Events (bukan `TouchEvent`) supaya satu jalur kode
   * menutup sentuh, mouse, dan pena.
   *
   * Geseran vertikal SENGAJA diabaikan: hero ini diikuti section panjang,
   * jadi scroll vertikal harus tetap normal. Bandingkan `abs` `dx` dan
   * `dy` dulu, supaya gerakan vertikal tidak pernah salah dibaca
   * sebagai navigasi.
   */
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (total <= 1) return;
      gestureStart.current = { x: event.clientX, y: event.clientY };
      swipeConsumedClick.current = false;
    },
    [total],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = gestureStart.current;
      gestureStart.current = null;

      if (!start || total <= 1) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      // Gestur vertikal = scroll halaman, bukan navigasi slide.
      if (Math.abs(dy) > Math.abs(dx)) return;

      // Geseran terlalu kecil = jitter tangan, bukan maksud geser.
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;

      swipeConsumedClick.current = true;

      // Jari ke kiri → maju. Ke kanan → mundur.
      goTo(safeIndex + (dx < 0 ? 1 : -1));
    },
    [goTo, safeIndex, total],
  );

  /**
   * Batalkan klik yang menempel setelah swipe.
   *
   * Capture phase dipakai supaya handler ini berjalan sebelum handler `Link`
   * di bawahnya, sehingga navigasi bisa dibatalkan di tempat yang sama.
   */
  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (!swipeConsumedClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    swipeConsumedClick.current = false;
  }, []);


  return (
    <div
      className="relative"
      // `role="carousel"` untuk satu (atau nol) slide adalah pembohongan
      // struktur — tanpa kontrol, tanpa geser, tidak ada yang "berputar".
      role={isCarousel ? "group" : undefined}
      aria-roledescription={isCarousel ? "carousel" : undefined}
      aria-label={isCarousel ? "Sorotan koleksi" : undefined}
      /*
       * `touch-action: pan-y` memberi tahu browser pembagian tanggung
       * jawab gestur: scroll VERTIKAL milik halaman, gestur HORISONTAL
       * milik carousel. Tanpa ini browser membatalkan `pointerup`
       * begitu gerakan berubah menjadi scroll — swipe mati di layar
       * sentuh.
       */
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        gestureStart.current = null;
      }}
      onClickCapture={onClickCapture}
      onMouseEnter={() => setPausedByPointer(true)}
      onMouseLeave={() => setPausedByPointer(false)}
      onFocusCapture={() => setPausedByFocus(true)}
      onBlurCapture={(event) => {
        // Jangan terus menjeda kalau fokus pindah ke elemen LAIN di dalam
        // carousel (mis. dari tombol ke titik indikator): `relatedTarget`
        // menunjukkan tujuan fokus berikutnya.
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
          setPausedByFocus(false);
        }
      }}
      onKeyDown={(event) => {
        if (!isCarousel) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(safeIndex + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(safeIndex - 1);
        }
      }}
    >
      <HeroFrame
        slide={current}
        isFirst={safeIndex === 0}
        slideLabel={isCarousel ? `${safeIndex + 1} dari ${total}` : null}
        fallbackTitle={fallbackTitle}
        fallbackTagline={fallbackTagline}
        fallbackEybrow={fallbackEybrow}
      />

      {isCarousel ? (
        <>
          <NavButton
            side="left"
            visible={showArrows}
            onClick={() => goTo(safeIndex - 1)}
          />
          <NavButton
            side="right"
            visible={showArrows}
            onClick={() => goTo(safeIndex + 1)}
          />

          {showDots ? (
            /*
             * Kotak sentuh 44×44 dengan batang visual kecil di tengah:
             * yang kecil tetap kecil (4×8px), yang bisa disentuh 44px
             * (WCAG 2.5.5). Enam dot = 264px, masih muat di 390 bersama
             * tombol jeda; tujuh mulai bertabrakan.
             */
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center">
              {slides.map((slide, i) => {
                const active = i === safeIndex;
                return (
                  <button
                    key={slide.id ?? i}
                    type="button"
                    onClick={() => goTo(i)}
                    // Label menyebut posisi, bukan cuma "slide 2".
                    aria-label={`Ke slide ${i + 1} dari ${total}${
                      slide.title ? `: ${slide.title}` : ""
                    }`}
                    aria-current={active ? "true" : undefined}
                    className={`flex h-11 w-11 items-center justify-center ${FOCUS_RING}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1 transition-all duration-200 ${
                        active
                          ? "w-6 bg-surface-white"
                          : "w-2 bg-surface-white/50"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            /* Di atas 6 slide dot tidak lagi jadi navigasi yang berguna. */
            <p
              aria-hidden="true"
              className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-xs tracking-widest text-surface-white"
            >
              {safeIndex + 1} / {total}
            </p>
          )}

          {canAutoplay ? (
            /*
             * WCAG 2.2.2 menuntut mekanisme jeda yang bisa DITEMUKAN, bukan
             * efek samping hover. Menekan jeda = jeda permanen sampai
             * pengguna menekan lagi.
             *
             * `motion-reduce:hidden` mencegah tombol berkedip sesaat sebelum
             * hidrasi pada pengguna yang meminta gerak dikurangi.
             */
            <button
              type="button"
              onClick={() => setPausedByUser((value) => !value)}
              aria-label={
                pausedByUser
                  ? "Lanjutkan geser otomatis"
                  : "Jeda geser otomatis"
              }
              className={`motion-reduce:hidden absolute bottom-6 right-4 z-20 flex h-11 w-11 items-center justify-center text-sm leading-none text-surface-white ${FOCUS_RING} tablet:right-10`}
            >
              <span aria-hidden="true">{pausedByUser ? "▶" : "❚❚"}</span>
            </button>
          ) : null}

          {/*
           * Pengumuman posisi untuk pembaca layar.
           *
           * `aria-live` hanya `polite` saat carousel tidak berjalan sendiri:
           * pengumuman posisi tiap 10 detik saat autoplay adalah gangguan,
           * tapi saat pengguna yang menggeser, pengumuman itu justru perlu.
           */}
          <p
            aria-live={isPaused || !canAutoplay ? "polite" : "off"}
            aria-atomic="true"
            className="sr-only"
          >
            Slide {safeIndex + 1} dari {total}
            {current?.title ? `: ${current.title}` : ""}
          </p>
        </>
      ) : null}
    </div>
  );
}

/**
 * Tombol panah kiri/kanan.
 *
 * `visible` = false (2–6 slide) membuatnya transparan dan tidak bisa diklik
 * mouse, tapi tetap ada di urutan tab dan muncul begitu menerima fokus.
 * Di layar sentuh panah ini tidak berguna (gestur geser lebih natural), dan
 * untuk ≤6 slide dot sudah jadi navigasi visualnya.
 */
function NavButton({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Slide sebelumnya" : "Slide berikutnya"}
      className={[
        "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-2xl leading-none text-surface-white/85",
        "transition-colors hover:text-surface-white",
        FOCUS_RING,
        visible
          ? ""
          : "pointer-events-none opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100",
        side === "left" ? "left-3 tablet:left-6" : "right-3 tablet:right-6",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true">{side === "left" ? "‹" : "›"}</span>
    </button>
  );
}

type Href = { href: string; external: boolean };

/**
 * Tujuan CTA dari panel admin (§4d).
 *
 * - `/produk`              -> navigasi klien (`<Link>`)
 * - `https://…`            -> tab baru
 * - `//contoh.com`         -> TIDAK dirender: tanpa skema, browser membacanya
 *                             sebagai path relatif ke toko sendiri
 * - `javascript:…`, `""`   -> TIDAK dirender
 *
 * `safeExternalUrl()` sengaja hanya dipakai untuk cabang eksternal: ia
 * mengembalikan `null` untuk `/produk`, jadi salah pakai = semua CTA internal
 * hilang.
 */
function resolveHref(raw: string): Href | null {
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return { href: raw, external: false };
  }
  const external = safeExternalUrl(raw);
  return external ? { href: external, external: true } : null;
}

/** Satu CTA. `null` (URL tidak sah) berarti tombol tidak dirender. */
function CtaButton({
  className,
  label,
  target,
}: {
  className: string;
  label: string;
  target: Href;
}) {
  if (target.external) {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
        <span className="sr-only"> (terbuka di tab baru)</span>
      </a>
    );
  }
  return (
    <Link href={target.href} className={className}>
      {label}
    </Link>
  );
}

/**
 * Rangka hero: foto latar, scrim, dan isi slide.
 *
 * Dipisah dari logika carousel supaya bagian client (interaktif) tidak ikut
 * memuat detail presentasi.
 *
 * CATATAN `preload`: hanya slide PERTAMA yang di-preload. Kalau ketiga
 * slide di-preload, browser mengunduh semua foto sebelum satu pun tampil —
 * persis yang harus dihindari. Foto slide 2 dan 3 dimuat malas (lazy)
 * seperti gambar biasa.
 *
 * (`preload` menggantikan `priority` yang sejak Next.js 16 dianggap deprecated.)
 */
function HeroFrame({
  slide,
  isFirst,
  slideLabel,
  fallbackTitle,
  fallbackTagline,
  fallbackEybrow,
}: {
  slide: HeroSlide | null;
  isFirst: boolean;
  slideLabel: string | null;
  fallbackTitle: string;
  fallbackTagline: string;
  fallbackEybrow: string;
}) {
  // `theme: "dark"` = teks gelap, untuk banner ber-foto terang.
  // Default `light` (teks terang) karena itu kondisi paling umum — dan satu-
  // satunya nilai yang dipakai jalur `/hero-sliders`.
  const isDark = slide?.theme !== "dark";

  const textColor = isDark ? "text-surface-white" : "text-text-primary";
  const subTextColor = isDark ? "text-surface-white/90" : "text-text-secondary";
  const stampColor = isDark
    ? "text-surface-white drop-shadow-sm"
    : "text-text-primary drop-shadow-sm";

  /**
   * Keadaan kosong (§6): tidak ada slide, atau slide tanpa foto.
   *
   * Latar `brand-deep` polos, tinggi `clamp(20rem, 44svh, 26rem)` — bukan 4:5,
   * karena kotak 4:5 tanpa gambar hanya mengosongkan layar pertama.
   */
  const quiet = !slide?.imageUrl;

  /*
   * Scrim. Angka 65/60/55 (bawah/tengah/atas) BUKAN selera: dengan
   * `overlayOpacity: 100` angka inilah yang membuat teks putih ≥4,5:1 di
   * ketiga zona teks walaupun fotonya putih murni (4,76 / 5,74 / 6,98:1).
   * Gradien lama 70/40/45 dikali opasitas 45 menghasilkan 1,53:1 — gagal AA.
   */
  const overlay = isDark
    ? "bg-gradient-to-t from-black/65 via-black/60 to-black/55"
    : "bg-gradient-to-t from-surface-paper/85 via-surface-paper/45 to-surface-paper/25";

  /*
   * Kalimat hero. `description` kosong = paragraf TIDAK dirender (tanpa
   * placeholder karangan); `badge` kosong jatuh ke `fallbackEybrow`, karena
   * pill kosong terbaca sebagai elemen rusak.
   */
  const eyebrow = slide?.eyebrow ?? fallbackEybrow;
  const heading = (slide?.title ?? fallbackTitle).trim();
  const subtitle = slide ? slide.subtitle : fallbackTagline;

  /*
   * Dua CTA (§4a–4c). Tombol hanya ikut kalau label DAN url-nya ada serta
   * URL-nya sah. Kalau primer kosong, sekunder NAIK jadi primer (satu tombol
   * outline terbaca sebagai tindakan kelas dua); kalau dua-duanya kosong,
   * baris CTA tidak dirender sama sekali — termasuk `mt-8`-nya.
   */
  const ctas = [
    { label: slide?.ctaLabel ?? null, url: slide?.ctaUrl ?? null },
    { label: slide?.cta2Label ?? null, url: slide?.cta2Url ?? null },
  ]
    .map((candidate) => {
      if (!candidate.label || !candidate.url) return null;
      const target = resolveHref(candidate.url);
      return target ? { label: candidate.label, target } : null;
    })
    .filter((item): item is { label: string; target: Href } => item !== null);

  return (
    <section
      /*
       * `flex` (bukan sekadar block) supaya blok teks mengisi tinggi kotak
       * dan bisa ditengahkan vertikal di kedua varian: 4:5/16:9 ber-`aspect-
       * ratio` maupun `--quiet` ber-`min-height`.
       *
       * Rasio dikunci lewat `.hero-frame` di globals.css, bukan dari tinggi
       * viewport. `min-height` sengaja tidak dipasang di sini: kalau teks
       * lebih tinggi dari rasio (judul panjang di tablet sempit),
       * `aspect-ratio` hanya berlaku sebagai preferensi dan kotak tumbuh
       * sendiri. Memaksakan `min-height` hanya menyembunyikan masalahnya.
       */
      className={[
        "hero-frame relative flex w-full overflow-hidden border-b border-border-soft bg-brand-deep",
        quiet ? "hero-frame--quiet" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={slideLabel ? "group" : undefined}
      aria-roledescription={slideLabel ? "slide" : undefined}
      aria-label={slideLabel ?? undefined}
    >
      {slide?.imageUrl ? (
        /*
         * =============================================================
         *  KENAPA `<picture>`, BUKAN SATU `<Image>` DENGAN object-COVER
         * =============================================================
         * Dua rasio kotak: 4:5 di HP, 16:9 di tablet ke atas. Backend
         * `/hero-sliders` menyediakan `mobile_url` (4:5) dan `desktop_url`
         * (16:9).
         *
         * Tidak ada `<source>` untuk tablet: `/hero-sliders` tidak punya aset
         * 6:5, jadi tablet memakai `desktop_url` 16:9 lewat `<img>` di bawah.
         * `images.mobile_url` kosong → `<img>` memakai `desktop_url`, yang
         * dengan `object-cover object-center` memotong ±44% lebar. Itu
         * keadaan terdegradasi yang sah, bukan bug yang diakali di CSS.
         *
         * Kenapa `alt` hanya di `<img>`: `<source>` dalam `<picture>` tidak
         * boleh punya `alt` — atribut itu milik `<img>`.
         */
        <picture className="absolute inset-0 block">
          {slide.imagePortraitUrl ? (
            <source media="(max-width: 767px)" srcSet={slide.imagePortraitUrl} />
          ) : null}

          <Image
            src={slide.imageUrl}
            alt={slide.imageAlt ?? ""}
            fill
            // `sizes` wajib untuk `fill`. Tanpa itu Next mengunduh gambar
            // sebesar viewport penuh di setiap perangkat.
            sizes="100vw"
            preload={isFirst}
            className="object-cover object-center"
            style={{ filter: "saturate(0.95)" }}
          />
        </picture>
      ) : null}

      {slide?.imageUrl ? (
        <div
          className={`absolute inset-0 ${overlay}`}
          style={{ opacity: slide.overlayOpacity / 100 }}
          aria-hidden="true"
        />
      ) : null}

      {/*
        Label editorial di dua sudut.

        `top-24`, bukan `top-6`: header beranda memakai `position: fixed`
        setinggi 80px (h-20), jadi label harus mulai DI BAWAH header kalau
        tidak keduanya saling tumpuk. `pt-20` pada wadah konten di bawah
        memberi ruang yang sama untuk teks.
      */}
      {slide?.stampLeft ? (
        <p
          className={`hidden tablet:block absolute left-4 top-24 z-10 max-w-[40%] font-mono text-xs uppercase tracking-widest tablet:left-10 tablet:text-sm ${stampColor}`}
        >
          {slide.stampLeft}
        </p>
      ) : null}

      {slide?.stampRight ? (
        <p
          className={`hidden tablet:block absolute right-4 top-24 z-10 max-w-[40%] text-right font-mono text-xs uppercase tracking-widest tablet:right-10 tablet:text-sm ${stampColor}`}
        >
          {slide.stampRight}
        </p>
      ) : null}

      {/*
        Konten di TENGAH, mendatar dan tegak lurus.

        Padding atas `pt-20` menyisakan ruang untuk header `fixed` sekaligus
        menggeser titik tengah ke bawah sedikit — hasil optiknya lebih
        seimbang daripada tengah geometris yang persis. `pb-16` memberi parit
        selebar kotak tombol navigasi (44) plus jarak, sehingga CTA tidak
        pernah menumpuk dot.

        Wadah memakai `box-sizing: border-box` (set global Tailwind), jadi
        padding ini TIDAK menambah tinggi hero.
      */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-center px-4 pb-16 pt-20 tablet:px-8 desktop:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className={[
              "mb-4 inline-block border px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.25em] tablet:text-xs",
              quiet
                ? // Isi `brand-deep/80` akan menyatu dengan latar piring teks.
                  "border-surface-paper/40 text-surface-paper"
                : isDark
                  ? "border-brand-forest/50 bg-brand-deep/80 text-surface-paper"
                  : "border-border-soft bg-surface-white/80 text-text-primary",
            ].join(" ")}
          >
            {eyebrow}
          </span>

          {heading ? (
            <h1
              className={[
                "font-headline text-4xl tracking-tight tablet:text-display-mobile desktop:text-display-lg",
                textColor,
                isDark ? "drop-shadow-md" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {heading}
            </h1>
          ) : null}

          {subtitle ? (
            <p
              className={`mx-auto mt-4 max-w-xl font-sans text-base font-light leading-relaxed tablet:text-lg ${subTextColor}`}
            >
              {subtitle}
            </p>
          ) : null}

          {ctas.length > 0 ? (
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 tablet:flex-row tablet:items-center">
              {ctas.map((cta, i) => (
                <CtaButton
                  key={`${cta.target.href}-${i}`}
                  label={cta.label}
                  target={cta.target}
                  className={i === 0 ? CTA_PRIMARY : CTA_SECONDARY}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
