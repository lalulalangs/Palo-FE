"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addSkuToCartAction } from "@/actions/checkout";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { ActionError } from "@/lib/action-result";
import { formatAngka, formatHarga } from "@/lib/format";
import type { ProductDetail, ProductSku, ProductVariant } from "@/lib/types";

/**
 * Panel keputusan PDP.
 *
 * Urutan blok mengikat (ARSITEKTUR §6.1): judul → **satu** baris harga →
 * varian → stok+jumlah → CTA → rute bayar. Varian adalah satu-satunya input
 * yang mengubah apa yang dikirim, jadi pemilihnya wajib, bukan opsional.
 *
 * Aturan data yang dipegang (V1–V13, P1–P7, S1–S8):
 * 1. Sumbu = kunci atribut yang ada di SEMUA varian dan punya ≥2 nilai
 *    berbeda. `color: "Black"` bukan sumbu, `size: M|L` sumbu.
 * 2. ≥2 sumbu → daftar varian yang ada, bukan matriks kombinasi.
 * 3. Harga satu baris milik SKU terpilih; harga berbeda menempel di chip.
 * 4. Stok adalah properti SKU dan **dikirim server** — tidak ada lagi angka
 *    pengganti (`UNKNOWN_STOCK_MAX`) maupun label "Maksimal N per pesanan".
 * 5. Setiap keadaan non-aktif menyebut sebabnya di teks terlihat.
 */

const AXIS_LABEL: Record<string, string> = { size: "Ukuran", color: "Warna" };

const CS_LINK_CLASS =
  "inline-flex min-h-11 items-center text-label-md font-semibold text-brand-forest underline underline-offset-4 transition-colors hover:text-brand-deep";

interface Option {
  /** Nilai radio, unik di dalam grup. */
  key: string;
  variant: ProductVariant;
}

/** Isi satu-satunya region pengumuman (`role="status"`). */
interface Notice {
  text: string;
  /** `true` hanya setelah berhasil menambah: pengumuman memuat tautan. */
  cart: boolean;
}

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const variants = product.variants;
  const allSkus = variants.flatMap((variant) => variant.skus);
  const axes = findAxes(variants);
  const axis = axes.length === 1 ? axes[0] : null;
  const options = buildOptions(variants, axis);
  const showSelector = options.length > 1;

  const defaultSku = allSkus.find(isPurchasable) ?? allSkus[0] ?? null;
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(
    defaultSku?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ActionError | null>(null);

  const selectedSku = allSkus.find((sku) => sku.id === selectedSkuId) ?? null;
  const selectedVariant =
    variants.find((variant) =>
      variant.skus.some((sku) => sku.id === selectedSkuId),
    ) ?? null;
  const hasSku = allSkus.length > 0;
  const hasPurchasable = allSkus.some(isPurchasable);
  const priceMissing = selectedSku
    ? isPriceMissing(selectedSku.price, selectedSku.price_display)
    : isPriceMissing(product.price_min, product.price_display);

  // Urutan blocker = urutan S4 → S3 → S8 di ARSITEKTUR §4.
  const blockedReason: string | null = !hasSku
    ? "Pilihan varian atau ukuran produk ini sedang disiapkan, jadi belum bisa dipesan saat ini."
    : !hasPurchasable
      ? "Yah, semua varian untuk produk ini lagi habis terjual. Cek lagi berkala ya!"
      : product.is_placeholder
        ? "Informasi produk ini lagi disiapkan, jadi belum bisa dipesan saat ini."
        : priceMissing
          ? "Harga produk ini lagi disiapkan, jadi belum bisa dipesan saat ini."
          : null;

  const phrase = selectedVariant
    ? selectionPhrase(axis, selectedVariant)
    : null;
  const constantText = constantAttributes(variants, axes);
  const priceVaries = distinctPrices(allSkus) > 1;
  const groupHasStatus = options.some(
    (option) => !option.variant.skus.some(isPurchasable),
  );

  const stock = selectedSku?.stock ?? null;
  const canAdd =
    blockedReason === null && selectedSku !== null && !isPending;

  const ctaLabel = isPending
    ? "Menambahkan…"
    : blockedReason !== null
      ? hasSku && !hasPurchasable
        ? "Stok habis"
        : "Belum dapat dipesan"
      : showSelector && phrase
        ? `Tambah ${phrase} ke keranjang`
        : "Tambah ke keranjang";

  function select(variant: ProductVariant, sku: ProductSku) {
    setSelectedSkuId(sku.id);
    setQuantity(1);
    setNotice({ text: announcementFor(axis, variant, sku), cart: false });
  }

  function handleAdd() {
    if (!selectedSku) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await addSkuToCartAction(selectedSku.id, quantity);
      if (result) {
        setError(result);
        return;
      }
      setNotice({
        text: `${capitalize(phrase ?? "Varian")} ditambahkan ke keranjang.`,
        cart: true,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* S2 — judul & konteks */}
      <div>
        <p className="text-caption uppercase tracking-wider text-text-secondary">
          {product.category?.name ?? "Katalog"}
        </p>
        <h1 className="mt-2 text-headline-lg-mobile text-text-primary tablet:text-headline-md">
          {product.name}
        </h1>
        {/*
          Atribut bernilai tunggal (mis. "Warna Black") bukan kontrol, tapi
          tetap fakta produk: dirender sebagai teks di sini, bukan sebagai
          chip yang tidak mengontrol apa pun.
        */}
        {constantText ? (
          <p className="mt-2 text-label-sm text-text-secondary">
            {constantText}
          </p>
        ) : null}

        {/* S3 — satu baris harga, selalu milik SKU terpilih */}
        <p className="mt-3 text-title-lg font-semibold text-brand-forest tablet:text-headline-sm">
          <span className="whitespace-nowrap">
            {priceMissing
              ? "Harga belum diatur"
              : selectedSku
                ? formatHarga(selectedSku.price, selectedSku.price_display)
                : formatHarga(product.price_min, product.price_display)}
          </span>
        </p>
      </div>

      {product.is_placeholder ? (
        <PlaceholderNotice
          title="Detail produk lagi disiapkan"
          body="Informasi lengkap dan ketersediaan produk ini sedang kami persiapkan. Cek lagi secara berkala ya!"
        />
      ) : null}

      {/* S4 — varian */}
      {/*
        S4 — varian. Satu sumbu = chip (V6); ≥2 sumbu atau 0 sumbu = daftar
        varian yang benar-benar ada (V4/V5), tidak pernah matriks kombinasi.
      */}
      {showSelector ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-label-md font-semibold text-text-primary">
            {axis ? axisLabel(axis) : "Pilihan"}
          </legend>
          {axis ? (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const available = option.variant.skus.some(isPurchasable);
                const sku =
                  option.variant.skus.find(isPurchasable) ??
                  option.variant.skus[0];
                const statusId = `opsi-${option.key}-status`;
                const value =
                  option.variant.attributes?.[axis]?.trim() ?? option.key;
                return (
                  <label key={option.key} className="relative">
                    <input
                      type="radio"
                      name="varian"
                      value={option.key}
                      className="peer sr-only"
                      checked={selectedVariant?.id === option.variant.id}
                      disabled={!available}
                      onChange={() => sku && select(option.variant, sku)}
                      aria-describedby={statusId}
                    />
                    <span
                      className={chipClass({
                        available,
                        tall: groupHasStatus || priceVaries,
                      })}
                    >
                      <span>{value}</span>
                      {!available ? (
                        <span className="block text-label-sm font-normal">
                          Habis
                        </span>
                      ) : priceVaries && sku ? (
                        <span className="block text-label-sm font-normal">
                          {formatHarga(sku.price, sku.price_display)}
                        </span>
                      ) : null}
                    </span>
                    <span id={statusId} className="sr-only">
                      {available
                        ? "Tersedia"
                        : `${axisLabel(axis)} ${value} habis`}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {options.map((option) => {
                const available = option.variant.skus.some(isPurchasable);
                const sku =
                  option.variant.skus.find(isPurchasable) ??
                  option.variant.skus[0];
                return (
                  <RadioRow
                    key={option.key}
                    name="varian"
                    value={option.key}
                    label={variantLabel(option.variant)}
                    status={available ? "Tersedia" : "Habis"}
                    checked={selectedVariant?.id === option.variant.id}
                    disabled={!available}
                    onSelect={() => sku && select(option.variant, sku)}
                  />
                );
              })}
            </div>
          )}
        </fieldset>
      ) : null}

      {/*
        V8/Bentuk D — satu varian berisi >1 SKU: satu-satunya tempat
        `sku_code` boleh menjadi label pilihan.
      */}
      {selectedVariant && selectedVariant.skus.length > 1 ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-label-md font-semibold text-text-primary">
            Kode SKU
          </legend>
          <div className="flex flex-col gap-2">
            {selectedVariant.skus.map((sku) => (
              <RadioRow
                key={sku.id}
                name="sku"
                value={String(sku.id)}
                label={sku.code.trim().length > 0 ? sku.code : "SKU"}
                status={isPurchasable(sku) ? "Tersedia" : "Habis"}
                checked={sku.id === selectedSkuId}
                disabled={!isPurchasable(sku)}
                onSelect={() => select(selectedVariant, sku)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {/* S5 — stok & jumlah */}
      {selectedSku && selectedVariant && blockedReason === null ? (
        stock !== null ? (
          <div>
            <p className="mb-2 text-label-md font-semibold text-text-primary">
              Jumlah
            </p>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(stock, 1)}
              label={`jumlah ${phrase}`}
              itemName={phrase ?? undefined}
            />
            <p className="mt-1.5 text-label-sm text-text-secondary">
              Sisa {formatAngka(stock)} untuk {phrase}.
            </p>
          </div>
        ) : (
          // S7 — server tidak mengirim angka stok. Tanpa angka, tanpa stepper;
          // keranjang yang memvalidasi terhadap `available_stock` nyata.
          <p className="text-label-sm text-text-secondary">
            Jumlah diatur di keranjang.
          </p>
        )
      ) : null}

      {/* S6 — CTA */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          aria-describedby={blockedReason ? "pembelian-alasan" : undefined}
          className={buttonClass({
            size: "lg",
            fullWidth: true,
            variant: blockedReason ? "blocked" : "primary",
          })}
        >
          {ctaLabel}
        </button>

        {blockedReason ? (
          <p
            id="pembelian-alasan"
            className="text-label-sm leading-relaxed text-text-secondary"
          >
            {blockedReason}
          </p>
        ) : (
          <p className="text-label-sm leading-relaxed text-text-secondary">
            Stok terbatas! Yuk, langsung checkout biar produk incaranmu nggak kehabisan.
          </p>
        )}

        {blockedReason ? (
          <Link href="/kontak" className={CS_LINK_CLASS}>
            {hasSku && !hasPurchasable
              ? "Tanya ketersediaan →"
              : "Tanya Customer Service →"}
          </Link>
        ) : null}

        {/*
          Satu region, satu pengumuman. Perubahan varian diumumkan tanpa
          memindahkan fokus, dan baris harga/stok yang terlihat tidak ikut
          `aria-live` supaya pembaca layar tidak mengumumkan tiga potong
          kalimat untuk satu perubahan.
        */}
        <p
          role="status"
          aria-live="polite"
          className={
            notice?.cart
              ? "text-label-sm text-brand-forest"
              : "sr-only"
          }
        >
          {notice?.text}
          {notice?.cart ? (
            <>
              {" "}
              <Link href="/keranjang" className={CS_LINK_CLASS}>
                Lihat keranjang
              </Link>
            </>
          ) : null}
        </p>

        {error ? (
          <div role="alert">
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
      </div>

      {/* S7 — rute pengiriman & pembayaran */}
      <div className="rounded-xl bg-surface-paper p-4">
        <p className="text-label-sm font-semibold text-brand-deep">
          Pengiriman
        </p>
        <p className="mt-1 text-label-sm leading-relaxed text-text-secondary">
          Ongkos kirim bakal dihitung otomatis sesuai alamat pengirimanmu saat checkout, ya.
        </p>
        <p className="mt-3 text-label-sm font-semibold text-brand-deep">
          Metode Belanja
        </p>
        <p className="mt-1 text-label-sm leading-relaxed text-text-secondary">
          Bebas pilih cara belanja yang paling praktis: Checkout instan &amp; bayar otomatis (QRIS, Virtual Account, E-Wallet) dengan login akun, atau pesan langsung lewat WhatsApp tanpa perlu bikin akun.
        </p>
        <Link href="/keranjang" className={CS_LINK_CLASS}>
          Yuk, cek keranjang belanja →
        </Link>
      </div>
    </div>
  );
}

/** Baris pilihan penuh (Bentuk B & D) — seluruh baris adalah target klik. */
function RadioRow({
  name,
  value,
  label,
  status,
  checked,
  disabled,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  status: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="relative block">
      <input
        type="radio"
        name={name}
        value={value}
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span
        className={[
          "flex min-h-14 items-center justify-between gap-3 rounded-lg px-4 py-3 text-label-md font-semibold transition-colors",
          disabled
            ? "cursor-not-allowed border border-dashed border-border-soft bg-surface-paper text-text-secondary"
            : "border border-brand-pine bg-surface-white text-text-primary hover:bg-surface-sage",
          disabled
            ? ""
            : "peer-checked:border-2 peer-checked:border-brand-forest peer-checked:bg-surface-sage peer-checked:text-brand-deep peer-checked:ring-1 peer-checked:ring-brand-forest peer-checked:ring-inset",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-forest",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="min-w-0">{label}</span>
        <span className="shrink-0 text-label-sm font-normal text-text-secondary">
          {status}
        </span>
      </span>
    </label>
  );
}

/** Chip opsi sumbu tunggal (§3.1): ≥48 px tinggi, 8 px jarak antar chip. */
function chipClass({
  available,
  tall,
}: {
  available: boolean;
  tall: boolean;
}): string {
  return [
    "flex min-w-16 flex-col items-center justify-center rounded-lg px-4 text-label-md font-semibold transition-colors",
    tall ? "min-h-14" : "min-h-12",
    available
      ? "border border-brand-pine bg-surface-white text-text-primary hover:bg-surface-sage"
      : "cursor-not-allowed border border-dashed border-border-soft bg-surface-paper text-text-secondary",
    // Terpilih dibedakan oleh ketebalan border + bobot + isi, bukan hue saja.
    available
      ? "peer-checked:border-2 peer-checked:border-brand-forest peer-checked:bg-surface-sage peer-checked:text-brand-deep peer-checked:ring-1 peer-checked:ring-brand-forest peer-checked:ring-inset"
      : "",
    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-forest",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Satu definisi "bisa dibeli", sama dengan `is_available` server. */
function axisLabel(axis: string): string {
  return AXIS_LABEL[axis] ?? capitalize(axis);
}

function isPurchasable(sku: ProductSku): boolean {
  return sku.is_active !== false && !sku.is_out_of_stock;
}

function isPriceMissing(price: number, display: string | null): boolean {
  return price <= 0 && !(display?.trim().length ?? 0);
}

function distinctPrices(skus: ProductSku[]): number {
  return new Set(skus.map((sku) => sku.price)).size;
}

/** V1: kunci yang ada di semua varian DAN punya ≥2 nilai berbeda. */
function findAxes(variants: ProductVariant[]): string[] {
  const first = variants[0];
  if (!first?.attributes) return [];
  return Object.keys(first.attributes).filter((key) => {
    const values = variants.map((variant) =>
      variant.attributes?.[key]?.trim() ?? "",
    );
    return values.every(Boolean) && new Set(values).size > 1;
  });
}

/**
 * Daftar opsi yang boleh dirender. Varian tanpa SKU dilewati: menampilkan
 * nilainya sebagai chip berarti menawarkan kombinasi yang belum terdaftar.
 */
function buildOptions(
  variants: ProductVariant[],
  axis: string | null,
): Option[] {
  const usable = variants.filter((variant) => variant.skus.length > 0);
  if (!axis) {
    return usable.map((variant) => ({ key: `v${variant.id}`, variant }));
  }
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const variant of usable) {
    const value = variant.attributes?.[axis]?.trim() ?? "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push({ key: `${axis}-${value}`, variant });
  }
  return out;
}

/** Atribut yang tidak bervariasi: fakta produk, bukan kontrol. */
function constantAttributes(
  variants: ProductVariant[],
  axes: string[],
): string {
  const attributes = variants[0]?.attributes;
  if (!attributes) return "";
  return Object.entries(attributes)
    .filter(([key, value]) => {
      if (axes.includes(key)) return false;
      const trimmed = value.trim();
      return (
        trimmed.length > 0 &&
        variants.every(
          (variant) => variant.attributes?.[key]?.trim() === trimmed,
        )
      );
    })
    .map(([key, value]) => `${axisLabel(key)} ${value.trim()}`)
    .join(" · ");
}

/** Label varian saat tidak ada sumbu (V4): atribut, lalu `name`. */
function variantLabel(variant: ProductVariant): string {
  const values = Object.values(variant.attributes ?? {})
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length > 0) return values.join(" · ");
  return variant.name.trim().length > 0 ? variant.name.trim() : "Varian";
}

/** Frasa yang dipakai di label CTA, baris stok, dan pengumuman. */
function selectionPhrase(
  axis: string | null,
  variant: ProductVariant,
): string {
  if (!axis) return variantLabel(variant);
  const value = variant.attributes?.[axis]?.trim() ?? variantLabel(variant);
  return axis === "size"
    ? `ukuran ${value}`
    : `${axisLabel(axis)} ${value}`;
}

function announcementFor(
  axis: string | null,
  variant: ProductVariant,
  sku: ProductSku,
): string {
  const phrase = selectionPhrase(axis, variant);
  const parts = [
    `${capitalize(phrase)} dipilih.`,
    `Harga ${formatHarga(sku.price, sku.price_display)}.`,
  ];
  if (sku.stock !== null) {
    parts.push(`Sisa ${formatAngka(sku.stock)} untuk ${phrase}.`);
  }
  return parts.join(" ");
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}
