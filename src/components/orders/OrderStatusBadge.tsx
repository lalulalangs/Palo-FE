import { labelStatusOrder } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

/**
 * Badge status pesanan.
 *
 * Kenapa bukan `ui/Badge`: tone `danger` di sana berwarna netral
 * (`bg-surface-white text-text-secondary`), sehingga status gagal ("Expired",
 * "Dibatalkan") terbaca seperti status biasa. Peta warna di sini sengaja
 * dipisah dan sudah dihitung kontrasnya (WCAG 2.1, ambang 4.5:1 untuk 12 px).
 *
 * Teks selalu ada — warna tidak pernah satu-satunya pembeda (WCAG 1.4.1).
 * Titik hanya dekorasi `aria-hidden`.
 *
 * Status di luar delapan nilai di atas (backend menambah nilai baru) jatuh ke
 * latar paper + `text-text-primary` (bukan `text-secondary` yang hanya 4,45:1
 * di atas paper) dan menampilkan string status mentah — tidak pernah kosong.
 */
const STATUS_TONE: Record<string, string> = {
  menunggu_pembayaran:
    "border-accent-earth/50 bg-surface-paper text-feedback-warn",
  dibayar: "border-border-soft bg-surface-sage text-brand-forest",
  diproses: "border-border-soft bg-surface-sage text-brand-forest",
  dikirim: "border-border-soft bg-surface-sage text-brand-forest",
  selesai: "border-brand-forest bg-brand-forest text-surface-white",
  expired: "border-feedback-error/40 bg-surface-paper text-feedback-error",
  dibatalkan: "border-feedback-error/40 bg-surface-paper text-feedback-error",
  needs_reconciliation:
    "border-accent-earth/50 bg-surface-paper text-feedback-warn",
};

export function OrderStatusBadge({
  status,
  statusLabel,
}: {
  status: OrderStatus;
  /** Label dari server (`OrderSummary.status_label`); frontend hanya fallback. */
  statusLabel?: string | null;
}) {
  const tone =
    STATUS_TONE[status] ?? "border-border-soft bg-surface-paper text-text-primary";
  const text = statusLabel?.trim() || labelStatusOrder(status);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-semibold",
        tone,
      ].join(" ")}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
