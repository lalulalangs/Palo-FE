"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createCustomInquiryAction } from "@/actions/storefront";
import { buttonClass } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { fieldError, isActionError } from "@/lib/action-result";
import type { ActionError } from "@/lib/action-result";
import type { GuestWhatsAppResult } from "@/lib/types";

/**
 * Form inquiry grosir / ekspedisi / reseller (PRD §6A).
 *
 * Yang harus dipahami sebelum mengubah:
 * 1. **Ini bukan pesanan.** Tombolnya menyusun pesan WhatsApp ke CS, tanpa
 *    order, tanpa reservasi stok, tanpa pembayaran.
 * 2. **Keranjang tidak dibaca sama sekali.** `items` tidak pernah masuk pesan
 *    WhatsApp, jadi tidak ada `GET /cart`, tidak ada cek stok di sini. Info
 *    produk ditanggung field catatan.
 * 3. **Pesan backend tidak ditampilkan mentah.** `bootstrap/app.php`
 *    meneruskan `ValidationException::getMessage()` apa adanya dalam bahasa
 *    Inggris, dan 429 juga Inggris. Karena itu copy 422/429/5xx ditulis
 *    sendiri di sini; hanya `fieldErrors` per field yang dirender dekat
 *    field-nya.
 */

const CARD =
  "rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-6";

const PREFILL_NOTE =
  "Nama diisi dari akun Anda dan masih bisa diubah. Nomor WhatsApp belum tersimpan di akun, jadi perlu diisi.";

/** Judul + isi untuk setiap kegagalan, tanpa pernah memakai `error.message`. */
function failureCopy(error: ActionError): { title: string; body?: string } {
  switch (error.kind) {
    case "validation":
      return { title: "Periksa kembali isian di bawah ini." };
    case "rate-limit":
      return {
        title: "Terlalu banyak percobaan",
        body: "Tunggu sekitar satu menit, lalu coba lagi.",
      };
    case "network":
      return {
        title: "Layanan sedang tidak dapat dihubungi",
        body: "Pertanyaan Anda belum terkirim — coba lagi sebentar.",
      };
    default:
      // 5xx dan jenis lain: jangan bocorkan pesan mentah server.
      return {
        title: "Pertanyaan belum bisa dikirim",
        body: "Coba lagi sebentar lagi.",
      };
  }
}

export function InquiryForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, isPending] = useActionState(
    createCustomInquiryAction,
    null,
  );
  // Hasil yang sudah ditutup lewat "Tulis pertanyaan lain". Dibandingkan
  // berdasarkan identitas objek: setiap kiriman baru menghasilkan objek baru,
  // jadi panelnya otomatis tampil lagi tanpa state tambahan.
  const [dismissedResult, setDismissedResult] =
    useState<GuestWhatsAppResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const result: GuestWhatsAppResult | null =
    state && state.ok ? state.data : null;
  const error: ActionError | null = isActionError(state) ? state : null;
  const showSuccess = result !== null && result !== dismissedResult;

  // Panel sukses melepas kartu form, jadi tombol yang ditekan hilang dari DOM.
  // Tanpa pemindahan fokus, pengguna keyboard kehilangan posisinya.
  useEffect(() => {
    if (showSuccess) headingRef.current?.focus();
  }, [showSuccess]);

  if (result && showSuccess) {
    return (
      <div
        className={CARD}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-title-md text-brand-deep focus:outline-none"
        >
          Pertanyaan siap dikirim ke WhatsApp
        </h3>

        <p className="mt-4 text-caption text-text-secondary">Kode referensi</p>
        <p className="mt-1 break-words font-mono text-title-lg font-bold tracking-wider text-brand-deep">
          {result.reference_code}
        </p>
        <p className="mt-1 text-caption leading-relaxed text-text-secondary">
          Sebutkan kode ini di awal percakapan supaya Customer Service menemukan
          catatan Anda.
        </p>

        {/*
          Tautan, bukan tab otomatis: `window.open()` setelah `await` diblokir
          popup blocker, dan membuka percakapan tanpa ketukan membuat orang
          mengira pesannya sudah terkirim.
        */}
        <a
          href={result.wa_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ size: "lg", fullWidth: true, className: "mt-6" })}
        >
          Buka WhatsApp dan kirim pesan
        </a>
        <p className="mt-3 text-caption leading-relaxed text-text-secondary">
          Tautan ini membuka percakapan dengan pesan yang sudah terisi. Anda
          tetap perlu menekan tombol kirim di WhatsApp.
        </p>

        {result.notice ? (
          // Keterangan server, bukan janji kita — ditampilkan apa adanya.
          <div className="mt-4 rounded-lg border border-border-soft bg-surface-paper p-4 text-caption leading-relaxed text-text-secondary">
            {result.notice}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setDismissedResult(result);
            // Fokus ke field nama setelah form dirender ulang.
            requestAnimationFrame(() =>
              document.getElementById("inquiry-name")?.focus(),
            );
          }}
          className={buttonClass({
            variant: "outline",
            fullWidth: true,
            className: "mt-6",
          })}
        >
          Tulis pertanyaan lain
        </button>
      </div>
    );
  }

  const copy = error ? failureCopy(error) : null;

  return (
    <form
      action={formAction}
      className={CARD}
    >
      {defaultName ? (
        <p className="mb-4 text-caption leading-relaxed text-text-secondary">
          {PREFILL_NOTE}
        </p>
      ) : null}

      <div className="grid gap-4 tablet:grid-cols-2 tablet:items-start">
        <Input
          id="inquiry-name"
          name="name"
          label="Nama lengkap (wajib)"
          hint="Dipakai Customer Service untuk menyapa Anda."
          autoComplete="name"
          maxLength={100}
          defaultValue={defaultName}
          disabled={isPending}
          error={fieldError(error, "name")}
        />

        <Input
          id="inquiry-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          label="Nomor WhatsApp (wajib)"
          hint="Nomor yang bisa dihubungi untuk membalas pertanyaan ini."
          autoComplete="tel"
          maxLength={30}
          disabled={isPending}
          error={fieldError(error, "phone")}
        />

        <Input
          id="inquiry-quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={10000}
          step={1}
          label="Perkiraan jumlah (opsional)"
          hint="Dalam satuan pcs, antara 1 dan 10.000. Boleh dikosongkan bila belum pasti."
          disabled={isPending}
          error={fieldError(error, "quantity")}
        />

        <Textarea
          id="inquiry-note"
          name="note"
          label="Kebutuhan atau catatan (opsional)"
          hint="Sebutkan produk, ukuran, warna, dan tenggat bila ada. Maksimal 1.000 karakter."
          maxLength={1000}
          disabled={isPending}
          error={fieldError(error, "note")}
        />
      </div>

      {error && copy ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-border-soft bg-surface-paper p-4"
        >
          <p className="text-label-md font-semibold text-feedback-error">
            {copy.title}
          </p>
          {copy.body ? (
            <p className="mt-1 text-caption leading-relaxed text-text-secondary">
              {copy.body}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass({ size: "lg", fullWidth: true, className: "mt-6" })}
      >
        {isPending
          ? "Menyiapkan pesan…"
          : error?.kind === "network"
            ? "Coba kirim lagi"
            : "Kirim pertanyaan lewat WhatsApp"}
      </button>

      <p className="mt-3 text-caption leading-relaxed text-text-secondary">
        Tombol ini menyusun pesan WhatsApp, belum mengirim pertanyaan. Pesan baru
        sampai ke Customer Service setelah Anda menekan kirim di WhatsApp.
      </p>
    </form>
  );
}
