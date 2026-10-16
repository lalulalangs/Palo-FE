import type { ReactNode } from "react";

/**
 * Badge status produk.
 *
 * Only three states exist in the API contract: `is_out_of_stock` and `badge`
 * (admin-provided free text). Mockup lama mengarang lima label tambahan
 * ("Segera Hadir", "Stok Terbatas", "Pre-Order", "Restock berkala", "Ingatkan")
 * yang tidak ada di `KONTRAK-API.md` — jadi semua itu dihapus. Kita hanya
 * menampilkan apa yang benar-benar dikirim backend.
 */
export type BadgeTone = "brand" | "neutral" | "warning" | "danger" | "outline";

const TONE_CLASS: Record<BadgeTone, string> = {
  brand: "bg-surface-sage text-brand-forest border-border-soft",
  neutral: "bg-surface-white text-text-secondary border-border-soft",
  warning: "bg-surface-paper text-feedback-warn border-accent-earth/50",
  danger: "bg-surface-white text-text-secondary border-border-soft",
  outline: "bg-transparent text-text-secondary border-border-soft",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption font-semibold ${TONE_CLASS[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Badge stok: satu-satunya label yang boleh kita karang sendiri. */
export function StockBadge({
  isOutOfStock,
  badge,
}: {
  isOutOfStock: boolean;
  badge: string | null;
}) {
  if (badge) {
    return <Badge tone="warning">{badge}</Badge>;
  }
  if (isOutOfStock) {
    return <Badge tone="danger">Habis</Badge>;
  }
  return null;
}
