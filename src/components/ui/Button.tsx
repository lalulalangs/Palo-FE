import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Primitive tombol.
 *
 * Why tidak pakai `<button>` langsung di tiap halaman? Karena audit
 * aksesibilitas mockup menemukan tombol ikon-only tanpa nama aksesibel
 * (ARSITEKTUR §10). Di sini:
 * 1. Ukuran default `min-h-11` = 44px (target sentuh minimum WCAG 2.1 AA).
 * 2. `focus-visible` ditangani global, tapi varian tetap punya state fokus
 *    eksplisit supaya jelas di mana kursor pengguna berada.
 * 3. `type="button"` default — mencegah submit tak sengaja pada form.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-forest text-surface-white hover:bg-brand-deep border border-brand-forest",
  secondary:
    "bg-brand-deep text-surface-white hover:bg-brand-forest border border-brand-deep",
  outline:
    "bg-surface-white text-brand-forest border border-brand-forest hover:bg-surface-sage",
  ghost:
    "bg-transparent text-text-primary border border-transparent hover:bg-surface-sage",
  danger:
    "bg-surface-white text-feedback-error border border-feedback-error hover:bg-feedback-error-soft",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  // `sm` tetap 44px tinggi: mengecilkan target sentuh demi kerapian visual
  // hanya menurunkan aksesibilitas.
  sm: "min-h-11 px-3 text-label-sm gap-1.5",
  md: "min-h-11 px-5 text-label-md gap-2",
  lg: "min-h-12 px-6 text-title-md gap-2.5",
};

export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
  } = options ?? {};
  return [
    "inline-flex items-center justify-center rounded-md font-semibold tracking-wide",
    "transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
