/**
 * Indikator langkah checkout.
 *
 * `aria-current="step"` adalah penanda yang benar untuk navigasi bertahap;
 * mockup lama memakai bullet dekoratif tanpa label, sehingga pengguna screen
 * reader tidak tahu di langkah berapa mereka berada.
 *
 * Langkah yang sudah selesai diberi `aria-label` tambahan karena angkanya saja
 * tidak menjelaskan status. Angka langkah juga disembunyikan dari pembaca
 * layar lewat `aria-hidden` supaya tidak dibaca dua kali.
 */
export function CheckoutSteps({
  steps,
  current,
}: {
  steps: ReadonlyArray<{ id: string; label: string }>;
  /** Indeks langkah aktif, berbasis 0. */
  current: number;
}) {
  return (
    <nav aria-label="Langkah checkout" className="min-w-0 w-full">
      <ol className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const state = isDone ? "Selesai" : isCurrent ? "Sedang dikerjakan" : "Belum";

          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label-sm font-semibold",
                  isDone
                    ? "bg-brand-forest text-surface-white"
                    : isCurrent
                      ? "bg-surface-sage text-brand-forest ring-2 ring-brand-forest"
                      : "bg-surface-paper text-text-secondary",
                ].join(" ")}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Langkah ${index + 1} dari ${steps.length}: ${step.label}. Status: ${state}.`}
                className={[
                  "text-label-md",
                  isCurrent
                    ? "font-semibold text-brand-deep"
                    : "text-text-secondary",
                ].join(" ")}
              >
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="hidden h-px flex-1 bg-border-soft tablet:block"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
