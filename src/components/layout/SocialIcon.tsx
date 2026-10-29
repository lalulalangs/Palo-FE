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
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 9.166 3.59 12c.026 2.833.717 5.494 2.071 7.168c1.43 1.782 3.63 2.695 6.54 2.717c3.955-.028 6.471-1.465 7.427-4.485c.348-1.087.525-2.31.525-3.643v-1.399c-1.044.33-2.221.503-3.51.517c-4.455.048-7.575-1.507-7.575-4.757c0-2.483 1.956-4.14 5.06-4.14c2.148 0 3.754.764 4.636 2.208c.801 1.306 1.135 3.109 1.135 5.568v1.46c0 1.637-.258 3.098-.788 4.347c-1.218 2.87-4.095 4.368-8.146 4.398m-.104-14.502c1.783-.012 2.923.957 2.923 2.502c0 1.492-1.222 2.455-2.986 2.441c-1.745-.013-2.909-.972-2.909-2.454c0-1.528 1.185-2.476 2.972-2.489" />
        </svg>
      );

    case "whatsapp":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cls}
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.115-.198.057-.371-.029-.52-.087-.148-.66-1.59-.905-2.18-.24-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.987 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334 .101 11.892c0 2.096.548 4.142 1.588 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.585 0 11.946-5.336 11.949-11.896a11.86 11.86 0 0 0-3.421-8.399" />
        </svg>
      );
  }
}
