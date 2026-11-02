"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

import { Button, buttonClass } from "@/components/ui/Button";
import { formatHarga, pluralItem } from "@/lib/format";
import type { CartItem, CartSummary as CartSummaryData } from "@/lib/types";
import { GuestCheckoutForm } from "./GuestCheckoutForm";

export interface CartCheckoutHubProps {
  items: CartItem[];
  summary: CartSummaryData;
  isLoggedIn: boolean;
  blockedReason?: string | null;
  blockedLength: number;
  shippingNote?: string;
}

export function CartCheckoutHub({
  items,
  summary,
  isLoggedIn,
  blockedReason,
  blockedLength,
  shippingNote,
}: CartCheckoutHubProps) {
  const [activeTab, setActiveTab] = useState<"wa" | "online">(
    isLoggedIn ? "online" : "wa",
  );

  const totalLabel = formatHarga(summary.subtotal, summary.subtotal_display);

  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    current: "wa" | "online",
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab = current === "wa" ? "online" : "wa";
      setActiveTab(nextTab);
      const nextElement = document.getElementById(
        nextTab === "wa" ? "tab-wa" : "tab-online",
      );
      nextElement?.focus();
    }
  };

  return (
    <aside
      aria-labelledby="hub-summary-title"
      className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6 desktop:sticky desktop:top-24"
    >
      {/* 1. Compact Summary Header */}
      <div className="border-b border-border-soft pb-4">
        <div className="flex items-center justify-between">
          <h2
            id="hub-summary-title"
            className="text-title-lg font-bold text-text-primary"
          >
            Ringkasan pesanan
          </h2>
          <span className="text-label-sm font-medium text-text-secondary">
            {pluralItem(summary.item_count)}
          </span>
        </div>

        <dl className="mt-3 space-y-2 text-body-sm">
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Subtotal</dt>
            <dd className="font-semibold text-text-primary">{totalLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Ongkos kirim</dt>
            <dd className="font-medium text-text-secondary">
              {shippingNote ?? "Dihitung saat konfirmasi"}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-baseline justify-between border-t border-border-soft/60 pt-3">
          <div>
            <p className="text-label-md font-semibold text-text-primary">
              Total sementara
            </p>
            <p className="text-caption text-text-secondary">
              Belum termasuk ongkos kirim
            </p>
          </div>
          <p className="text-headline-sm font-bold text-brand-forest">
            {totalLabel}
          </p>
        </div>
      </div>

      {/* Peringatan Stok (jika ada barang bermasalah) */}
      {blockedReason ? (
        <div
          role="alert"
          id="checkout-blocked-alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-feedback-warn/40 bg-surface-paper p-3 text-label-sm font-semibold leading-relaxed text-feedback-warn"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-feedback-warn text-[10px] font-bold text-surface-white"
          >
            !
          </span>
          <span>{blockedReason}</span>
        </div>
      ) : null}

      {/* 2. Segmented Channel Switcher */}
      <div
        role="tablist"
        aria-label="Pilihan Jalur Pemesanan"
        className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-border-soft bg-surface-paper p-1"
      >
        <button
          id="tab-wa"
          type="button"
          role="tab"
          aria-selected={activeTab === "wa"}
          aria-controls="tabpanel-wa"
          tabIndex={activeTab === "wa" ? 0 : -1}
          onClick={() => setActiveTab("wa")}
          onKeyDown={(e) => handleTabKeyDown(e, "wa")}
          className={[
            "flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-label-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest",
            activeTab === "wa"
              ? "border border-border-soft/80 bg-surface-white text-brand-forest shadow-xs"
              : "text-text-secondary hover:text-text-primary",
          ].join(" ")}
        >
          <span>Lewat WhatsApp</span>
        </button>

        <button
          id="tab-online"
          type="button"
          role="tab"
          aria-selected={activeTab === "online"}
          aria-controls="tabpanel-online"
          tabIndex={activeTab === "online" ? 0 : -1}
          onClick={() => setActiveTab("online")}
          onKeyDown={(e) => handleTabKeyDown(e, "online")}
          className={[
            "flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-label-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest",
            activeTab === "online"
              ? "border border-border-soft/80 bg-surface-white text-brand-forest shadow-xs"
              : "text-text-secondary hover:text-text-primary",
          ].join(" ")}
        >
          <span>Bayar Online</span>
        </button>
      </div>

      {/* 3. Active Channel Content */}
      <div className="mt-4">
        {/* Tab WhatsApp */}
        <div
          id="tabpanel-wa"
          role="tabpanel"
          aria-labelledby="tab-wa"
          hidden={activeTab !== "wa"}
          tabIndex={0}
          className={activeTab === "wa" ? "focus-visible:outline-none" : "hidden"}
        >
          <GuestCheckoutForm items={items} />
        </div>

        {/* Tab Online */}
        <div
          id="tabpanel-online"
          role="tabpanel"
          aria-labelledby="tab-online"
          hidden={activeTab !== "online"}
          tabIndex={0}
          className={
            activeTab === "online"
              ? "space-y-4 focus-visible:outline-none"
              : "hidden"
          }
        >
          {/* Kartu kelebihan checkout online */}
          <div className="space-y-2.5 rounded-lg border border-border-soft bg-surface-paper/70 p-4">
            <h3 className="flex items-center gap-1.5 text-label-md font-semibold text-text-primary">
              <span>Keuntungan Bayar Online</span>
            </h3>
            <ul className="space-y-2 text-body-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-brand-forest" aria-hidden="true">
                  ✓
                </span>
                <span>
                  Pembayaran praktis dan otomatis via Transfer Virtual Account (VA).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-brand-forest" aria-hidden="true">
                  ✓
                </span>
                <span>
                  Hitung ongkos kirim real-time langsung dari berbagai ekspedisi resmi (JNE, J&amp;T).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-brand-forest" aria-hidden="true">
                  ✓
                </span>
                <span>
                  Pantau riwayat, status pesanan, dan nomor resi secara real-time di profil akun.
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Online */}
          {blockedLength > 0 ? (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled
              aria-describedby={
                blockedReason ? "checkout-blocked-alert" : undefined
              }
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
            <div className="space-y-2.5">
              <Link
                href="/masuk?redirect_to=/checkout"
                className={buttonClass({
                  variant: "primary",
                  fullWidth: true,
                  size: "lg",
                })}
              >
                Masuk untuk checkout online
              </Link>
              <p className="text-center text-label-sm text-text-secondary">
                Belum punya akun?{" "}
                <Link
                  href="/daftar?redirect_to=/checkout"
                  className="font-semibold text-brand-forest underline underline-offset-4"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer */}
      <div className="mt-5 border-t border-border-soft pt-3 text-center">
        <Link
          href="/produk"
          className="inline-flex items-center gap-1.5 text-label-sm font-semibold text-text-secondary transition-colors hover:text-brand-forest"
        >
          <span aria-hidden="true">←</span> Lanjut pilih produk lain
        </Link>
      </div>
    </aside>
  );
}
