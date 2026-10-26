"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/Button";

interface PaymentRedirectCardProps {
  paymentUrl: string;
  orderNumber: string;
}

const TOTAL_DURATION_MS = 3000;
const TICK_INTERVAL_MS = 100;

function subscribeStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function checkAlreadyRedirected(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/**
 * Kartu transisi pengalihan pembayaran otomatis ke DOKU Checkout.
 *
 * Menerapkan pola UX Guard:
 * - Kunjungan pertama: countdown 3 detik dengan progress bar halus menuju DOKU,
 *   dan tombol tunggal "Bayar Sekarang →".
 * - Anti-loop via `sessionStorage`: jika pembeli menekan tombol BACK di peramban dari DOKU,
 *   countdown tidak berulang otomatis, melainkan masuk ke mode manual dengan tombol
 *   "Lanjutkan Pembayaran →" dan badge "Menunggu Pembayaran".
 * - Penanganan bfcache: mendengarkan event `pageshow` saat dipulihkan dari Back-Forward Cache
 *   agar state tombol dan trigger ref tidak membeku di status redirecting.
 */
export function PaymentRedirectCard({
  paymentUrl,
  orderNumber,
}: PaymentRedirectCardProps) {
  const storageKey = `pmg_redirected_${orderNumber}`;

  const alreadyRedirected = useSyncExternalStore(
    subscribeStorage,
    () => checkAlreadyRedirected(storageKey),
    () => false,
  );

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(TOTAL_DURATION_MS);

  const hasReturned = alreadyRedirected;
  const redirectTriggeredRef = useRef(false);

  // Tangani Back-Forward Cache (bfcache): saat halaman dipulihkan via tombol back/forward,
  // pulihkan status redirecting dan trigger ref agar tombol bayar tidak membeku.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsRedirecting(false);
        redirectTriggeredRef.current = false;
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handlePayNow = useCallback(() => {
    if (redirectTriggeredRef.current) return;
    redirectTriggeredRef.current = true;
    setIsRedirecting(true);

    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Menangani pembatasan kuota storage / mode penyamaran
    }

    window.location.assign(paymentUrl);
  }, [paymentUrl, storageKey]);

  // Countdown timer loop (3 detik)
  useEffect(() => {
    if (hasReturned || isRedirecting) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - TICK_INTERVAL_MS;
        if (next <= 0) {
          clearInterval(interval);
          handlePayNow();
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasReturned, isRedirecting, handlePayNow]);

  const secondsRemaining = Math.max(1, Math.ceil(timeLeftMs / 1000));
  const progressPercent = Math.min(
    100,
    Math.max(0, ((TOTAL_DURATION_MS - timeLeftMs) / TOTAL_DURATION_MS) * 100),
  );

  return (
    <div
      role="region"
      aria-label="Pengalihan Pembayaran DOKU"
      className="overflow-hidden rounded-xl border-2 border-brand-forest bg-surface-white shadow-editorial transition-all"
    >
      {/* Progress bar di bagian atas kartu (hanya aktif pada kunjungan pertama) */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Waktu pengalihan otomatis ke pembayaran"
        className="h-1.5 w-full bg-surface-sage overflow-hidden"
      >
        <div
          className="h-full bg-brand-forest transition-all duration-100 ease-linear"
          style={{ width: `${hasReturned ? 0 : progressPercent}%` }}
        />
      </div>

      <div className="p-5 tablet:p-6">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
          {/* Kolom Informasi & Status */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              {hasReturned ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-paper border border-border-soft px-2.5 py-0.5 text-caption font-medium text-text-secondary">
                  <ClockIcon className="h-3.5 w-3.5" />
                  Menunggu Pembayaran
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sage px-2.5 py-0.5 text-caption font-semibold text-brand-forest">
                  <LockIcon className="h-3.5 w-3.5" />
                  Pembayaran Aman DOKU
                </span>
              )}
            </div>

            <h3 className="font-headline text-headline-sm font-semibold text-brand-deep">
              {isRedirecting
                ? "Membuka Gerbang Pembayaran DOKU…"
                : hasReturned
                  ? "Lanjutkan Pembayaran Anda"
                  : `Mengarahkan ke DOKU dalam ${secondsRemaining} detik`}
            </h3>

            <p className="text-body-sm leading-relaxed text-text-secondary">
              {isRedirecting
                ? "Mohon tunggu sejenak, Anda sedang dialihkan ke sistem pembayaran DOKU Checkout yang aman."
                : hasReturned
                  ? "Anda kembali dari halaman pembayaran. Klik tombol di bawah untuk melanjutkan pembayaran DOKU kapan saja."
                  : "Anda akan dialihkan otomatis ke DOKU Checkout untuk memilih kanal pembayaran (QRIS, Virtual Account, e-wallet, atau kartu kredit)."}
            </p>
          </div>

          {/* Kolom Tombol Aksi Tunggal (Single Primary CTA) */}
          <div className="shrink-0 tablet:self-center">
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isRedirecting}
              className={buttonClass({
                size: "md",
                className: "min-w-[210px] shadow-sm",
              })}
            >
              {isRedirecting ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Membuka DOKU…
                </span>
              ) : hasReturned ? (
                <span className="flex items-center gap-2">
                  Lanjutkan Pembayaran
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Bayar Sekarang
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ikon Inline SVG (WCAG AA compliant, aria-hidden)                           */
/* -------------------------------------------------------------------------- */

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
