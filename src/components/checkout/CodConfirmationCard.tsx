"use client";

import { useState } from "react";
import { formatHarga } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";
import { safeExternalUrl } from "@/lib/url";

/**
 * Format nomor telepon 628xxx / 08xxx menjadi format tampilan Indonesia yang ramah (08xx-xxxx-xxxx).
 */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "0812-3456-7890";
  const local = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  if (local.length <= 8) return local;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

export function CodConfirmationCard({ order }: { order: OrderDetail }) {
  const refCode =
    order.cod_reference_code ||
    order.payment?.instructions?.cod_reference_code ||
    order.order_number;

  const rawWhatsappUrl =
    order.whatsapp_url ||
    order.payment?.whatsapp_url ||
    order.payment?.instructions?.whatsapp_url ||
    null;

  const sanitizedWhatsappUrl = safeExternalUrl(rawWhatsappUrl);

  let extractedMessage =
    order.whatsapp_message ||
    order.payment?.whatsapp_message ||
    order.payment?.instructions?.whatsapp_message ||
    null;

  let extractedPhone = "";

  if (sanitizedWhatsappUrl) {
    try {
      const parsed = new URL(sanitizedWhatsappUrl);
      if (!extractedMessage) {
        extractedMessage = parsed.searchParams.get("text");
      }
      const phoneParam = parsed.searchParams.get("phone");
      if (phoneParam) {
        extractedPhone = phoneParam.replace(/[^\d]/g, "");
      } else {
        extractedPhone = parsed.pathname.replace(/[^\d]/g, "");
      }
    } catch {
      // Abaikan jika URL tidak standar
    }
  }

  if (!extractedPhone) {
    extractedPhone = "6281234567890";
  }

  const displayPhone = formatPhoneDisplay(extractedPhone);

  if (!extractedMessage) {
    const itemsList =
      order.items && order.items.length > 0
        ? order.items
            .map(
              (item, i) =>
                `${i + 1}. ${item.product_name}${
                  item.variant_name ? ` - ${item.variant_name}` : ""
                } x ${item.quantity} = ${formatHarga(item.subtotal, null)}`,
            )
            .join("\n")
        : `- 1x Pesanan ${refCode}`;

    const addressStr = order.shipping_address
      ? [
          order.shipping_address.street,
          order.shipping_address.district,
          order.shipping_address.city,
          order.shipping_address.province,
          order.shipping_address.postal_code,
        ]
          .filter(Boolean)
          .join(", ")
      : "-";

    extractedMessage = `Halo Admin Palorinjani, saya ingin konfirmasi pesanan COD.

*Kode Order:* ${refCode}

*Detail Pesanan:*
${itemsList}

*Total Tagihan COD: ${formatHarga(order.grand_total, order.grand_total_display)}*

*Data Penerima:*
Nama: ${order.shipping_address?.recipient_name ?? "-"}
No. HP: ${order.shipping_address?.phone ?? "-"}
Alamat: ${addressStr}

Mohon diproses untuk pengiriman. Terima kasih!`;
  }

  const finalWhatsappUrl =
    sanitizedWhatsappUrl ||
    `https://wa.me/${extractedPhone}?text=${encodeURIComponent(extractedMessage)}`;

  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${extractedPhone}&text=${encodeURIComponent(
    extractedMessage,
  )}`;

  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyMessage = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(extractedMessage);
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }
    } catch {
      // Fallback manual bila clipboard API diblokir
    }
  };

  const handleCopyPhone = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayPhone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    } catch {
      // Fallback manual bila clipboard API diblokir
    }
  };

  const totalFormatted = formatHarga(order.grand_total, order.grand_total_display);

  return (
    <section
      aria-label="Konfirmasi Pesanan COD"
      className="overflow-hidden rounded-xl border border-border-soft bg-surface-white shadow-xs"
    >
      {/* Banner Status Atas */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-surface-paper px-5 py-3.5 text-body-sm">
        <span className="flex items-center gap-2 font-semibold text-feedback-warn">
          <span
            className="inline-block h-2 w-2 rounded-full bg-feedback-warn"
            aria-hidden="true"
          />
          Menunggu Konfirmasi WhatsApp
        </span>
        <span className="font-mono text-caption text-text-secondary">
          Ref: <strong className="font-semibold text-text-primary">{refCode}</strong>
        </span>
      </div>

      <div className="space-y-6 p-5 tablet:p-7">
        {/* Heading & Sub-heading */}
        <div>
          <h2 className="text-headline-sm font-bold text-brand-deep tablet:text-headline-md">
            Yeay, pesananmu sudah tercatat! Yuk, selesaikan 1 langkah terakhir.
          </h2>
          <p className="mt-2 text-body-md leading-relaxed text-text-secondary">
            Klik tombol WhatsApp di bawah untuk kirim pesan konfirmasi otomatis ke admin. Begitu terkirim, pesananmu langsung kami kemas dari gudang Senaru!
          </p>
        </div>

        {/* Tombol Utama WhatsApp (Warna Primary Sistem, min-height 52px) */}
        <div>
          <a
            href={finalWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-brand-forest px-6 py-3.5 text-center text-title-md font-bold text-surface-white shadow-sm transition hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 active:scale-[0.99]"
          >
            <span>Konfirmasi Pesanan via WhatsApp 1-Klik</span>
          </a>
        </div>

        {/* Info Penenang Timer 24 Jam */}
        <div className="rounded-lg border border-border-soft border-l-4 border-l-brand-forest bg-surface-paper p-4 text-body-sm leading-relaxed text-text-secondary">
          <p>
            Stok produkmu aman selama <strong className="font-semibold text-text-primary">24 jam</strong> ke depan. Silakan kirim konfirmasi agar pesananmu segera disiapkan.
          </p>
        </div>

        {/* Kotak Info Uang Tunai */}
        <div className="rounded-lg border border-accent-earth/40 bg-surface-sage/20 p-4 text-body-sm leading-relaxed text-text-secondary">
          <p className="font-semibold text-title-sm text-text-primary">
            Siapkan Uang Tunai Pas Saat Kurir Tiba:{" "}
            <span className="font-bold text-brand-forest">{totalFormatted}</span>.
          </p>
          <p className="mt-1">
            Tips: Menyiapkan uang pas akan mempercepat proses serah terima paketmu dengan kurir.
          </p>
        </div>

        {/* Akordeon Bantuan (Fallback 3-Lapis) */}
        <details className="group rounded-lg border border-border-soft bg-surface-white transition">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-body-sm font-semibold text-brand-forest hover:text-brand-deep">
            <span>Kendala membuka WhatsApp otomatis? Klik di sini untuk bantuan manual</span>
            <svg
              className="h-5 w-5 text-text-secondary transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>

          <div className="space-y-4 border-t border-border-soft p-4 text-body-sm text-text-secondary">
            <p>
              Jika tautan WhatsApp di atas tidak membuka aplikasi secara otomatis, kamu dapat mengirimkan konfirmasi secara manual melalui langkah berikut:
            </p>

            {/* Lapis 1: Salin Pesan */}
            <div className="space-y-2">
              <span className="block font-medium text-text-primary">
                1. Salin pesan konfirmasi resmi:
              </span>
              <pre className="max-h-40 overflow-y-auto rounded-md border border-border-soft bg-surface-paper p-3 text-caption font-mono leading-relaxed text-text-secondary whitespace-pre-wrap">
                {extractedMessage}
              </pre>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-brand-forest hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
              >
                {copiedMessage ? "Tersalin" : "Salin Teks Pesanan"}
              </button>
            </div>

            {/* Lapis 2 & 3: Salin Nomor CS & WhatsApp Web */}
            <div className="space-y-2 border-t border-border-soft pt-4">
              <span className="block font-medium text-text-primary">
                2. Kirim pesan ke Customer Service kami:
              </span>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-brand-forest hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  {copiedPhone
                    ? "Tersalin"
                    : `Salin Nomor CS: ${displayPhone}`}
                </button>

                <a
                  href={whatsappWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-text-primary hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  Buka WhatsApp Web
                </a>
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
