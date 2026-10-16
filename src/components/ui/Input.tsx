import type { ReactNode, TextareaHTMLAttributes } from "react";

/**
 * Primitive input teks/email/password/number.
 *
 * ARSITEKTUR §10: "13 dari 15 file punya `<label>` tanpa `for`" — artinya
 * klik pada label tidak memfokuskan field, dan screen reader tidak
 * mengaitkan label ke field-nya. Karena itu `Input` mewajibkan `id` dan
 * membuat `<label htmlFor>` sendiri, serta menyambungkan `aria-describedby`
 * ke pesan galat.
 */

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "id" | "className" | "size"
  > {
  id: string;
  label: string;
  /** Sembunyikan label secara visual tapi tetap ada untuk screen reader. */
  hideLabel?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
  /** Tambahkan `autoComplete` yang relevan — memengaruhi password manager. */
  trailing?: ReactNode;
}

export const inputClassName =
  "w-full min-h-11 rounded-md border border-border-soft bg-surface-white px-3 py-2 text-body-md text-text-primary placeholder:text-text-secondary/60 transition-colors focus:border-brand-forest focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-feedback-error";

export function Input({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  className,
  trailing,
  ...rest
}: InputProps) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "block text-label-md font-semibold text-text-primary"
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClassName} ${className ?? ""}`}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {trailing}
          </div>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId ?? undefined} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId ?? undefined} className="text-caption font-semibold text-feedback-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
}

export function Textarea({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  className,
  ...rest
}: TextareaProps) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "block text-label-md font-semibold text-text-primary"
        }
      >
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClassName} min-h-24 resize-y ${className ?? ""}`}
        {...rest}
      />
      {hint ? (
        <p id={hintId ?? undefined} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId ?? undefined} className="text-caption font-semibold text-feedback-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
