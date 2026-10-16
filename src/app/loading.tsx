/**
 * Skeleton fallback untuk seluruh route.
 *
 * CATATAN PENTING: `loading.tsx` di root `app/` membungkus SELURUH isi root
 * layout, jadi file ini adalah fallback untuk **semua** route — bukan hanya
 * beranda. Versi pertama file ini berisi hero dan grid beranda, dan akibatnya
 * `/kontak`, `/keranjang`, dan `/lacak` menampilkan kerangka beranda selama
 * dimuat. Itu menyesatkan: pengguna melihat judul yang tidak ada di halaman
 * yang sedang dibuka.
 *
 * Karena itu isinya dibuat netral: blok konten dengan tinggi yang dipesan,
 * berlaku untuk halaman apa pun. Skeleton yang benar-benar spesifik per
 * halaman diletakkan di samping route-nya masing-masing — lihat
 * `src/app/produk/loading.tsx`.
 *
 * `loading.tsx` otomatis menjadi batas `<Suspense>`, jadi shell halaman
 * (header, navigasi, brand) langsung tampil sementara data diambil. Ini
 * memenuhi PRD §3.1 AC: elemen kritikal tampil di bawah 2,5 detik walau
 * backend lambat — `api.ts` punya timeout 8 detik, jadi tanpa skeleton
 * pengguna akan melihat layar kosong selama itu.
 */
export default function RootLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="py-10 tablet:py-14">
      <span className="sr-only">Memuat halaman…</span>

      <div className="mx-auto w-full max-w-[1400px] px-4 tablet:px-8 desktop:px-12">
        <div className="h-4 w-40 rounded bg-surface-paper" />
        <div className="mt-3 h-10 w-full max-w-lg rounded-md bg-surface-sage" />
        <div className="mt-3 h-5 w-full max-w-xl rounded bg-surface-paper" />
      </div>

      <div
        className="mx-auto mt-8 w-full max-w-[1400px] px-4 tablet:px-8 desktop:px-12"
        aria-hidden="true"
      >
        <div className="h-64 rounded-lg border border-border-soft bg-surface-white" />
      </div>
    </div>
  );
}
