"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Gambar dengan fallback.
 *
 * Why: `image.url` dari API boleh `null` (KONTRAK-API §1) selama admin belum
 * mengunggah media. `<img src={null}>` akan menulis `src="null"` dan
 * menampilkan ikon browser rusak — persis yang terjadi di mockup lama untuk
 * kartu produk tanpa foto. Di sini `null`/string kosong langsung memakai
 * placeholder lokal, dan error jaringan juga dialihkan ke placeholder, tanpa
 * perlu mengulang `onError` di tiap kartu.
 */

export interface ImageWithFallbackProps {
  src: string | null;
  /** `null` berarti gambar memang belum ada — alt-nya jadi deskriptif. */
  alt: string | null;
  fallbackSrc?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  /** `true` untuk LCP image (hero, gambar produk pertama). */
  /**
   * Cerminan prop `preload` Next.js 16 (pengganti `priority` yang deprecated).
   */
  preload?: boolean;
  sizes?: string;
  /** Dipakai untuk `object-position` khusus. */
  position?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/placeholder-product.svg",
  fill = false,
  width = 800,
  height = 1000,
  className,
  preload = false,
  sizes,
  position,
}: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const usable = src && src.trim().length > 0 ? src : fallbackSrc;
  // `alt` yang jujur: kalau tidak ada gambar asli, orang butuh tahu apa yang
  // hilang, bukan membaca nama produk sebagai nama gambarnya.
  const accessibleAlt =
    src && src.trim().length > 0
      ? (alt ?? "")
      : `Gambar belum tersedia${alt ? ` untuk ${alt}` : ""}`;

  return (
    <Image
      src={errored ? fallbackSrc : usable}
      alt={accessibleAlt}
      {...(fill ? { fill: true } : { width, height })}
      preload={preload}
      sizes={sizes}
      onError={() => setErrored(true)}
      style={position ? { objectPosition: position } : undefined}
      className={className}
      unoptimized={usable.startsWith("http") && !usable.startsWith("/")}
    />
  );
}
