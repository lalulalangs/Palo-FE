import Link from "next/link";
import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartCheckoutHub } from "@/components/cart/CartCheckoutHub";
import { ActiveGuestOrderBanner } from "@/components/cart/ActiveGuestOrderBanner";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/Button";
import { getCart, getToken } from "@/lib/api";
import { stockStateOf } from "@/lib/cart-stock";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { API_UNAVAILABLE_NOTICE } from "@/lib/placeholders";

/**
 * Keranjang belanja.
 *
 * Menggunakan konsep Unified Checkout Hub: ringkasan pesanan dan dua jalur
 * checkout (WhatsApp dan Bayar Online) terpadu dalam satu panel interaktif
 * yang kompak dan bebas scroll berlebih.
 */
export const metadata: Metadata = buildMetadata({
  title: "Keranjang Belanja",
  description:
    "Rincian produk yang dipilih, dengan dua jalur pemesanan: lanjutkan lewat WhatsApp Customer Service tanpa akun, atau checkout online dengan akun terdaftar.",
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
   * Gerbang checkout. Nama barangnya disebut supaya pengguna
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
        ? `Yuk, cek lagi keranjangmu. Ada produk yang habis dan melebihi sisa stok: ${blockedNames}.`
        : hasKurang
          ? `Yuk, sesuaikan jumlah produk yang melebihi sisa stok: ${blockedNames}.`
          : `Yuk, hapus produk yang sudah habis dari keranjang: ${blockedNames}.`;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHeader
        eyebrow="Ekspedisi dari Senaru"
        title="Keranjang belanja"
        description="Cek kembali produk pilihanmu dan pilih cara belanja yang paling nyaman buatmu."
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
              Yuk, jelajahi katalog dan temukan berbagai produk pilihan idamanmu!
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
              aria-label="Produk di keranjang"
              className="desktop:col-span-7"
            >
              <div className="divide-y divide-border-soft rounded-lg border border-border-soft bg-surface-white">
                {items.map((item) => (
                  <CartLineItem key={item.sku_id} item={item} />
                ))}
              </div>

              <p className="mt-4 rounded-md bg-surface-sage/70 p-3 text-label-sm leading-relaxed text-text-secondary">
                Produk di keranjang belum otomatis terpesan, ya. Yuk, lanjut checkout sekarang biar stok dan harganya aman!
              </p>
            </section>

            {/* ---- Ringkasan & jalur pemesanan (Unified Checkout Hub) ---- */}
            <div className="desktop:col-span-5">
              <CartCheckoutHub
                items={items}
                summary={summary}
                isLoggedIn={Boolean(isLoggedIn)}
                blockedReason={blockedReason}
                blockedLength={blocked.length}
              />
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
