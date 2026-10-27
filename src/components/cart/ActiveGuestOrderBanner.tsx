"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cancelGuestOrderAction } from "@/actions/storefront";
import { buttonClass } from "@/components/ui/Button";
import { formatHarga } from "@/lib/format";
import type { GuestResultHandoff } from "@/lib/guest-handoff";

const ACTIVE_GUEST_ORDER_KEY = "palorinjani_active_guest_order";
const ACTIVE_ORDER_TTL_MS = 60 * 60 * 1000; // 1 jam

function subscribeStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getActiveOrderSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_GUEST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      handoff: GuestResultHandoff;
      timestamp: number;
    };
    if (
      parsed &&
      parsed.handoff &&
      typeof parsed.timestamp === "number" &&
      Date.now() - parsed.timestamp < ACTIVE_ORDER_TTL_MS
    ) {
      return JSON.stringify(parsed.handoff);
    }
    sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
    return null;
  } catch {
    return null;
  }
}

function getActiveOrderServerSnapshot(): string | null {
  return null;
}

export function ActiveGuestOrderBanner() {
  const storedHandoffJson = useSyncExternalStore(
    subscribeStorage,
    getActiveOrderSnapshot,
    getActiveOrderServerSnapshot,
  );

  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const dialogTitleId = useId();
  const dialogDescId = useId();

  const handoff = useMemo(() => {
    if (!storedHandoffJson || isDismissed) return null;
    try {
      return JSON.parse(storedHandoffJson) as GuestResultHandoff;
    } catch {
      return null;
    }
  }, [storedHandoffJson, isDismissed]);

  // Kelola fokus, scroll, dan tombol ESC saat modal dibuka
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    backButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCancelling) {
        setIsModalOpen(false);
        cancelTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isCancelling]);

  const handleOpenModal = () => {
    setCancelError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isCancelling) return;
    setIsModalOpen(false);
    cancelTriggerRef.current?.focus();
  };

  const handleConfirmCancel = async () => {
    if (!handoff) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const result = await cancelGuestOrderAction({
        orderNumber: handoff.order_number,
        referenceCode: handoff.reference_code,
      });

      if (!result.ok) {
        setCancelError(result.message);
        setIsCancelling(false);
        return;
      }

      // Bersihkan sessionStorage dan sync antar komponen/tab
      try {
        sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Abaikan bila sessionStorage diblokir
      }

      setIsModalOpen(false);
      setIsDismissed(true);
      setNoticeMessage(
        result.data?.message || "Pesanan berhasil dibatalkan dari sistem.",
      );
    } catch {
      setCancelError(
        "Layanan sedang tidak dapat dihubungi. Silakan coba lagi sebentar.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (noticeMessage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mb-8 flex items-center justify-between rounded-xl border border-brand-forest/20 bg-surface-sage/70 p-4 text-body-md text-brand-forest shadow-editorial"
      >
        <span className="font-medium">{noticeMessage}</span>
        <button
          type="button"
          onClick={() => setNoticeMessage(null)}
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          Tutup
        </button>
      </div>
    );
  }

  if (!handoff) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Pesanan Tamu Aktif"
        className="mb-8 overflow-hidden rounded-xl border-2 border-brand-forest bg-surface-paper p-5 shadow-editorial tablet:p-6"
      >
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-surface-sage px-2.5 py-0.5 text-caption font-semibold text-brand-forest">
                Menunggu Konfirmasi CS
              </span>
              {handoff.order_number ? (
                <span className="font-mono text-caption font-bold text-text-primary">
                  {handoff.order_number}
                </span>
              ) : null}
            </div>

            <h3 className="text-title-lg font-bold text-brand-deep">
              Anda memiliki pesanan WhatsApp yang baru dibuat
            </h3>

            <p className="text-body-sm text-text-secondary leading-relaxed max-w-2xl">
              {handoff.notice} Kode referensi:{" "}
              <strong className="font-mono font-bold text-brand-deep">
                {handoff.reference_code}
              </strong>
              {handoff.estimated_total > 0 || handoff.estimated_total_display ? (
                <>
                  {" "}
                  · Estimasi:{" "}
                  <strong className="font-semibold text-brand-forest">
                    {formatHarga(
                      handoff.estimated_total,
                      handoff.estimated_total_display,
                    )}
                  </strong>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={handoff.wa_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ size: "md" })}
            >
              Buka WhatsApp CS
            </a>
            <button
              ref={cancelTriggerRef}
              type="button"
              onClick={handleOpenModal}
              className={buttonClass({ variant: "danger", size: "md" })}
            >
              Batalkan Pesanan
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Pembatalan (WCAG 2.1 AA Compliant) */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCancelling) {
              handleCloseModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescId}
            className="relative w-full max-w-md rounded-xl border border-border-soft bg-surface-white p-6 shadow-editorial-strong space-y-4"
          >
            <div className="space-y-2">
              <h3
                id={dialogTitleId}
                className="text-title-lg font-bold text-feedback-error"
              >
                Batalkan Pesanan Ini?
              </h3>
              <p
                id={dialogDescId}
                className="text-body-md text-text-secondary leading-relaxed"
              >
                Pesanan{" "}
                {handoff.order_number ? (
                  <strong className="font-mono text-text-primary">
                    {handoff.order_number}
                  </strong>
                ) : (
                  "ini"
                )}{" "}
                (Kode:{" "}
                <strong className="font-mono text-text-primary">
                  {handoff.reference_code}
                </strong>
                ) akan dibatalkan di sistem backend dan dashboard admin, serta tidak akan diproses lebih lanjut oleh Customer Service. Tindakan ini tidak dapat diurungkan.
              </p>
            </div>

            {cancelError ? (
              <div
                role="alert"
                className="rounded-md bg-feedback-error-soft p-3 text-label-sm font-medium text-feedback-error"
              >
                {cancelError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 tablet:flex-row tablet:justify-end">
              <button
                ref={backButtonRef}
                type="button"
                disabled={isCancelling}
                onClick={handleCloseModal}
                className={buttonClass({ variant: "outline", size: "md" })}
              >
                Batal / Kembali
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className={buttonClass({ variant: "danger", size: "md" })}
              >
                {isCancelling ? "Membatalkan…" : "Ya, Batalkan Pesanan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
