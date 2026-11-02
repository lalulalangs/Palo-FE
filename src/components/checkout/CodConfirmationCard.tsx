"use client";

import { useState } from "react";
import Link from "next/link";
import { formatHarga } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";
import { safeWhatsappUrl } from "@/lib/url";

/**
 * Format nomor telepon 628xxx / 08xxx menjadi format tampilan Indonesia yang ramah (08xx-xxxx-xxxx).
 * Tidak lagi menggunakan fallback dummy hardcode.
 */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  const local = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  if (local.length <= 8) return local;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

/**
 * Helper salin teks ke clipboard dengan dukungan API modern dan fallback execCommand.
 * Bekerja dengan andal di in-app browser (WebView), konteks aman/non-aman, dan mobile.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Gagal (misal: permission denied / WebView pembatasan), coba fallback legacy
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch {
      // execCommand gagal atau tidak didukung di environment
    }
  }

  return false;
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

  // Validasi URL hanya dari domain resmi WhatsApp (wa.me, api.whatsapp.com, web.whatsapp.com)
  const sanitizedWhatsappUrl = safeWhatsappUrl(rawWhatsappUrl);

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

  // Fallback dummy "6281234567890" DIHAPUS TOTAL.
  // Jika tidak ada nomor CS resmi, extractedPhone tetap kosong.
  const displayPhone = extractedPhone ? formatPhoneDisplay(extractedPhone) : "";

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

  // Hanya buat tautan WhatsApp jika sanitizedWhatsappUrl valid ATAU nomor CS tersedia
  const finalWhatsappUrl =
    sanitizedWhatsappUrl ||
    (extractedPhone
      ? `https://wa.me/${extractedPhone}?text=${encodeURIComponent(extractedMessage)}`
      : null);

  const whatsappWebUrl = extractedPhone
    ? `https://web.whatsapp.com/send?phone=${extractedPhone}&text=${encodeURIComponent(
        extractedMessage,
      )}`
    : null;

  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copyMessageError, setCopyMessageError] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copyPhoneError, setCopyPhoneError] = useState(false);

  const handleCopyMessage = async () => {
    if (!extractedMessage) return;
    const ok = await copyToClipboard(extractedMessage);
    if (ok) {
      setCopiedMessage(true);
      setCopyMessageError(false);
      setTimeout(() => setCopiedMessage(false), 2000);
    } else {
      setCopyMessageError(true);
      setTimeout(() => setCopyMessageError(false), 3000);
    }
  };

  const handleCopyPhone = async () => {
    if (!displayPhone) return;
    const ok = await copyToClipboard(displayPhone);
    if (ok) {
      setCopiedPhone(true);
      setCopyPhoneError(false);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopyPhoneError(true);
      setTimeout(() => setCopyPhoneError(false), 3000);
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

        {/* Tombol Utama WhatsApp atau Fallback Kontak CS Resmi */}
        {finalWhatsappUrl ? (
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
        ) : (
          <div className="rounded-lg border border-border-soft bg-surface-paper p-5 text-body-md text-text-secondary">
            <p className="font-semibold text-text-primary">
              Nomor WhatsApp konfirmasi belum tersedia otomatis.
            </p>
            <p className="mt-1">
              Jangan khawatir, pesananmu tetap tersimpan aman. Silakan hubungi tim Customer Service resmi kami melalui halaman kontak untuk mengonfirmasi pesanan ini.
            </p>
            <div className="mt-3">
              <Link
                href="/kontak"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-forest px-5 py-2.5 text-label-md font-semibold text-surface-white transition hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-forest"
              >
                Hubungi Customer Service di Halaman Kontak
              </Link>
            </div>
          </div>
        )}

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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-brand-forest hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  {copiedMessage
                    ? "Tersalin"
                    : copyMessageError
                    ? "Gagal Menyalin Teks"
                    : "Salin Teks Pesanan"}
                </button>
                {copyMessageError ? (
                  <span className="text-caption text-feedback-error" role="alert">
                    Silakan blok dan salin teks di kotak atas secara manual.
                  </span>
                ) : null}
              </div>
            </div>

            {/* Lapis 2 & 3: Salin Nomor CS & WhatsApp Web */}
            <div className="space-y-2 border-t border-border-soft pt-4">
              <span className="block font-medium text-text-primary">
                2. Kirim pesan ke Customer Service kami:
              </span>
              {extractedPhone ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-brand-forest hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    {copiedPhone
                      ? "Tersalin"
                      : copyPhoneError
                      ? "Gagal Menyalin Nomor"
                      : `Salin Nomor CS: ${displayPhone}`}
                  </button>

                  {whatsappWebUrl ? (
                    <a
                      href={whatsappWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-soft bg-surface-white px-4 py-2 text-label-sm font-semibold text-text-primary hover:bg-surface-sage/30 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                    >
                      Buka WhatsApp Web
                    </a>
                  ) : null}

                  {copyPhoneError ? (
                    <span className="text-caption text-feedback-error" role="alert">
                      Silakan catat nomor: {displayPhone}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-md border border-border-soft bg-surface-paper p-3 text-body-sm text-text-secondary">
                  <p>
                    Nomor WhatsApp CS tidak terlampir pada detail pesanan ini. Silakan kunjungi{" "}
                    <Link
                      href="/kontak"
                      className="font-semibold text-brand-forest underline hover:text-brand-deep"
                    >
                      Halaman Kontak Resmi Toko
                    </Link>{" "}
                    untuk terhubung langsung dengan tim kami.
                  </p>
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
