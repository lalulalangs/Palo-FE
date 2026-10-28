import Link from "next/link";
import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { GuestCheckoutForm } from "@/components/cart/GuestCheckoutForm";
import { ActiveGuestOrderBanner } from "@/components/cart/ActiveGuestOrderBanner";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClass } from "@/components/ui/Button";
import { getCart, getToken } from "@/lib/api";
import { stockStateOf } from "@/lib/cart-stock";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Keranjang belanja.
 *
 * Dua jalur pemesanan ditampilkan berdampingan, karena PRD §1.1 menetapkan
 * model hybrid: tamu lewat WhatsApp, pelanggan terdaftar lewat pembayaran
 * online. Mockup lama hanya menampilkan dua tombol tanpa menjelaskan apa yang
 * terjadi setelah keduanya ditekan.
 *
 * Yang DIHAPUS dari mockup lama:
 * - Banner "Penyesuaian Stok Terkini … stok pesanan Anda diamankan otomatis
 *   untuk 15 menit". Tidak benar: PRD §3.4 menyatakan keranjang TIDAK pernah
 *   melakukan reservasi stok permanen. reservations baru dibuat saat order
 *   dibuat, dengan masa berlaku mengikuti batas bayar gateway.
 * - "Biaya Penanganan Kemasan: Gratis (Eco-kraft)" — klaim operasional yang
 *   belum dikonfirmasi.
 * - "Garansi Tukar Ukuran 7 Hari" dan "Kirim balik ke Pos Senaru" — milik
 *   OD-07 yang masih terbuka.
 * - "Enkripsi 256-bit" — klaim teknis yang tidak bisa diverifikasi. *
 * `getCart` mengembalikan `null` saat backend mati. Itu dibedakan dari "cart
 * kosong" supaya pengguna tidak melihat "keranjang Anda kosong" padahal
 * sebenarnya server tidak merespons.
 */
export const metadata: Metadata = buildMetadata({
  title: "Keranjang Belanja",
  description:
    "Rincian barang yang dipilih, dengan dua jalur pemesanan: lanjutkan lewat WhatsApp Customer Service tanpa akun, atau checkout online dengan akun terdaftar.",
  path: "/keranjang",
  noIndex: true,
});

export default async function CartPage() {
  const [cart, isLoggedIn] = await Promise.all([getCart(), getToken()]);
  const crumbs = [
    { name: "Beranda", href: "/" },
    { name: "Keranjang", href: "/keranjang" },
  ];

  const cartUnavailable = cart === null;
  const items = cart?.items ?? [];
  const summary = cart?.summary ?? {
    item_count: 0,
    subtotal: 0,
    subtotal_display: "",
  };

  /*
   * Gerbang checkout. Server tidak meng-clamp `quantity` terhadap stok
   * terbaru saat membaca keranjang, dan `/checkout` tidak memeriksa stok
   * sama sekali — jadi satu-satunya tempat menghentikan pengguna sebelum
   * form panjang adalah di sini. Nama barangnya disebut supaya pengguna
   * tidak perlu menebak baris mana yang bermasalah.
   */
  const blocked = items.filter((item) => stockStateOf(item) !== "cukup");
  const hasKurang = blocked.some((item) => stockStateOf(item) === "kurang");
  const hasHabis = blocked.some((item) => stockStateOf(item) === "habis");
  const blockedNames = blocked
    .map((item) => item.product_name)
    .join(", ");
  const blockedReason =
    blocked.length === 0
      ? null
      : hasKurang && hasHabis
        ? `Yuk, cek lagi keranjangmu. Ada barang yang habis dan melebihi sisa stok: ${blockedNames}.`
        : hasKurang
          ? `Yuk, sesuaikan jumlah barang yang melebihi sisa stok: ${blockedNames}.`
          : `Yuk, hapus barang yang sudah habis dari keranjang: ${blockedNames}.`;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHeader
        eyebrow="Ekspedisi dari Senaru"
        title="Keranjang belanja"
        description="Cek kembali barang pilihanmu dan pilih cara belanja yang paling nyaman buatmu."
        breadcrumbs={crumbs}
      />

      <Container className="py-8 tablet:py-12">
        <ActiveGuestOrderBanner />

        {cartUnavailable ? (
          <div className="mb-8">
            <PlaceholderNotice
              title="Keranjang belum dapat dimuat"
              body={API_UNAVAILABLE_NOTICE}
              variant="paper"
            />
          </div>
        ) : null}

        {items.length === 0 && !cartUnavailable ? (
          <div className="mx-auto max-w-xl py-8 text-center">
            <h2 className="text-headline-sm text-text-primary">
              Keranjang belanjamu masih kosong, nih
            </h2>
            <p className="mt-3 text-body-md text-text-secondary">
              Yuk, jelajahi katalog dan temukan berbagai koleksi pakaian idamanmu!
            </p>
            <div className="mt-6 flex flex-col gap-3 tablet:flex-row tablet:justify-center">
              <Link href="/produk" className={buttonClass({ size: "lg" })}>
                Lihat katalog
              </Link>
              <Link
                href="/kontak"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Tanya Customer Service
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 desktop:grid-cols-12 desktop:gap-10">
            {/* ---- Item ---- */}
            <section
              aria-label="Barang di keranjang"
              className="desktop:col-span-7"
            >
              <div className="divide-y divide-border-soft rounded-lg border border-border-soft bg-surface-white">
                {items.map((item) => (
                  <CartLineItem key={item.sku_id} item={item} />
                ))}
              </div>

              <p className="mt-4 rounded-md bg-surface-sage/70 p-3 text-label-sm leading-relaxed text-text-secondary">
                Barang di keranjang belum otomatis terpesan, ya. Yuk, lanjut checkout sekarang biar stok dan harganya aman!
              </p>
            </section>

            {/* ---- Ringkasan & jalur pemesanan ---- */}
            <div className="desktop:col-span-5">
              <CartSummary
                summary={summary}
                blockedReason={blockedReason}
                action={
                  blocked.length > 0 ? (
                    /*
                     * Tombol nonaktif, bukan `Link`: halaman /checkout tidak
                     * memeriksa stok, jadi tautan aktif hanya memindahkan
                     * penolakan ke langkah terakhir.
                     */
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled
                      aria-describedby="checkout-blocked"
                    >
                      {isLoggedIn
                        ? "Lanjut ke checkout online"
                        : "Masuk untuk checkout online"}
                    </Button>
                  ) : isLoggedIn ? (
                    <Link
                      href="/checkout"
                      className={buttonClass({ fullWidth: true, size: "lg" })}
                    >
                      Lanjut ke checkout online
                    </Link>
                  ) : (
                    <Link
                      href="/masuk?redirect_to=/checkout"
                      className={buttonClass({
                        variant: "outline",
                        fullWidth: true,
                        size: "lg",
                      })}
                    >
                      Masuk untuk checkout online
                    </Link>
                  )
                }
              />

              {/*
                Jalur tamu. `desktop:sticky` hanya berlaku di lebar yang cukup
                supaya tidak menutupi daftar item di mobile.
              */}
              <div className="mt-6 rounded-lg border-2 border-brand-forest bg-surface-paper p-5 tablet:p-6 desktop:sticky desktop:top-28">
                <GuestCheckoutForm
                  items={items}
                  variant={isLoggedIn ? "outline" : "primary"}
                />
              </div>

              {!isLoggedIn ? (
                <p className="mt-4 text-label-sm leading-relaxed text-text-secondary">
                  Mau pembayaran otomatis (QRIS, VA, E-Wallet)? Yuk,{" "}
                  <Link
                    href="/daftar?redirect_to=/checkout"
                    className="font-semibold text-brand-forest underline underline-offset-4"
                  >
                    daftar akun
                  </Link>{" "}
                  atau{" "}
                  <Link
                    href="/masuk?redirect_to=/checkout"
                    className="font-semibold text-brand-forest underline underline-offset-4"
                  >
                    masuk
                  </Link>{" "}
                  terlebih dahulu!
                </p>
              ) : null}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
