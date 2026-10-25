/**
 * Skeleton `/me`.
 *
 * Bentuknya meniru hasil akhir (kepala halaman, satu blok riwayat, satu blok
 * identitas) supaya tidak ada pergeseran tata letak saat data tiba. `api.ts`
 * punya timeout 8 detik, jadi tanpa skeleton pengguna melihat layar kosong
 * selama itu. `src/app/loading.tsx` sengaja generik, bukan bentuk halaman akun.
 */
export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat akun…</span>

      <div className="border-b border-border-soft bg-surface-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 tablet:px-8 tablet:py-10 desktop:px-12">
          <div aria-hidden="true" className="h-4 w-40 rounded bg-surface-paper" />
          <div
            aria-hidden="true"
            className="mt-4 h-3 w-32 rounded bg-surface-paper"
          />
          <div
            aria-hidden="true"
            className="mt-3 h-10 w-40 rounded bg-surface-sage"
          />
          <div
            aria-hidden="true"
            className="mt-3 h-5 w-full max-w-xl rounded bg-surface-paper"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 tablet:px-8 tablet:py-12 desktop:px-12">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
          <div aria-hidden="true" className="desktop:col-span-8">
            <div className="h-10 w-52 rounded bg-surface-sage" />
            <div className="mt-6 h-64 rounded-lg border border-border-soft bg-surface-white" />
          </div>
          <div aria-hidden="true" className="desktop:col-span-4">
            <div className="h-48 rounded-lg border border-border-soft bg-surface-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
