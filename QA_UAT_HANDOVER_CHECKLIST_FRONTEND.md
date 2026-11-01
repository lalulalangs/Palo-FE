# Dokumen QA Audit & Pre-Handover Verifikasi Storefront Frontend
**Palo Mountain Goods (`staging.palorinjani.com`)**  
*Audit Awal: 31 Oktober 2026 — QA & Frontend Engineering*  
*Revalidasi Independen: 31 Oktober 2026*

---

## 1. Ringkasan Eksekutif

```
STATUS VERIFIKASI & METRIK (hasil eksekusi ulang, 31 Okt 2026):
- Halaman aplikasi               : 21 halaman (build Next.js 16)
- Komponen UI & Layout           : 54 file .tsx di src/components
- npx tsc --noEmit               : PASS (0 error)
- npm run build                  : PASS (Turbopack)
- npm run lint                   : PASS (0 error, 0 warning)
- Vitest (unit & komponen)       : 49 PASS / 49 (8 file)
- Playwright E2E                 : 8 test terdaftar; TIDAK dijalankan ulang
                                   saat revalidasi (butuh dev server + backend
                                   hidup). File .last-run.json QA sebelumnya
                                   mencatat "passed".
- Kebocoran kredensial           : 0 secret (hanya NEXT_PUBLIC_*)
```

> **Koreksi penting dari versi pertama dokumen ini.** Sebelumnya 11 baris matriks berstatus **PASS** padahal "Metode Verifikasi"-nya menunjuk **file implementasi**, bukan test. Baris-baris itu kini ditandai **MANUAL**, bukan PASS. `AUTH-02` sebelumnya merujuk `action-result.test.ts` yang tidak menguji login sama sekali. Satu test baru ditambahkan untuk `DOKU-01`.

### Hardening yang sudah ada di kode (bukan hasil test)
- Guard hidrasi `useSyncExternalStore` + `typeof window` di `SiteHeader.tsx` dan `PaymentRedirectCard.tsx`.
- `CheckoutFlow.tsx`: tombol submit `disabled` + "Membuat pesanan…" + `router.replace` ke `/checkout/berhasil`.
- `ProductPurchasePanel.tsx`: `isPurchasable`, tombol "Stok habis" `disabled`; `keranjang/page.tsx`: `stockStateOf` memblokir checkout.
- `api.ts`: cookie `palorinjani_token` httpOnly; 401 → sesi `null` tanpa loop.

---

## 2. Matriks Pengujian

Status: **PASS** = ada test otomatis yang dijalankan ulang; **PASS\*** = test ada & hijau pada run QA sebelumnya tetapi tidak dijalankan ulang (butuh server); **PARTIAL** = assertion lebih sempit dari klaim; **MANUAL** = hanya diverifikasi lewat kode/UAT manual.

| ID | Halaman | Skenario | Ekspektasi | Metode Verifikasi | Status |
|:---:|---|---|---|---|:---:|
| AUTH-01 | `/masuk` | Login kredensial sah | Cookie httpOnly `palorinjani_token`, redirect | Kode `src/actions/storefront.ts` (tanpa test) | MANUAL |
| AUTH-02 | `/masuk` | Password salah | Pesan error backend tampil tanpa crash | Kode; `action-result.test.ts` hanya memetakan `ApiError` — **tidak** menguji login | MANUAL |
| AUTH-03 | `/daftar` | Registrasi akun | Token aktif, redirect | Kode `src/actions/storefront.ts` (tanpa test) | MANUAL |
| AUTH-04 | `/daftar` | Konfirmasi password beda | Pesan "Konfirmasi password tidak cocok" | Kode `src/actions/storefront.ts` (tanpa test) | MANUAL |
| AUTH-05 | `/me` | Belum login akses `/me` | Redirect `/masuk?redirect_to=%2Fme` | `e2e/navigation-and-guards.spec.ts` | PASS\* |
| AUTH-06 | `/checkout` | Belum login akses `/checkout` | Halaman edukasi + link `redirect_to=%2Fcheckout` | `e2e/navigation-and-guards.spec.ts` | PASS\* |
| AUTH-07 | Global | Token 401 | `getCurrentUser()` → `null`, arahkan login tanpa loop | Kode `src/lib/api.ts` (tanpa test) | MANUAL |
| CAT-01 | `/produk` | Katalog tampil | Heading + search bar | `e2e/catalog.spec.ts` (hanya heading & placeholder) | PASS\* |
| CAT-02 | `/produk` | Filter kategori & sorting | URL `?sort=price_asc` **dan produk terurut ulang** | `e2e/catalog.spec.ts` hanya cek URL + nilai `<select>`; urutan produk **tidak** di-assert | PARTIAL |
| CAT-03 | `catalog-query` | Param liar | Fallback aman, tanpa error | `src/lib/catalog-query.test.ts` (6 test) | PASS |
| PDP-01 | `/produk/[slug]` | Ganti varian | Harga & stok berubah | Kode `ProductPurchasePanel.tsx` (tanpa test) | MANUAL |
| PDP-02 | `/produk/[slug]` | Semua varian habis | CTA "Stok habis" `disabled` | Kode `ProductPurchasePanel.tsx` (tanpa test) | MANUAL |
| UI-01 | Global | Gambar rusak/null | Placeholder lokal | `ImageWithFallback.test.tsx` (3 test, termasuk event `error`) | PASS |
| CART-01 | `/keranjang` | Status stok baris | `cukup` / `kurang` / `habis` | `src/lib/cart-stock.test.ts` (6 test, batas `qty === available_stock`) | PASS |
| CART-02 | `/keranjang` | Qty > stok terkini | Tombol checkout terkunci + banner | Kode `keranjang/page.tsx` (tanpa test) | MANUAL |
| CART-03 | `/keranjang` | Stepper & hapus | Server Action dipanggil dengan batas stok | Kode `CartLineItem.tsx` (tanpa test) | MANUAL |
| CHK-01 | `/checkout` | Form alamat lengkap | Validasi input, lanjut ke ongkir | `checkout-form.test.ts` hanya `readAddress`; transisi langkah tidak diuji | PARTIAL |
| CHK-02 | `/checkout` | Kurir 503 | Pesan ramah, checkout diblokir | `action-result.test.ts` hanya memetakan 503 → `kind:"courier"`; blokir ada di `CheckoutFlow.tsx` (tanpa test) | PARTIAL |
| CHK-03 | `/checkout` | Matematika ringkasan | 1.050.000 + 45.000 = 1.095.000; voucher 50.000 → 1.045.000 | `CheckoutSummary.test.tsx` (3 test render DOM) | PASS |
| CHK-04 | `/checkout` | Voucher tidak valid | `kind:"voucher"` + error field | `action-result.test.ts` hanya cek `fieldErrors` defined, bukan isi pesan | PARTIAL |
| CHK-05 | `/checkout` | Klik ganda submit | Tombol `disabled` + "Membuat pesanan…" | Kode `CheckoutFlow.tsx` (tanpa test) | MANUAL |
| DOKU-01 | `/checkout/berhasil` | Countdown 3 detik → DOKU | Progress bar, auto-redirect, anti-loop `sessionStorage`, klik ganda 1× redirect | `PaymentRedirectCard.test.tsx` (4 test, **baru**) | PASS |
| DOKU-02 | `/orders/[no]` | Status pesanan | Status resmi + linimasa | Kode `orders/[orderNumber]/page.tsx` (tanpa test) | MANUAL |
| TRACK-01 | `/lacak` | Input nomor pesanan | Linimasa riwayat paket | `e2e/navigation-and-guards.spec.ts` hanya memastikan input terlihat; submit & linimasa **tidak** diuji | PARTIAL |
| SEC-01 | Client | Scan `process.env` | Hanya 4 `NEXT_PUBLIC_*` (site/api/media/maintenance) | `grep -rn process.env src/` | PASS |

---

## 3. Bukti Eksekusi (revalidasi)

### A. Vitest — 8 file / 49 test
```
 ✓ src/lib/cart-stock.test.ts (6)
 ✓ src/lib/catalog-query.test.ts (6)
 ✓ src/lib/checkout-form.test.ts (7)
 ✓ src/lib/format.test.ts (10)
 ✓ src/lib/action-result.test.ts (10)
 ✓ src/components/checkout/CheckoutSummary.test.tsx (3)
 ✓ src/components/checkout/PaymentRedirectCard.test.tsx (4)  ← baru
 ✓ src/components/ui/ImageWithFallback.test.tsx (3)

 Test Files  8 passed (8)
      Tests  49 passed (49)
```

### B. Playwright — 8 test terdaftar (tidak dijalankan ulang)
Butuh `next dev` + backend hidup. Cakupan nyata: smoke homepage, katalog (heading/search), URL sort, cart render, guard `/me` & `/checkout`, input `/lacak`, header nav. **Tidak** menyentuh checkout→DOKU→status pesanan, panel admin, mobile/tablet.

### C. Build & Lint
`npx tsc --noEmit` 0 error; `npm run build` (Turbopack) sukses; `npm run lint` 0 error/0 warning. Peringatan non-blocking: konvensi `middleware` deprecated → `proxy`.

---

## 4. Sanity Check Manual & Cross-Device (UAT Live)

1. **Responsif mobile/tablet** (Safari iOS, Chrome Android): burger menu, sticky header, touch target ≥44px, sticky CTA PDP.
2. **Transisi pembayaran DOKU:** checkout nyata → `/checkout/berhasil` → countdown 3 detik → Hosted Payment; uji tombol Back (tidak boleh loop).
3. **Keranjang multi-tab:** update di tab 1, refresh tab 2, qty & subtotal sinkron.
4. **Jalur hybrid WhatsApp** (tamu): isi form → teks terformat → nomor CS resmi.
5. **Mode maintenance:** `NEXT_PUBLIC_MAINTENANCE_MODE="true"` → semua akses publik ke `/maintenance`.
6. **Status pesanan setelah bayar:** buka `/orders/[no]` dari callback DOKU, pastikan status `paid` dan linimasa.

---

## 5. Catatan Revalidasi & Sisa Risiko

| # | Temuan | Status |
|---|---|---|
| R-1 | 11 baris PASS hanya menunjuk file implementasi | Ditandai MANUAL, bukan PASS |
| R-2 | `AUTH-02` merujuk test yang tidak menguji login | Ditandai MANUAL + catatan |
| R-3 | `CAT-02` & `TRACK-01` klaim lebih luas dari assertion e2e | Ditandai PARTIAL |
| R-4 | `CHK-01/02/04` hanya diuji di level unit mapping | Ditandai PARTIAL |
| R-5 | `DOKU-01` tidak punya test | Ditambah `PaymentRedirectCard.test.tsx` (4 test) |
| R-6 | Artefak QA (`e2e/`, `playwright.config.ts`, `vitest.config.mts`, 8 file test, `src/test/`) dulu untracked | **Sudah di-commit** (`9dc078c`; dokumen ini ikut di-commit setelahnya) |
| R-7 | E2E hanya Chromium desktop, tanpa screenshot/mobile project | Sisa risiko; jalankan di staging dengan backend hidup |
| R-8 | Klaim "hydrate & SSR 100% terproteksi" adalah verifikasi kode, bukan test | Tidak diklaim PASS otomatis |

*Dokumen ini adalah bukti QA, bukan jaminan bahwa seluruh klaim versi pertama benar — bagian yang tidak punya bukti otomatis sudah diturunkan statusnya.*
