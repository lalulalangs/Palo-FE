/**
 * Konten editorial beranda — STATIK (tanpa backend).
 *
 * ===================================================================
 *  MENGAPA MODUL INI ADA
 * ===================================================================
 * Dulu konten ini datang dari `GET /homepage` (`home.lookbook`,
 * `home.manifesto`, `home.film`). Endpoint itu TIDAK di-route di
 * `routes/api.php`, jadi selalu 404 dan section foto/video-nya tidak pernah
 * tampil.
 *
 * Sekarang isinya di-hardcode di sini dan asetnya disajikan Next.js sendiri
 * dari `public/media/drive/` — jadi TIDAK menyentuh backend sama sekali.
 * Jalur aset memakai path lokal bermula `/` (mis.
 * `/media/drive/drive-alam-lookbook-1080.webp`), BUKAN `mediaUrl()` yang
 * selalu menempelkan base backend.
 *
 * ===================================================================
 *  SUMBER TEKS
 * ===================================================================
 * Teks diambil daripada `HomepageContentSeeder.php` backend lama supaya
 * tampilannya sama seperti sebelum ini. Semuanya copy editorial (bukan fakta
 * operasional seperti kode voucher/harga), jadi selamat untuk dipaparkan.
 *
 * Kalau nanti admin mahu mengeditnya, isi ini boleh dipindahkan ke medan
 * backend — struktur tipenya sengaja dibuat sama dengan kontrak lama supaya
 * peralihan itu tidak perlu menulis semula komponen.
 */

/** Baris "LABEL KECIL" + nilai (dipakai di fakta opening film). */
export interface LabeledValue {
  label: string | null;
  value: string | null;
}

/** Judul + paragraf (dipakai di poin manifesyo). */
export interface TitleBody {
  title: string | null;
  body: string | null;
}

/** Satu panel lookbook. */
export interface LookbookPanel {
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  image_path: string | null;
}

/** Panel manifesyo brand. */
export interface ManifestoContent {
  image_path: string | null;
  badge: string | null;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  strip_left: string | null;
  strip_right: string | null;
  points: TitleBody[];
  cta_primary_label: string | null;
  cta_primary_url: string | null;
  cta_secondary_label: string | null;
  cta_secondary_url: string | null;
}

/** Opening film: video vertikal + visual essay. */
export interface FilmContent {
  video_path: string | null;
  poster_path: string | null;
  chapter: string | null;
  tag: string | null;
  caption: string | null;
  spec: string | null;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  cta_primary_label: string | null;
  cta_primary_url: string | null;
  facts: LabeledValue[];
}

export interface HomepageEditorial {
  lookbook: LookbookPanel[];
  manifesto: ManifestoContent;
  film: FilmContent;
}

/**
 * Nilai yang aman dirender.
 *
 * Meniru `readyOrNull()` kontrak lama: nilai kosong/`null` dianggap "tiada",
 * dan teks placeholder bergaya `[dari Admin]` tidak pernah dirender seolah
 * sudah jadi.
 */
export function readyOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return null;
  return trimmed;
}

/** Jalur aset tempatan (disajikan Next.js dari `public/`). */
const DRIVE = "/media/drive";

/**
 * Isi editorial beranda.
 *
 * Susunannya sengaja sama dengan seeder lama supaya tampilan "seperti kemarin".
 */
export const HOMEPAGE: HomepageEditorial = {
  lookbook: [
    {
      eyebrow: "LOMBOK LOOKBOOK // 01",
      title: "Lahir dari Hening Senaru 601 MDPL",
      body: "Ditenun & dicetak bertutur. Membawa kesejukan air Terjun Tiu Kelep dan kerendahan hati lereng gunung ke setiap serat kain.",
      image_path: `${DRIVE}/drive-alam-lookbook-1080.webp`,
    },
    {
      eyebrow: "RINJANI CALDERA TRIBUTE",
      title: "Ilustrasi & Tipografi Berakar Lokal",
      body: "Setiap goresan mencatat batas punggungan 3726 MDPL, perhentian danau kaldera, dan doa keselamatan para penjelajah.",
      image_path: `${DRIVE}/drive-camp-exploring-1080.webp`,
    },
  ],

  manifesto: {
    image_path: `${DRIVE}/drive-manifesto-1080.webp`,
    badge: "MANIFESTO // ARCHIVE",
    eyebrow: "BRAND MANIFESTO // FILOSOFI SENARU",
    title: "Good Things Grow From The Mountain",
    body: "PALO lahir dari hening dan keagungan Gunung Rinjani. Kami percaya bahwa pakaian bukan sekadar penutup raga, melainkan pernyataan spiritual dan tanda kehormatan bagi mereka yang melangkah selaras dengan alam liar Lombok.",
    strip_left: "SENARU 601 MDPL",
    strip_right: "EDISI CETAK RESMI",
    points: [
      {
        title: "Ruang Singgah Senaru",
        body: "Bukan sekadar toko ritel, melainkan tempat berkumpul, bertukar cerita jalur, dan merayakan persahabatan kaki gunung.",
      },
      {
        title: "Filosofi Material",
        body: "Katun berat berserat kokoh, pigmen alami bernuansa bumi, serta siluet santai yang nyaman untuk iklim tropis lembap.",
      },
    ],
    cta_primary_label: "Kunjungi Toko Senaru",
    cta_primary_url: "/kontak",
    cta_secondary_label: "Jelajahi Cerita Lengkap",
    cta_secondary_url: "/cerita",
  },

  film: {
    video_path: `${DRIVE}/drive-opening-film.mp4`,
    poster_path: `${DRIVE}/drive-opening-film-poster.webp`,
    chapter: "CHAPTER 01",
    tag: "LOOKBOOK REEL",
    caption: "Suara Langkah Pertama di Ketinggian 601 MDPL",
    spec: null,
    eyebrow: "VISUAL ESSAY // LOOKBOOK DIARY",
    title: "Merekam Sunyi, Embun Pagi, dan Ketangguhan Kain di Lereng Senaru",
    body: "Sebuah pembuka visual yang merangkum ritme hidup di gerbang pendakian Rinjani. Melalui lensa film portrait, kami mengabadikan bagaimana koleksi katun berat dan perlengkapan ekspedisi Palo menyatu dengan kabut hutan lembap, batuan vulkanik, dan langkah kaki para penjelajah.",
    cta_primary_label: "Eksplorasi Koleksi Terkait",
    cta_primary_url: "/produk",
    facts: [],
  },
};
