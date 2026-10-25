import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { buttonClass } from "@/components/ui/Button";
import { getCart, getCurrentUser, getToken } from "@/lib/api";
import { stockStateOf } from "@/lib/cart-stock";
import type { AddressInput } from "@/lib/checkout-form";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Checkout pelanggan terdaftar (PRD §3.6 – §3.8).
 *
 * **Hanya bisa diakses dengan akun.** `POST /shipping/quote` dan
 * `POST /checkout/orders` dilindungi `auth:sanctum`, jadi tanpa token
 * pemeriksaan di halaman ini tidak akan pernah berhasil. Daripada
 * menampilkan formulir yang pasti ditolak server, pengunjung yang belum masuk
 * diberi tahu dan diarahkan ke `/masuk` dengan `redirect_to` supaya kembali
 * ke sini setelah login.
 *
 * `noIndex`: halaman ini tidak ada nilainya untuk mesin pencari, dan isinya
 * milik satu pengguna.
 */
export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description:
    "Selesaikan pesanan: pilih alamat, metode pengiriman, dan metode pembayaran. Harga dan stok divalidasi ulang oleh server.",
  path: "/checkout",
  noIndex: true,
});

const EMPTY_ADDRESS: AddressInput = {
  recipient_name: "",
  phone: "",
  street: "",
  city_code: "",
  city: "",
  province: "",
  postal_code: null,
  district: null,
  subdistrict: null,
  notes: null,
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_to?: string | string[] }>;
}) {
  const [token, { redirect_to }] = await Promise.all([getToken(), searchParams]);
  const redirectTo =
    typeof redirect_to === "string" ? redirect_to : undefined;

  if (!token) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Masuk untuk melanjutkan"
          description="Checkout online hanya tersedia untuk pelanggan terdaftar, karena itu halaman ini butuh sesi akun yang valid."
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Sesi akun dibutuhkan"
              body="Endpoint ongkir dan pembuatan pesanan hanya menerima permintaan dengan token Sanctum. Masuk terlebih dahulu, lalu Anda akan dikembalikan ke halaman checkout."
            />
            <div className="mt-6 flex flex-col gap-3 tablet:flex-row">
              <Link
                href={`/masuk?redirect_to=${encodeURIComponent("/checkout")}`}
                className={buttonClass({ size: "lg" })}
              >
                Masuk untuk checkout
              </Link>
              <Link
                href="/daftar?redirect_to=%2Fcheckout"
                className={buttonClass({ variant: "outline", size: "lg" })}
              >
                Buat akun
              </Link>
            </div>
            {redirectTo ? (
              <p className="mt-4 text-caption text-text-secondary">
                Anda datang dari halaman{" "}
                <code className="rounded-sm bg-surface-sage px-1 py-0.5">
                  {redirectTo}
                </code>
                . Setelah masuk, sistem akan mengarahkan kembali ke sana bila
                halamannya memang bisa diakses.
              </p>
            ) : null}
            <p className="mt-4 text-caption text-text-secondary">
              Ingin checkout tanpa akun? Keranjang tetap bisa diselesaikan
              lewat WhatsApp Customer Service.
            </p>
            <Link
              href="/keranjang"
              className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand-forest underline underline-offset-4"
            >
              Buka keranjang
            </Link>
          </div>
        </Container>
      </>
    );
  }

  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
  const items = cart?.items ?? [];

  if (!cart) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Checkout belum dapat dibuka"
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Keranjang belum dapat dimuat"
              body={API_UNAVAILABLE_NOTICE}
              variant="paper"
            />
            <Link
              href="/keranjang"
              className={buttonClass({ variant: "outline", className: "mt-6" })}
            >
              Kembali ke keranjang
            </Link>
          </div>
        </Container>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Keranjang masih kosong"
          description="Tidak ada barang untuk di-checkout. Katalog resmi bisa dibuka tanpa akun."
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-xl text-center">
            <Link href="/produk" className={buttonClass({ size: "lg" })}>
              Lihat katalog
            </Link>
          </div>
        </Container>
      </>
    );
  }

  /*
   * Gerbang stok, dipasang di sini juga — bukan hanya di `/keranjang`.
   *
   * `/keranjang` sudah menonaktifkan CTA-nya, tapi halaman ini bisa dibuka
   * langsung lewat URL atau bookmark. Tanpa pemeriksaan ini, `POST
   * /checkout/orders` baru menolak di langkah terakhir setelah pengguna
   * mengisi alamat, memilih kurir, dan memilih metode bayar.
   */
  const blocked = items.filter((item) => stockStateOf(item) !== "cukup");

  if (blocked.length > 0) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Pesanan belum bisa dilanjutkan"
          description="Sebagian barang di keranjang perlu disesuaikan dulu sebelum checkout."
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Ada barang yang perlu disesuaikan"
              body={`Barang berikut habis atau jumlahnya melebihi sisa stok: ${blocked
                .map((item) => item.product_name)
                .join(", ")}. Sesuaikan di keranjang sebelum melanjutkan.`}
              variant="paper"
            />
            <Link
              href="/keranjang"
              className={buttonClass({ variant: "outline", className: "mt-6" })}
            >
              Kembali ke keranjang
            </Link>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout pelanggan terdaftar"
        title="Konfirmasi pengiriman dan pembayaran"
        description="Harga, stok, dan voucher divalidasi ulang oleh server saat pesanan dibuat, memakai nilai terbaru."
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Keranjang", href: "/keranjang" },
          { name: "Checkout", href: "/checkout" },
        ]}
      />

      <Container className="py-8 tablet:py-12">
        <CheckoutFlow
          cart={items}
          defaultAddress={EMPTY_ADDRESS}
          userName={user?.name ?? "Akun Anda"}
          userEmail={user?.email ?? "Sesi akun aktif"}
        />
      </Container>
    </>
  );
}
