"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { RefObject } from "react";

import { applyVoucherAction } from "@/actions/checkout";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isActionError, type ActionError } from "@/lib/action-result";
import { formatHarga, formatTanggalPendek } from "@/lib/format";
import type { AppliedVoucher, Voucher } from "@/lib/types";

/**
 * Field voucher di langkah pembayaran (`docs/SPEC-VOUCHER-25102026.md`).
 *
 * Aturan yang dijaga:
 * 1. **Angka diskon tidak pernah dihitung klien.** Diskon dan subtotal datang
 *    dari `POST /vouchers/apply`; yang dikirim hanya kode, isi keranjang dibaca
 *    Server Action dari `GET /cart`.
 * 2. **`final_subtotal` bukan "Total".** Voucher hanya memotong subtotal
 *    produk; ongkir tetap ditambahkan di ringkasan. Label di sini wajib
 *    "Subtotal setelah diskon".
 * 3. **Kode yang sudah dipakai jadi chip** (input + tombol hilang) supaya tidak
 *    ada dua angka diskon di layar dan tidak ada `apply` sia-sia terhadap
 *    throttle 10/menit.
 * 4. **Kegagalan voucher tidak memblokir pesanan.** Semua state gagal hanya
 *    memberi tahu; "Buat Pesanan" tetap bisa ditekan tanpa diskon.
 */

const RESULT_ID = "voucher_code-result";

const HINT =
  "Punya kode promo? Masukkan kodenya di sini untuk dapatkan potongan harga belanjaanmu!";

const RATE_LIMIT_COPY =
  "Eits, terlalu banyak mencoba. Tunggu sebentar sekitar satu menit, lalu coba lagi ya.";

const NETWORK_COPY =
  "Kode voucher belum bisa dicek saat ini. Jangan khawatir, kamu tetap bisa lanjut checkout pesananmu!";

export function VoucherField({
  vouchers,
  subtotal,
  applied,
  onAppliedChange,
  disabled = false,
}: {
  vouchers: Voucher[];
  /** Subtotal keranjang yang dirender halaman ini — hanya untuk selisih minimal belanja. */
  subtotal: number;
  applied: AppliedVoucher | null;
  onAppliedChange: (value: AppliedVoucher | null) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isChecking, startChecking] = useTransition();
  const removeRef = useRef<HTMLButtonElement>(null);

  const trimmed = code.trim();
  const found = findVoucher(vouchers, applied?.code ?? trimmed);

  // Tombol yang ditekan hilang dari DOM saat chip muncul — fokus dipindahkan
  // ke tombol "Hapus kode" supaya pengguna keyboard tidak jatuh ke awal halaman.
  useEffect(() => {
    if (applied) removeRef.current?.focus();
  }, [applied]);

  function apply(target: string) {
    const kode = target.trim().toUpperCase();
    if (!kode || isChecking) return;
    setCode(kode);
    setError(null);
    setNotice(null);
    startChecking(async () => {
      const result = await applyVoucherAction(kode);
      if (isActionError(result)) {
        setError(result);
        return;
      }
      onAppliedChange(result);
    });
  }

  function release() {
    const kode = applied?.code ?? trimmed;
    onAppliedChange(null);
    setError(null);
    setCode(kode);
    setNotice(
      kode
        ? `Kode ${kode} dilepas. Diskon tidak lagi dihitung.`
        : "Diskon dilepas.",
    );
  }

  const pause = disabled || isChecking;

  return (
    <div className="space-y-3">
      {applied ? (
        <VoucherChip voucher={applied} onRelease={release} removeRef={removeRef} />
      ) : (
        <div className="flex flex-col gap-2 tablet:flex-row tablet:items-start">
          <div className="tablet:flex-1">
            <Input
              id="voucher_code"
              name="voucher_code"
              label="Kode voucher (opsional)"
              hint={HINT}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={50}
              disabled={pause}
              value={code}
              aria-invalid={error ? true : undefined}
              aria-describedby={`voucher_code-hint ${RESULT_ID}`}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          {/* `mt` menyamakan tinggi tombol dengan kotak input: label 20px + jarak 6px. */}
          <div className="tablet:w-[170px] tablet:shrink-0 tablet:mt-[26px]">
            <Button
              fullWidth
              type="button"
              onClick={() => apply(code)}
              disabled={pause || trimmed.length === 0}
            >
              {isChecking
                ? "Memeriksa kode…"
                : error
                  ? "Coba terapkan lagi"
                  : "Terapkan kode"}
            </Button>
          </div>
        </div>
      )}

      <div
        id={RESULT_ID}
        role={error ? "alert" : "status"}
        aria-live={error ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {error ? (
          <VoucherError error={error} voucher={found} subtotal={subtotal} />
        ) : isChecking ? (
          <p className="text-body-sm text-text-secondary">Memeriksa kode…</p>
        ) : notice ? (
          <p className="text-body-sm text-text-secondary">{notice}</p>
        ) : null}
      </div>

      {vouchers.length > 0 ? (
        <VoucherList vouchers={vouchers} disabled={pause} onUse={apply} />
      ) : (
        <p className="text-body-sm leading-relaxed text-text-secondary">
          Daftar kode sedang tidak dapat dimuat. Kode tetap bisa dimasukkan
          manual.
        </p>
      )}
    </div>
  );
}

/** S3 — kode dipakai: satu sumber kebenaran, angka dari server. */
function VoucherChip({
  voucher,
  onRelease,
  removeRef,
}: {
  voucher: AppliedVoucher;
  onRelease: () => void;
  removeRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="rounded-md border border-brand-forest/40 bg-surface-sage p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-label-md font-semibold text-brand-forest">
          Kode {voucher.code} dipakai.
        </p>
        <button
          ref={removeRef}
          type="button"
          onClick={onRelease}
          aria-label={`Hapus kode ${voucher.code}`}
          className={buttonClass({ variant: "outline", size: "sm" })}
        >
          Hapus kode
        </button>
      </div>
      <p className="mt-1 text-title-md font-semibold text-brand-forest">
        Diskon{" "}
        {formatHarga(voucher.discount_amount, voucher.formatted_discount_amount)}
      </p>
      <p className="text-body-sm text-text-secondary">
        Subtotal setelah diskon{" "}
        {formatHarga(voucher.final_subtotal, voucher.formatted_final_subtotal)}
      </p>
    </div>
  );
}

/**
 * S4–S8 — satu region hasil, isinya berganti, tidak bertumpuk.
 *
 * Selisih minimal belanja dihitung dari daftar `GET /vouchers` karena balasan
 * 422 `apply` tidak membawa subtotal. Kalau kodenya tidak ada di daftar, yang
 * ditampilkan hanya pesan backend apa adanya.
 */
function VoucherError({
  error,
  voucher,
  subtotal,
}: {
  error: ActionError;
  voucher: Voucher | null;
  subtotal: number;
}) {
  const gap = shortfallOf(voucher, subtotal);
  const expired =
    voucher !== null &&
    (isPastDate(voucher.end_date) || /kedaluwarsa|habis/i.test(error.message));

  const title =
    error.kind === "rate-limit"
      ? "Terlalu banyak percobaan"
      : error.kind === "network"
        ? "Layanan tidak dapat dihubungi"
        : error.kind === "voucher" && expired
          ? "Kode sudah tidak berlaku"
          : "Kode belum bisa dipakai";

  const body =
    error.kind === "rate-limit"
      ? RATE_LIMIT_COPY
      : error.kind === "network"
        ? NETWORK_COPY
        : error.message;

  return (
    <div className="rounded-md border border-feedback-error/40 bg-feedback-error-soft/40 p-3">
      <p className="text-label-md font-semibold text-feedback-error">{title}</p>
      <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
        {body}
      </p>

      {gap ? (
        <>
          <p className="mt-2 text-body-sm text-text-secondary">
            Kurang{" "}
            <strong className="font-semibold text-feedback-error">
              {formatHarga(gap, null)}
            </strong>{" "}
            dari minimal{" "}
            {formatHarga(voucher?.min_purchase ?? 0, voucher?.formatted_min_purchase)}
            .
          </p>
          <p className="mt-1 text-body-sm text-feedback-warn">
            Dihitung sesuai isi keranjang belanjaanmu saat ini.
          </p>
        </>
      ) : null}

      {error.kind === "voucher" && expired ? (
        <p className="mt-2 text-body-sm text-text-secondary">
          Coba kode lain dari daftar.
        </p>
      ) : null}
    </div>
  );
}

/** S0 — disclosure daftar kode; native `<details>`, tanpa state JS. */
function VoucherList({
  vouchers,
  disabled,
  onUse,
}: {
  vouchers: Voucher[];
  disabled: boolean;
  onUse: (code: string) => void;
}) {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer items-center text-label-sm font-semibold text-brand-forest">
        <span className="group-open:hidden">Lihat kode yang sedang berlaku</span>
        <span className="hidden group-open:inline">Tutup daftar kode</span>
      </summary>

      <p className="text-body-sm leading-relaxed text-text-secondary">
        Potongan diskon akan otomatis disesuaikan dengan barang yang ada di keranjangmu.
      </p>

      <ul className="mt-2 divide-y divide-border-soft border-y border-border-soft">
        {vouchers.slice(0, 5).map((voucher) => (
          <li
            key={voucher.code}
            className="flex flex-col gap-2 py-3 tablet:flex-row tablet:items-start tablet:justify-between"
          >
            <div className="min-w-0">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-label-md font-semibold text-text-primary">
                  {voucher.code}
                </span>
                {voucher.formatted_value ? (
                  <span className="text-label-sm font-semibold text-brand-forest">
                    {voucher.formatted_value}
                  </span>
                ) : null}
              </p>
              {voucher.description ? (
                <p className="text-body-sm text-text-secondary">
                  {voucher.description}
                </p>
              ) : null}
              {voucher.min_purchase > 0 ? (
                <p className="text-body-sm text-text-secondary">
                  Minimal belanja{" "}
                  {formatHarga(voucher.min_purchase, voucher.formatted_min_purchase)}
                </p>
              ) : null}
              {voucher.end_date ? (
                <p className="text-body-sm text-text-secondary">
                  Berlaku sampai {formatTanggalPendek(voucher.end_date)}
                </p>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={disabled}
              onClick={() => onUse(voucher.code)}
              className="tablet:shrink-0"
            >
              Pakai kode
            </Button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function findVoucher(vouchers: Voucher[], code: string): Voucher | null {
  const target = code.trim().toUpperCase();
  if (!target) return null;
  return vouchers.find((item) => item.code.toUpperCase() === target) ?? null;
}

/** Selisih minimal belanja, hanya bila benar-benar kurang. */
function shortfallOf(
  voucher: Voucher | null,
  subtotal: number,
): number | null {
  if (!voucher || voucher.min_purchase <= 0) return null;
  const gap = voucher.min_purchase - subtotal;
  return gap > 0 ? gap : null;
}

function isPastDate(iso: string | null): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}
