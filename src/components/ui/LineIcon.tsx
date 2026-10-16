/**
 * Ikon garis untuk UI beranda.
 *
 * ===================================================================
 *  KENAPA BUKAN "Material Symbols Outlined" DARI CDN
 * ===================================================================
 * Mockup memakai `<link>` ke Google Fonts + `.material-symbols-outlined`.
 * Dua alasan tidak diikuti:
 *
 * 1. **CSS Eksternal untuk icon bukan custom font.** Kalau CDN gagal
 *    (sinyal buruk, diblokir, offline), ikon hilang dan tombol kehilangan
 *    label visualnya — tepat di bagian yang paling dipercaya pengunjung.
 *    Huruf fallback "search" akan muncul sebagai teks, bukan ikon.
 *
 * 2. **Tag CDN adalah render-blocking.** `next/font` ada justru supaya font
 *    di-host sendiri. Memakai CDN untuk font berarti mengorbankan
 *    Kecepatan Largest Contentful Paint demi-keepsanan.
 *
 * Semua ikon di sini inline SVG, `currentColor`, dan berada di bundle —
 * nol permintaan jaringan tambahan, dan ikut warna teksnya.
 */
export type LineIconName =
  | "search"
  | "person"
  | "bag"
  | "arrow-forward"
  | "truck"
  | "chat"
  | "film"
  | "play"
  | "volume-up"
  | "volume-off"
  | "expand"
  | "mountain"
  | "leaf"
  | "compass"
  | "store"
  | "book"
  | "pin"
  | "check"
  | "ticket"
  | "timer"
  | "sparkle"
  | "people";

/**
 * Ikon garis 24x24, `stroke="currentColor"`.
 *
 * `strokeWidth` 1.8 dipilih supaya konsisten dengan ikon header yang
 * sudah ada di `SiteHeader` — supaya tidak terlihat seperti dua set ikon
 * dalam satu halaman.
 */
export function LineIcon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: LineIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    className: ["h-5 w-5", className ?? ""].filter(Boolean).join(" "),
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );

    case "person":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" />
        </svg>
      );

    case "bag":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </svg>
      );

    case "arrow-forward":
      return (
        <svg {...common}>
          <path d="M4 12h16" />
          <path d="m14 6 6 6-6 6" />
        </svg>
      );

    case "truck":
      return (
        <svg {...common}>
          <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7" />
          <circle cx="6.5" cy="18.5" r="1.8" />
          <circle cx="17" cy="18.5" r="1.8" />
        </svg>
      );

    case "chat":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
      );

    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <path d="M8 5v14M16 5v14M3 12h18" />
        </svg>
      );

    case "play":
      return (
        <svg {...common} strokeWidth={1.4}>
          <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
        </svg>
      );

    case "volume-up":
      return (
        <svg {...common}>
          <path d="M5 10h3l4-3v10l-4-3H5z" />
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        </svg>
      );

    case "volume-off":
      return (
        <svg {...common}>
          <path d="M5 10h3l4-3v10l-4-3H5z" />
          <path d="m16 10 4 4M20 10l-4 4" />
        </svg>
      );

    case "expand":
      return (
        <svg {...common}>
          <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
        </svg>
      );

    case "mountain":
      return (
        <svg {...common}>
          <path d="M3 19h18L14.5 7 11 12.5 8.5 9 3 19Z" />
        </svg>
      );

    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 19c0-8 5-13 14-13 0 9-4 13-11 13H5Z" />
          <path d="M5 19c3-4 6-6 10-7" />
        </svg>
      );

    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m15 9-2 4-4 2 2-4 4-2Z" />
        </svg>
      );

    case "store":
      return (
        <svg {...common}>
          <path d="M4 9h16v11H4z" />
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "book":
      return (
        <svg {...common}>
          <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
          <path d="M17 7h2v13H8" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" />
        </svg>
      );

    case "ticket":
      return (
        <svg {...common}>
          <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Z" />
        </svg>
      );

    case "timer":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M12 9.5V13l2.5 1.5M9.5 3h5" />
        </svg>
      );

    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" />
        </svg>
      );

    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
          <path d="M16 6.5a3 3 0 0 1 0 5.5M17 14.5c2 .7 3.5 2.3 3.5 4.5" />
        </svg>
      );
  }
}
