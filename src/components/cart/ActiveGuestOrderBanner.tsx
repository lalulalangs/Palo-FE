"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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

  const handoff = useMemo(() => {
    if (!storedHandoffJson || isDismissed) return null;
    try {
      return JSON.parse(storedHandoffJson) as GuestResultHandoff;
    } catch {
      return null;
    }
  }, [storedHandoffJson, isDismissed]);

  if (!handoff) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Abaikan bila sessionStorage diblokir
    }
    setIsDismissed(true);
  };

  return (
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
            type="button"
            onClick={handleDismiss}
            className={buttonClass({ variant: "outline", size: "md" })}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
