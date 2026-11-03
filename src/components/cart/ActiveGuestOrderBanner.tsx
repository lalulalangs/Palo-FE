"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cancelGuestOrderAction, getGuestOrderStatusAction } from "@/actions/storefront";
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
  const checkedOrderKeyRef = useRef<string | null>(null);

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

  // Revalidasi status pesanan ringan on-mount
  useEffect(() => {
    let isMounted = true;
    if (!handoff?.order_number || !handoff?.reference_code || isDismissed) {
      return;
    }

    const orderKey = `${handoff.order_number}:${handoff.reference_code}`;
    if (checkedOrderKeyRef.current === orderKey) {
      return;
    }
    checkedOrderKeyRef.current = orderKey;

    const checkStatus = async () => {
      try {
        const result = await getGuestOrderStatusAction({
          orderNumber: handoff.order_number!,
          referenceCode: handoff.reference_code,
        });

        if (!isMounted) return;

        if (!result.ok) {
          // Jika order tidak ditemukan (404)
          const errorMsg = result.message?.toLowerCase() ?? "";
          if (errorMsg.includes("tidak ditemukan")) {
            try {
              sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
              window.dispatchEvent(new Event("storage"));
            } catch {
              // Abaikan bila sessionStorage diblokir
            }
            setIsDismissed(true);
          }
          return;
        }

        const currentStatus = result.data.status;
        if (currentStatus !== "awaiting_confirmation") {
          try {
            sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
            window.dispatchEvent(new Event("storage"));
          } catch {
            // Abaikan bila sessionStorage diblokir
          }
          setIsDismissed(true);

          if (currentStatus === "cancelled") {
            setNoticeMessage("Pesanan ini telah dibatalkan dari sistem.");
          } else if (
            currentStatus === "processing" ||
            currentStatus === "shipped" ||
            currentStatus === "completed"
          ) {
            setNoticeMessage(
              "Pesananmu telah dikonfirmasi dan diproses oleh tim Customer Service kami.",
            );
          }
        }
      } catch {
        // Fail-safe jika jaringan offline saat render awal
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [handoff?.order_number, handoff?.reference_code, isDismissed]);

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

  const handleDismissManual = () => {
    try {
      sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Abaikan bila sessionStorage diblokir
    }
    setIsDismissed(true);
  };

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
        const errorMsg = result.message?.toLowerCase() ?? "";
        const isAlreadyProcessedOrNotAwaiting =
          errorMsg.includes("tidak dalam status menunggu konfirmasi") ||
          errorMsg.includes("sudah diproses") ||
          errorMsg.includes("selesai") ||
          errorMsg.includes("order_already_processed");

        if (isAlreadyProcessedOrNotAwaiting) {
          try {
            sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
            window.dispatchEvent(new Event("storage"));
          } catch {
            // Abaikan bila sessionStorage diblokir
          }
          setIsModalOpen(false);
          setIsDismissed(true);
          setNoticeMessage(
            "Pesananmu sudah diproses atau diselesaikan oleh tim Customer Service kami, sehingga kartu pesanan aktif telah dibersihkan.",
          );
          return;
        }

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
        className="mb-8 flex items-center justify-between border border-brand-forest/20 bg-surface-sage/70 p-4 text-body-md text-brand-forest shadow-editorial"
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
        className="relative mb-8 overflow-hidden border-2 border-brand-forest bg-surface-paper p-5 shadow-editorial tablet:p-6"
      >
        {/* Tombol Tutup / Dismiss Manual */}
        <button
          type="button"
          onClick={handleDismissManual}
          aria-label="Tutup pemberitahuan pesanan"
          className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-sage/60 focus-visible:outline-2 focus-visible:outline-brand-forest transition-colors cursor-pointer"
        >
          <span className="sr-only">Tutup</span>
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex flex-col gap-4 pr-8 tablet:flex-row tablet:items-center tablet:justify-between tablet:pr-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="bg-surface-sage px-2.5 py-0.5 text-caption font-semibold text-brand-forest">
                Menunggu Konfirmasi CS
              </span>
              {handoff.order_number ? (
                <span className="font-mono text-caption font-bold text-text-primary">
                  {handoff.order_number}
                </span>
              ) : null}
            </div>

            <h3 className="text-title-lg font-bold text-brand-deep">
              Kamu punya pesanan WhatsApp yang sedang aktif
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
              Lanjut Chat ke WhatsApp
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
            className="relative w-full max-w-md border border-border-soft bg-surface-white p-6 shadow-editorial-strong space-y-4"
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
                ) akan dibatalkan dan tidak akan diproses lebih lanjut. Tindakan ini tidak dapat dibatalkan, ya.
              </p>
            </div>

            {cancelError ? (
              <div
                role="alert"
                className="bg-feedback-error-soft p-3 text-label-sm font-medium text-feedback-error"
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
                Kembali
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