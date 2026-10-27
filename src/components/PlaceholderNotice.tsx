/**
 * Kotak penjelasan "data belum ada".
 *
 * ARSITEKTUR §4 butir 2: UI menampilkan placeholder jujur saat data belum
 * tersedia, bukan menyembunyikan masalah atau mengisinya dengan contoh.
 * PRD §6A: "Tidak ada produk contoh yang dipublikasikan sebelum admin mengisi
 * data asli."
 *
 * Karena itu komponen ini dipakai di mana pun pemanggilan API berakhir kosong
 * atau gagal — baik karena katalog belum diterbitkan maupun karena backend mati.
 * Bedanya hanya teks yang ditampilkan.
 */
export function PlaceholderNotice({
  title,
  body,
  variant = "sage",
  className = "",
}: {
  title: string;
  body: string;
  /** `sage` = data belum ada, `paper` = server tidak bisa dihubungi. */
  variant?: "sage" | "paper";
  className?: string;
}) {
  return (
    <div
      // `role="status"` supaya pembaca layar tahu isi berubah saat
      // hasil katalog dimuat ulang, tanpa memindahkan fokus pengguna.
      role="status"
      className={[
        "flex gap-3 rounded-lg border border-border-soft p-4",
        variant === "sage" ? "bg-surface-sage" : "bg-surface-paper",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <InfoIcon />
      <div className="min-w-0">
        <p className="text-label-md font-semibold text-brand-deep">{title}</p>
        <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
          {body}
        </p>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="mt-0.5 h-5 w-5 shrink-0 text-brand-forest"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <path d="M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}
