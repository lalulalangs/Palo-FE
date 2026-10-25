"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/actions/storefront";
import { buttonClass } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { stockStateOf } from "@/lib/cart-stock";
import { formatAngka, formatHarga } from "@/lib/format";
import type { CartItem } from "@/lib/types";

/**
 * Satu baris keranjang.
 *
 * Mockup lama memakai tombol `w-8 h-8` (32px) untuk ikon hapus dan stepper
 * 32px, padahal WCAG 2.1 AA mensyaratkan target sentuh minimal 44px
 * (ARSITEKTUR §10). Di sini keduanya lewat primitive yang sudah benar:
 * `QuantityStepper` (44px) dan tombol dengan `min-h-11 min-w-11`.
 *
 * Setiap perubahan jumlah PATCH ke server, bukan hanya state lokal. PRD §3.4:
 * server harus memvalidasi stok real-time saat item diubah, dan
 * `available_stock` = on_hand − reservasi aktif. Menampilkan angka optimistis
 * di layar sambil menunda sinkronisasi hanya memindahkan masalah ke saat
 * checkout.
 */
export function CartLineItem({ item }: { item: CartItem }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adjusted, setAdjusted] = useState<string | null>(null);

  const maxQuantity = Math.max(item.available_stock, 1);
  const state = stockStateOf(item);

  function changeQuantity(next: number, announce = false) {
    setError(null);
    setAdjusted(null);
    startTransition(async () => {
      const result = await updateCartItemAction(item.sku_id, next);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (announce) setAdjusted(`Jumlah disesuaikan menjadi ${next}.`);
    });
  }

  function remove() {
    setError(null);
    setAdjusted(null);
    startTransition(async () => {
      const result = await removeCartItemAction(item.sku_id);
      if (!result.ok) setError(result.message);
    });
  }

  const productHref = item.product_slug
    ? `/produk/${item.product_slug}`
    : null;

  return (
    <article
      className={[
        "flex flex-col gap-4 p-4 transition-opacity tablet:flex-row tablet:items-start tablet:p-5",
        isPending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-md border border-border-soft bg-surface-sage tablet:w-28">
        <ImageWithFallback
          src={item.image}
          alt={item.product_name}
          fill
          sizes="7rem"
          className="object-cover object-center"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption text-text-secondary">
              {item.sku_code}
            </p>
            <h3 className="mt-0.5 text-title-md text-text-primary">
              {productHref ? (
                <Link
                  href={productHref}
                  className="rounded-sm underline-offset-4 hover:text-brand-forest hover:underline"
                >
                  {item.product_name}
                </Link>
              ) : (
                item.product_name
              )}
            </h3>
            {item.variant_name ? (
              <p className="mt-1 text-caption text-text-secondary">
                Varian: {item.variant_name}
              </p>
            ) : null}
          </div>

          {/*
            Tombol hapus ikon-only, jadi WAJIB `aria-label` yang menyebut
            produk — audit mockup menemukan 46 dari 50 kontrol ikon-only tanpa
            nama aksesibel.
          */}
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            aria-label={`Hapus ${item.product_name} dari keranjang`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border-soft text-text-secondary transition-colors hover:border-feedback-error hover:text-feedback-error disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path d="M5 7h14" strokeLinecap="round" />
              <path
                d="M9 7V5h6v2M7 7l1 12h8l1-12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {state === "habis" ? (
          <p className="mt-2 rounded-md bg-surface-paper px-3 py-2 text-label-sm font-semibold text-feedback-warn">
            Produk ini sedang tidak tersedia. Hapus dari keranjang agar tidak
            menghambat pemesanan.
          </p>
        ) : null}

        {/*
          Stok turun setelah barang masuk keranjang: server tidak meng-clamp
          `quantity` saat membaca, jadi jumlah di keranjang bisa lebih besar
          dari sisa stok. Pengguna harus diberi tahu angka keduanya, bukan
          hanya "Maksimal N per pesanan".
        */}
        {state === "kurang" ? (
          <div className="mt-2 rounded-md bg-surface-paper px-3 py-2">
            <p className="text-label-sm font-semibold text-feedback-warn">
              Jumlah di keranjang melebihi sisa stok. Kurangi dulu sebelum
              melanjutkan.
            </p>
            <button
              type="button"
              onClick={() => changeQuantity(item.available_stock, true)}
              disabled={isPending}
              className={buttonClass({
                variant: "outline",
                size: "sm",
                className: "mt-2",
              })}
            >
              Sesuaikan ke {formatAngka(item.available_stock)}
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="block text-caption text-text-secondary">
              Harga satuan
            </span>
            <span className="text-title-md font-semibold text-brand-forest">
              {formatHarga(item.unit_price, item.unit_price_display)}
            </span>
          </div>

          <div className="min-w-0">
            <QuantityStepper
              value={item.quantity}
              onChange={changeQuantity}
              max={maxQuantity}
              label={`jumlah ${item.product_name}`}
              disabled={isPending || state === "habis"}
              itemName={item.variant_name ?? item.product_name}
              note={
                state === "kurang"
                  ? // Angka lengkapnya ada di chip di atas; mengulang kalimat
                    // yang sama dua kali di satu baris hanya menambah bising.
                    {
                      text: `Sisa stok ${formatAngka(item.available_stock)}.`,
                      tone: "warn",
                    }
                  : state === "cukup"
                    ? {
                        text: `Sisa stok ${formatAngka(item.available_stock)}.`,
                        tone: "muted",
                      }
                    : // `habis`: tanpa ini stepper menampilkan "Maksimal 1 per
                      // pesanan", angka karangan untuk barang yang stoknya 0.
                      { text: "Stok habis.", tone: "warn" }
              }
            />
          </div>

          <div className="text-right">
            <span className="block text-caption text-text-secondary">
              Subtotal
            </span>
            <span className="text-title-md font-semibold text-text-primary">
              {formatHarga(item.subtotal, item.subtotal_display)}
            </span>
          </div>
        </div>

          {/*
            `aria-live` supaya pesan dari server (mis. "Stok [SKU] tidak
            mencukupi") dan hasil `Sesuaikan ke N` langsung diumumkan begitu
            muncul, tanpa memindahkan fokus.
          */}
        <p role="status" aria-live="polite" className="mt-2 text-caption">
          {error ? <span className="text-feedback-error">{error}</span> : null}
          {adjusted ? (
            <span className="text-text-primary">{adjusted}</span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
