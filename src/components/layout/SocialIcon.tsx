import Image from "next/image";

/**
 * Ikon kanal media sosial.
 *
 * ===================================================================
 *  KENAPA SVG INLINE, BUKAN ICON FONT / CDN
 * ===================================================================
 * 1. Ikon harus berwarna PUTIH dan ikut warna teks. `fill="currentColor"`
 *    membuatnya mengikuti warna induknya tanpa aturan warna tambahan.
 * 2. Tidak ada permintaan jaringan tambahan. Ikon font dari CDN menambah satu
 *    DNS+TLS+unduhan yang memblokir render, dan kalau CDN-nya gagal, ikon
 *    hilang persis di footer.
 * 3. Mirip dengan keputusan di `SiteHeader` dan `SiteFooter` yang juga memakai
 *    SVG inline, bukan Material Symbols dari CDN.
 *
 * ===================================================================
 *  AKSESIBILITAS
 * ===================================================================
 * - Ikon diberi `aria-hidden` karena bukan informasi: label teks ada di
 *   `sr-only` pada pemanggil.
 * - Tautan selalu punya `rel="noopener noreferrer"` untuk `target="_blank"`.
 *   Tanpa `noopener`, halaman yang dibuka bisa membaca `window.opener` dan
 *   mengarahkan tab toko ke situs lain.
 *
 * ===================================================================
 *  KANAL YANG TIDAK DISEMBUNYIKAN
 * ===================================================================
 * `socialLinks()` mengembalikan HANYA kanal yang punya URL. Kanal kosong
 * tidak dirender sama sekali — bukan ikon mati, bukan `href="#"`. Ikon
 * sosial media yang menuju ke tautan kosong membuat pengunjung menyimpulkan
 * akunnya hilang, dan `href="#"` yang diklik hanya memuat ulang halaman.
 */

export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "threads"
  | "whatsapp";

export interface SocialLink {
  network: SocialNetwork;
  /** Nama kanal untuk pembaca layar, mis. "Instagram". */
  label: string;
  href: string;
}

/**
 * Susun daftar tautan kanal yang benar-benar terisi.
 *
 * `wa.me` untuk WhatsApp sudah dirangkai di `brand.ts` lewat
 * `toWhatsAppNumber()`, jadi di sini cukup memakai `whatsappLink` yang
 * sudah ternormalisasi. Kalau nomornya belum diisi, hasilnya `null` dan
 * kanal ini ikut hilang.
 */
export function socialLinks(brand: {
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  threadsUrl?: string | null;
  whatsappLink: string | null;
}): SocialLink[] {
  const links: SocialLink[] = [];

  if (brand.instagramUrl) {
    links.push({
      network: "instagram",
      label: "Instagram",
      href: brand.instagramUrl,
    });
  }

  if (brand.facebookUrl) {
    links.push({
      network: "facebook",
      label: "Facebook",
      href: brand.facebookUrl,
    });
  }

  if (brand.tiktokUrl) {
    links.push({
      network: "tiktok",
      label: "TikTok",
      href: brand.tiktokUrl,
    });
  }

  if (brand.threadsUrl) {
    links.push({
      network: "threads",
      label: "Threads",
      href: brand.threadsUrl,
    });
  }

  if (brand.whatsappLink) {
    links.push({
      network: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${brand.whatsappLink}`,
    });
  }

  return links;
}

/**
 * Ikon SVG untuk satu kanal.
 *
 * Semua ikon memakai `currentColor` supaya warnanya mengikuti teks induk.
 */
export function SocialIcon({
  network,
  className,
}: {
  network: SocialNetwork;
  className?: string;
}) {
  const cls = ["h-5 w-5", className ?? ""].filter(Boolean).join(" ");

  switch (network) {
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Z" />
          <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
          <circle cx="18.41" cy="5.59" r="1.44" />
        </svg>
      );

    case "facebook":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
        </svg>
      );

    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
        </svg>
      );

    case "threads":
      return (
        <Image
          src="/threads_icon.webp"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          unoptimized
          className={`${cls} object-contain`}
        />
      );

    case "whatsapp":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
        </svg>
      );
  }
}
