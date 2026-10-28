import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { buttonClass } from "@/components/ui/Button";
import { getCart, getCurrentUser, getToken, getVoucherList } from "@/lib/api";
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
    "Selesaikan pesanan: pilih alamat, metode pengiriman, dan metode pembayaran. Yuk, tuntaskan belanjaanmu dengan aman dan praktis!",
  path: "/checkout",
  noIndex: true,
});

const EMPTY_ADDRESS: AddressInput = {
  recipient_name: "",
  phone: "",
  street: "",
  destination_id: 0,
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
          title="Yuk, masuk ke akunmu dulu"
          description="Masuk ke akun untuk melanjutkan checkout otomatis dan nikmati kemudahan berbagai metode pembayaran."
          breadcrumbs={[
            { name: "Beranda", href: "/" },
            { name: "Keranjang", href: "/keranjang" },
            { name: "Checkout", href: "/checkout" },
          ]}
        />
        <Container className="py-10 tablet:py-14">
          <div className="mx-auto max-w-2xl">
            <PlaceholderNotice
              title="Masuk ke Akunmu"
              body="Yuk, masuk ke akunmu terlebih dahulu untuk melanjutkan proses checkout dan memilih metode pembayaran favoritmu."
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
              <p className="mt-4 text-body-sm text-text-secondary">
                Setelah masuk, kamu akan langsung diarahkan kembali untuk menyelesaikan pesananmu.
              </p>
            ) : null}
            <p className="mt-4 text-body-sm text-text-secondary">
              Mau belanja lebih praktis tanpa bikin akun? Kamu juga bisa pesan langsung via WhatsApp Customer Service kami, lho!
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

  const [cart, user, vouchers] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getVoucherList(),
  ]);
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
          title="Keranjang belanjamu masih kosong"
          description="Belum ada barang untuk di-checkout. Yuk, temukan koleksi pakaian idamanmu di katalog!"
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
          title="Cek kembali keranjangmu, ya"
          description="Beberapa barang di keranjangmu perlu disesuaikan sebelum melanjutkan checkout."
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
                .join(", ")}. Yuk, sesuaikan di keranjang sebelum melanjutkan.`}
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
        description="Periksa kembali alamat pengiriman dan pilih metode pembayaran favoritmu. Pesananmu siap kami proses!"
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
          userName={user?.name ?? "Akunmu"}
          userEmail={user?.email ?? "Sesi akun aktif"}
          vouchers={vouchers ?? []}
        />
      </Container>
    </>
  );
}
