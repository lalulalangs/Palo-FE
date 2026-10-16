"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carousel hero bergaya lookbook.
 *
 * ===================================================================
 *  FITUR
 * ===================================================================
 *  - Banyak slide, diambil dari `GET /api/v1/banners`.
 *  - Berganti otomatis tiap 10 detik.
 *  - Bisa dijeda: saat kursor/fokus di atas hero, atau tab browser tidak aktif.
 *  - Tombol titik untuk navigasi manual + tombol sebelumnya/berikutnya.
 *  - Panah kiri/kanan untuk keyboard.
 *
 * ===================================================================
 *  AKSESIBILITAS — EMPAT ATURAN YANG SERING DILANGGAR DI CAROUSEL
 * ===================================================================
 *  1. Geser otomatis yang tidak bisa dihentikan melanggar WCAG 2.2.2
 *     ("Moving, Blinking, Scrolling"). Karena itu ada jeda saat hover,
 *     saat fokus masuk, dan saat tab tidak aktif.
 *  2. Hanya slide yang SEDANG TAMPIL yang dirender. Kalau slide tersembunyi
 *     ikut dirender dengan `opacity: 0`, isinya masih bisa difokus keyboard
 *     dan pembaca layar akan menelusuri semua slide sekaligus.
 *  3. Label tombol navigasi menyebut posisinya ("Ke slide 2 dari 3"),
 *     bukan "slide 2" saja, karena pengguna pembaca layar
 *     tidak punya konteks visual soal mana yang sedang tampil.
 *  4. `prefers-reduced-motion: reduce` dihormati: transisi tidak
 *     beranimasi kalau pengguna memintanya.
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
  imageAlt: string | null;

  /**
   * Varian 16:9 untuk tablet + desktop.
   *
   * Box hero berubah rasio drastis: 0,59 (HP) sampai 2,05 (desktop).
   * Dengan `object-cover`, satu berkas hanya menutupi satu ujung —
   * di HP slide landscape kehilangan 60% lebarnya. Varian kedua
   * dari `prepare_banner_crops.py` menutupi ujung yang lain.
   *
   * `null` = crop belum dibuat. Jangan pernah dianggap sebagai
   * "tanpa gambar": pemanggil jatuh ke `imageUrl`.
   */
  imageLandscapeUrl: string | null;

  /** Varian 4:5 untuk HP. Lihat `imageLandscapeUrl`. */
  imagePortraitUrl: string | null;

  /** Varian 6:5 untuk tablet (768 - 1279px). Lihat `imageLandscapeUrl`. */
  imageTabletUrl: string | null;

  theme: "light" | "dark";
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

  const isPaused = pausedByPointer || pausedByFocus || pausedByTab;

  /**
   * Timer autoplay.
   *
   * `index` sengaja ada di dependensi: setiap navigasi (otomatis maupun
   * manual) mereset timer, sehingga "10 detik" selalu dihitung dari slide
   * yang baru tampil — bukan dari slide sebelumnya.
   */
  useEffect(() => {
    // Satu slide tidak perlu digeser, dan tidak ada yang bisa dijeda.
    if (total <= 1 || isPaused) return;

    // Hormati preferensi pengurangan gerak.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearTimeout(timer);
  }, [index, total, isPaused]);

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

  const hasControls = total > 1;

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
      role="group"
      aria-roledescription="carousel"
      aria-label="Sorotan koleksi"
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
        if (!hasControls) return;
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
        fallbackTitle={fallbackTitle}
        fallbackTagline={fallbackTagline}
        fallbackEybrow={fallbackEybrow}
      />

      {hasControls ? (
        <>
          <NavButton side="left" onClick={() => goTo(safeIndex - 1)} />
          <NavButton side="right" onClick={() => goTo(safeIndex + 1)} />

          {/* Titik indikator. */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
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
                  className={`h-1 transition-all duration-200 ${
                    active
                      ? "w-6 bg-surface-white"
                      : "w-2 bg-surface-white/50 hover:bg-surface-white/80"
                  }`}
                />
              );
            })}
          </div>

          {/*
           * Pengumuman posisi untuk pembaca layar.
           *
           * `aria-live="polite"` berarti tidak interrupting: dibacakan
           * setelah pembaca selesai dengan bagian lain, bukan memotong.
           */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
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
 * Dibuat `sr-only` lalu kembali tampil saat menerima fokus: di layar sentril
 * panah ini tidak berguna (gestur geser lebih natural) dan hanya menambah
 * kebisingan visual, TAPI pengguna keyboard tetap wajib punya cara bergeser
 * selain panah kiri/kanan pada area gambar.
 */
function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Slide sebelumnya" : "Slide berikutnya"}
      className={[
        "absolute top-1/2 z-20 -translate-y-1/2 p-3 text-2xl leading-none text-surface-white/85",
        "transition-colors hover:text-surface-white",
        "sr-only focus:not-sr-only",
        side === "left" ? "left-3 focus:left-6" : "right-3 focus:right-6",
      ].join(" ")}
    >
      <span aria-hidden="true">{side === "left" ? "‹" : "›"}</span>
    </button>
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
  fallbackTitle,
  fallbackTagline,
  fallbackEybrow,
}: {
  slide: HeroSlide | null;
  isFirst: boolean;
  fallbackTitle: string;
  fallbackTagline: string;
  fallbackEybrow: string;
}) {
  // `theme: "dark"` = teks gelap, untuk banner ber-foto terang.
  // Default `light` (teks terang) karena itu kondisi paling umum.
  const isDark = slide?.theme !== "dark";

  const textColor = isDark ? "text-surface-white" : "text-text-primary";
  const subTextColor = isDark ? "text-surface-white/90" : "text-text-secondary";
  const stampColor = isDark
    ? "text-surface-white drop-shadow-sm"
    : "text-text-primary drop-shadow-sm";

  // Lapisan gelap (scrim).
  //
  // Bentuk gradien mengikuti LETAK teks, dan teksnya sekarang di tengah.
  // Gradien lama `from-black/60 via-black/20 to-black/30` berat ke BAWAH —
  // itu benar waktu judulnya melayang di bawah (gaya mockup lama), tapi
  // sekarang membuat bagian tengah nyaris tanpa gelembung: subjudul putih
  // menghilang tepat di atas air atau batu terang.
  //
  // Jadi gradasinya dibuat lebih rata, dengan titik gelap di tengah tempat
  // teks berada. Kekuatan keseluruhan dikendalikan `overlay_opacity` dari panel
  // admin, jadi pemilik tetap bisa menyetelnya per banner.
  const overlay = isDark
    ? "bg-gradient-to-t from-black/70 via-black/40 to-black/45"
    : "bg-gradient-to-t from-surface-paper/85 via-surface-paper/45 to-surface-paper/25";

  return (
    <section
      /*
       * Rasio dikunci lewat `.hero-frame` di globals.css, bukan dari
       * tinggi viewport. Penjelasan lengkap ada di komentar kelas itu --
       * intinya: `78vh` membuat rasio kotak berbeda di tiap perangkat,
       * sehingga `object-cover` selalu memotong sebagian besar.
       *
       * `min-height` sengaja TIDAK ada di sini. Kalau teksual isinya
       * lebih tinggi dari rasio (judul panjang di tablet sempit),
       * `aspect-ratio` hanya acted sebagai preferensi dan kotak akan
       * tumbuh sendiri. Memaksakan `min-height` hanya menyembunyikan
       * masalahnya.
       */
      className="hero-frame relative w-full overflow-hidden border-b border-border-soft bg-brand-deep"
    >
      {slide?.imageUrl ? (
        /*
         * =============================================================
         *  KENAPA `<picture>`, BUKAN SATU `<Image>` DENGAN object-COVER
         * =============================================================
         * Rasio kotak hero dikunci di `.hero-frame` (globals.css) per
         * kelompok perangkat: 4:5 di HP, 6:5 di tablet, 2:1 di desktop.
         *
         * Sebenarnya tinggi hero dulunya `78vh`, jadi rasio kotaknya
         * bergerak 0,59 sampai 2,67 tergantung perangkat. Dengan
         * `object-cover` yang hanya bisa memotong, tidak ada satu berkas
         * pun yang cocok untuk semua ukuran itu.
         *
         * Sekarang tiap kelompok punya crop pada rasio yang sama, jadi
         * potong nol. Backend mengirim ketiganya lewat `image_portrait`,
         * `image_tablet`, `image_landscape`; frontend hanya memilih.
         * Asetnya dibuat oleh `scripts/prepare_banner_crops.py`.
         *
         * Kenapa bukan `getImageProps`: komponen ini butuh tiga `<source>`
         * dengan lebar berbeda dalam satu grup, sedangkan `getImageProps`
         * hanya menghasilkan satu `<img>`.
         *
         * Kenapa `alt` hanya di `<img>`: `<source>` dalam `<picture>`
         * tidak boleh punya `alt` — atribut itu milik `<img>`, dan
         * pembaca layar akan membacanya dua kali kalau diduplikasi.
         */
        <picture className="absolute inset-0 block">
          {/*
           * HP yang dirotasi (viewport pendek).
           *
           * Ditaruh PERTAMA karena `<picture>` memakai `<source>` pertama
           * yang cocok, bukan yang paling spesifik. Tanpa ini, HP landscape
           * 844px lebar akan cocok ke aturan tablet dan dapat crop 6:5,
           * padahal kotaknya sudah `min-height: 60svh` tanpa rasio --
           * artinya landscape lebar. Yang benar di sini justru 2:1.
           *
           * `30rem` = 480px, sama persis dengan batas di `.hero-frame`
           * untuk layar pendek. Kalau meleset, `.hero-frame` masih pakai
           * aspect-ratio sementara crop-nya sudah 2:1, atau sebaliknya.
           */}
          {slide.imageLandscapeUrl ? (
            <source media="(max-height: 479px)" srcSet={slide.imageLandscapeUrl} />
          ) : null}

          {/*
           * HP tegak (4:5). Batas 767px = satu piksel di bawah
           * `--breakpoint-tablet` (48rem / 768px) di globals.css.
           */}
          {slide.imagePortraitUrl ? (
            <source media="(max-width: 767px)" srcSet={slide.imagePortraitUrl} />
          ) : null}

          {/*
           * Tablet (6:5), 768 - 1279px. Batas atas satu piksel di bawah
           * `--breakpoint-desktop` (80rem / 1280px).
           */}
          {slide.imageTabletUrl ? (
            <source
              media="(min-width: 768px) and (max-width: 1279px)"
              srcSet={slide.imageTabletUrl}
            />
          ) : null}

          {slide.imageLandscapeUrl ? (
            <source media="(min-width: 1280px)" srcSet={slide.imageLandscapeUrl} />
          ) : null}

          {/*
           * `<img>` di sini adalah fallback, bukan salah satu varian.
           *
           * Kalau crop belum dibuat sama sekali, hanya `imageUrl` yang
           * dipakai — perilakunya sama persis dengan sebelum ada
           * `<picture>`. Kalau crop ada tapi `<picture>` tidak didukung
           * browser, elemen ini yang menampilkannya.
           */}
          <Image
            src={slide.imageUrl}
            alt={slide.imageAlt ?? slide.title}
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

      <div
        className={`absolute inset-0 ${overlay}`}
        style={{ opacity: (slide?.overlayOpacity ?? 45) / 100 }}
        aria-hidden="true"
      />

      {/*
        Label editorial di dua sudut.

        `top-24`, bukan `top-6`: header beranda memakai `position: fixed`
        setinggi 80px (h-20), jadi label harus mulai DI BAWAH header kalau
        tidak keduanya saling tumpuk. `pt-20` pada wadah konten di bawah
        memberi ruang yang sama untuk teks, sehingga tinggi total hero tetap
        utuh.
      */}
      {slide?.stampLeft ? (
        <p
          className={`absolute left-4 top-24 z-10 max-w-[40%] font-mono text-xs uppercase tracking-widest tablet:left-10 tablet:text-sm ${stampColor}`}
        >
          {slide.stampLeft}
        </p>
      ) : null}

      {slide?.stampRight ? (
        <p
          className={`absolute right-4 top-24 z-10 max-w-[40%] text-right font-mono text-xs uppercase tracking-widest tablet:right-10 tablet:text-sm ${stampColor}`}
        >
          {slide.stampRight}
        </p>
      ) : null}

      {/*
        Konten di TENGAH, mendatar dan tegak lurus.

        `items-center justify-center` menengahkan blok teks di dalam hero.
        Padding atas `pt-20` menyisakan ruang untuk header `fixed` sekaligus
        menggeser titik tengah ke bawah sedikit — hasil optiknya lebih
        seimbang daripada tengah geometris yang persis.

        Wadah memakai `box-sizing: border-box` (set global Tailwind), jadi
        padding ini TIDAP menambah tinggi hero.
      */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] items-center justify-center px-4 pb-16 pt-20 tablet:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className={[
              "mb-4 inline-block border px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.25em] backdrop-blur-sm tablet:text-xs",
              isDark
                ? "border-brand-forest/50 bg-brand-deep/80 text-surface-paper"
                : "border-border-soft bg-surface-white/80 text-text-primary",
            ].join(" ")}
          >
            {slide?.eyebrow ?? fallbackEybrow}
          </span>

          <h1
            className={[
              "font-headline text-3xl leading-tight tracking-tight tablet:text-5xl desktop:text-display-mobile",
              textColor,
              isDark ? "drop-shadow-md" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {slide?.title ?? fallbackTitle}
          </h1>

          <p
            className={`mx-auto mt-4 max-w-xl font-sans text-sm font-light leading-relaxed ${subTextColor}`}
          >
            {slide?.subtitle ?? fallbackTagline}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 tablet:flex-row tablet:items-center">
            {slide?.ctaLabel ? (
              <Link
                href={slide.ctaUrl ?? "/produk"}
                className={[
                  "inline-flex items-center justify-center px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors duration-150",
                  isDark
                    ? "bg-surface-white text-brand-deep hover:bg-surface-paper"
                    : "bg-brand-forest text-surface-white hover:bg-brand-deep",
                ].join(" ")}
              >
                {slide.ctaLabel}
              </Link>
            ) : null}

            {slide?.cta2Label ? (
              <Link
                href={slide.cta2Url ?? "/cerita"}
                className={[
                  "inline-flex items-center justify-center border px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors duration-150",
                  isDark
                    ? "border-surface-white/60 bg-brand-deep/80 text-surface-white backdrop-blur-sm hover:bg-brand-deep"
                    : "border-border-soft bg-surface-white/80 text-text-primary hover:bg-surface-sage",
                ].join(" ")}
              >
                {slide.cta2Label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
