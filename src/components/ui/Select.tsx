import type { SelectHTMLAttributes } from "react";

import { inputClassName } from "./Input";

/**
 * Primitive `<select>`.
 *
 * `id` + `<label htmlFor>` wajib, sama seperti `Input`, karena audit mockup
 * menemukan majority form control tidak terhubung ke labelnya.
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> {
  id: string;
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  error?: string | null;
  className?: string;
}

export function Select({
  id,
  label,
  hideLabel = false,
  options,
  error,
  className,
  ...rest
}: SelectProps) {
  const errorId = error ? `${id}-error` : null;

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
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? undefined}
        className={`${inputClassName} cursor-pointer ${className ?? ""}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId ?? undefined} className="text-body-sm font-semibold text-feedback-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
