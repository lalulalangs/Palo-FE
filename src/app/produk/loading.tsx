/**
 * Skeleton katalog.
 *
 * Bentuknya sengaja meniru hasil akhir — sidebar filter + grid 3 kolom — agar
 * tidak ada pergeseran tata letak setelah data tiba. `api.ts` punya timeout 8
 * detik, jadi tanpa skeleton pengguna akan melihat layar kosong terlalu lama
 * (PRD §3.1 AC: elemen kritikal harus tampil di bawah 2,5 detik).
 */
export default function CatalogLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat katalog…</span>

      <div className="border-b border-border-soft bg-surface-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 tablet:px-8 tablet:py-10 desktop:px-12">
          <div className="h-4 w-48 rounded bg-surface-paper" />
          <div className="mt-3 h-10 w-full max-w-lg rounded-md bg-surface-sage" />
          <div className="mt-3 h-5 w-full max-w-xl rounded bg-surface-paper" />
          <div className="mt-6 h-11 w-full rounded-md border border-border-soft bg-surface-paper" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 tablet:px-8 tablet:py-12 desktop:px-12">
        <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
          <div className="space-y-4 desktop:col-span-4">
            <div className="flex gap-2">
              <div className="h-11 w-24 rounded-full bg-surface-sage" />
              <div className="h-11 w-28 rounded-full bg-surface-sage" />
            </div>
            <div className="h-11 w-full rounded-md bg-surface-white" />
            <div className="flex gap-2">
              <div className="h-11 w-20 rounded-full bg-surface-sage" />
              <div className="h-11 w-20 rounded-full bg-surface-sage" />
            </div>
          </div>

          <div className="desktop:col-span-8">
            <div className="h-5 w-52 rounded bg-surface-paper" />
            <ul className="mt-6 grid grid-cols-2 gap-3 tablet:grid-cols-3 tablet:gap-6">
              {Array.from({ length: 6 }, (_, index) => (
                <li
                  key={index}
                  className="overflow-hidden rounded-lg border border-border-soft bg-surface-white"
                >
                  <div className="aspect-4/5 bg-surface-sage" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-16 rounded bg-surface-paper" />
                    <div className="h-4 w-full rounded bg-surface-paper" />
                    <div className="h-5 w-24 rounded bg-surface-sage" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
