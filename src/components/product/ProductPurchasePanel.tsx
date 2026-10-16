"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addSkuToCartAction } from "@/actions/checkout";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { ActionError } from "@/lib/action-result";
import { formatHarga } from "@/lib/format";
import type { ProductDetail, ProductSku } from "@/lib/types";

/**
 * Panel pembelian produk.
 *
 * Tiga hal yang menentukan isi komponen ini:
 *
 * 1. **Varian dipilih sebagai SKU, bukan sebagai label bebas.**
 *    `GET /products/{slug}` mengembalikan `variants[]`, atau hanya
 *    `default_sku` untuk produk tanpa varian (PRD §3.2 AC). Menambah ke cart
 *    butuh `sku_id`, jadi alur mockup lama — yang menambah produk tanpa
 *    pernah memilih ukuran — tidak punya jalur yang valid sama sekali.
 * 2. **Batas jumlah mengikuti stok yang benar-benar tersedia.** Keranjang
 *    tidak pernah mengunci stok (PRD §3.4), jadi tidak ada janji "stok
 *    Anda diamankan" di sini.
 * 3. **Tombol tambah nonaktif untuk produk placeholder.** `is_placeholder`
 *    berarti admin belum mengisi data; pemesanan tanpa SKU dan harga
 *    terverifikasi hanya menghasilkan pengalaman yang tidak bisa diselesaikan.
 *    Kita menjelaskan, bukan diam.
 */
/**
 * Batas jumlah ketika angka stok tidak tersedia dari server.
 *
 * Angka ini BUKAN stok sebenarnya. `QuantityStepper` hanya membutuhkan satu
 * angka agar tombol tambah punya batas, jadi nilainya dipilih konservatif dan
 * batasannya ditegaskan di UI di bawah stepper.
 */
const UNKNOWN_STOCK_MAX = 10;

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const skus = product.default_sku ? [product.default_sku] : product.variants;
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(
    skus.length === 1 ? (skus[0]?.id ?? null) : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ActionError | null>(null);
  const [added, setAdded] = useState(false);

  const selected: ProductSku | null =
    skus.find((sku) => sku.id === selectedSkuId) ?? null;
  const isOutOfStock =
    product.is_out_of_stock || selected?.is_out_of_stock === true;
  // Stok per SKU tidak dikirim endpoint detail. `UNKNOWN_STOCK_MAX` dipakai
  // sebagai batas konservatif supaya stepper tetap bisa dipakai, dengan
  // catatan eksplisit di bawahnya.
  const maxQuantity =
    selected?.stock != null
      ? Math.max(selected.stock, 1)
      : UNKNOWN_STOCK_MAX;

  const canAdd =
    !isOutOfStock && !product.is_placeholder && selected !== null && !isPending;

  function handleAdd() {
    if (!selected) return;
    setError(null);
    setAdded(false);
    startTransition(async () => {
      const result = await addSkuToCartAction(selected.id, quantity);
      if (result) {
        setError(result);
        return;
      }
      setAdded(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border-soft pb-5">
        <p className="text-caption uppercase tracking-wider text-text-secondary">
          {product.category?.name ?? "Katalog"}
        </p>
        <h1 className="mt-2 text-headline-sm text-text-primary tablet:text-headline-md">
          {product.name}
        </h1>

        {/*
          `formatHarga` dipakai, bukan `product.price_display` mentah:
          `price_display` bernilai `null` selama admin belum mengisi harga, dan
          merender `null` akan menghasilkan baris harga kosong yang terlihat
          seperti bug. Angka `price_min` yang dirender kalau `price_display`
          kosong adalah nilai yang benar-benar dikirim server.
        */}
        <p className="mt-3 text-title-lg font-semibold text-brand-forest">
          <span className="whitespace-nowrap">
            {formatHarga(product.price_min, product.price_display)}
          </span>
        </p>

        {/*
          Harga per varian boleh berbeda dari `price_display` produk. Begitu
          varian dipilih, harga SKU itu yang ditampilkan — tetap memakai
          `price_display` SKU kalau ada, supaya placeholder admin tidak pernah
          tertimpa angka turunan.
        */}
        {selected?.price_display ? (
          <p className="mt-1 text-caption text-text-secondary">
            Harga varian terpilih: {selected.price_display}
          </p>
        ) : null}

        {product.badge ? (
          <p className="mt-3 inline-flex rounded-full border border-accent-earth/50 bg-surface-paper px-3 py-1 text-caption font-semibold text-feedback-warn">
            {product.badge}
          </p>
        ) : null}

        {isOutOfStock ? (
          <p className="mt-3 inline-flex rounded-full border border-border-soft bg-surface-white px-3 py-1 text-caption font-semibold text-text-secondary">
            Stok habis
          </p>
        ) : null}
      </div>

      {product.short_description ? (
        <p className="text-body-md leading-relaxed text-text-secondary">
          {product.short_description}
        </p>
      ) : null}

      {product.is_placeholder ? (
        <PlaceholderNotice
          title="Detail produk belum diisi admin"
          body="PRD §1.1A melarang memuat contoh produk sebelum katalog asli dikonfirmasi. Nilai di atas ditampilkan apa adanya, dan produk ini belum dapat dipesan karena SKU, harga, dan stoknya belum terverifikasi."
        />
      ) : null}

      {/*
        Varian memakai `<button>` dengan `aria-pressed`, bukan `<label>` berisi
        `<input type="radio">` yang disembunyikan dengan `opacity-0` seperti
        mockup lama. Radio yang disembunyikan begitu saja hilang dari urutan
        tab browser dan tidak pernah diumumkan ke pembaca layar, sehingga
        produk dengan beberapa ukuran praktis tidak bisa dipesan dengan
        keyboard.
      */}
      {skus.length > 1 ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-label-md font-semibold text-text-primary">
            Pilih varian
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {skus.map((sku) => {
              const isSelected = sku.id === selectedSkuId;
              return (
                <button
                  key={sku.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={sku.is_out_of_stock}
                  onClick={() => {
                    setSelectedSkuId(sku.id);
                    setQuantity(1);
                  }}
                  className={[
                    "flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-label-sm transition-colors",
                    isSelected
                      ? "border-brand-forest bg-surface-sage font-semibold text-brand-deep"
                      : "border-border-soft bg-surface-white text-text-primary hover:bg-surface-sage",
                    sku.is_out_of_stock ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                >
                  <span className="min-w-0 truncate">{describeSku(sku)}</span>
                  {sku.is_out_of_stock ? (
                    <span className="shrink-0 text-caption text-text-secondary">
                      Habis
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div>
        <p className="mb-2 text-label-md font-semibold text-text-primary">
          Jumlah
        </p>
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={isOutOfStock ? 1 : maxQuantity}
          label="jumlah pembelian"
          disabled={isOutOfStock || product.is_placeholder}
          itemName={selected ? describeSku(selected) : undefined}
        />

        {/*
          Endpoint detail produk tidak mengirim angka stok per SKU, jadi batas
          jumlah tidak bisa dipastikan dari sisi client. Nilai conservative
          dipakai sebagai placeholder, dan server tetap yang menolak bila
          jumlah melebihi stok sebenarnya (PRD §3.4). Menampilkan
          "Maksimal 10" seolah-olah itu angka pasti akan menyesatkan, jadi
          batasannya dijelaskan di bawah.
        */}
        {selected && selected.stock === null && !isOutOfStock ? (
          <p className="mt-1.5 text-caption text-text-secondary">
            Batas jumlah belum dapat dipastikan dari server. Bila jumlah yang
            dipilih melebihi stok yang tersedia, server akan menolak saat
            pesanan ditambahkan ke keranjang.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          aria-describedby={error ? "pembelian-error" : undefined}
          className={buttonClass({ size: "lg", fullWidth: true })}
        >
          {isPending
            ? "Menambahkan…"
            : product.is_placeholder
              ? "Belum dapat dipesan"
              : isOutOfStock
                ? "Stok habis"
                : "Tambah ke keranjang"}
        </button>

        <Link
          href="/keranjang"
          className={buttonClass({
            variant: "outline",
            size: "lg",
            fullWidth: true,
          })}
        >
          Lihat keranjang
        </Link>
      </div>

      {/*
        `aria-live="polite"`: hasil aksi diumumkan tanpa memindahkan fokus —
        penting karena aksi ini menambah sesuatu di halaman lain (keranjang).
      */}
      <p role="status" aria-live="polite" className="min-h-5 text-caption">
        {added ? "Produk ditambahkan ke keranjang." : null}
      </p>

      {error ? (
        <div id="pembelian-error" role="alert">
          <PlaceholderNotice
            title="Belum bisa ditambahkan"
            body={`${error.message}${
              error.kind === "stock"
                ? " Muat ulang halaman untuk melihat stok terbaru."
                : ""
            }`}
            variant="paper"
          />
        </div>
      ) : null}

      <p className="rounded-md bg-surface-sage/70 p-3 text-caption leading-relaxed text-text-secondary">
        Menambah ke keranjang tidak memblokir stok. Stok divalidasi ulang saat
        checkout, jadi jumlah yang tersedia bisa berubah sebelum pesanan dibuat.
      </p>
    </div>
  );
}

/** Label varian yang bisa dibaca manusia, tanpa mengarang atribut. */
function describeSku(sku: ProductSku): string {
  if (sku.attributes) {
    const values = Object.values(sku.attributes).filter(
      (value) => value.trim().length > 0,
    );
    if (values.length > 0) return values.join(" · ");
  }
  return sku.code.trim().length > 0 ? sku.code : "Varian";
}
