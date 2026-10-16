import type { ElementType, ReactNode } from "react";

/**
 * Kartu generik. Dipakai untuk panel katalog, ringkasan, dan blok info.
 * `as` dipilih sesuai elemen semantik supaya struktur heading tidak kacau
 * untuk screen reader.
 */
export interface CardProps {
  children: ReactNode;
  as?: ElementType;
  tone?: "white" | "paper" | "sage" | "deep" | "none";
  padded?: boolean;
  bordered?: boolean;
  shadow?: boolean;
  className?: string;
  heading?: string;
  headingAs?: "h2" | "h3" | "h4";
  headingId?: string;
}

const TONE_CLASS = {
  white: "bg-surface-white text-text-primary",
  paper: "bg-surface-paper text-text-primary",
  sage: "bg-surface-sage text-text-primary",
  deep: "bg-brand-deep text-surface-paper",
  none: "",
} as const;

export function Card({
  children,
  as,
  tone = "white",
  padded = true,
  bordered = true,
  shadow = false,
  className,
  heading,
  headingAs: Heading = "h2",
  headingId,
}: CardProps) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={[
        TONE_CLASS[tone],
        padded ? "p-5 tablet:p-6" : "",
        bordered ? "border border-border-soft" : "",
        shadow ? "shadow-editorial" : "",
        tone === "deep" && bordered ? "border-brand-forest" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {heading ? (
        <Heading
          id={headingId}
          className={
            tone === "deep"
              ? "text-headline-sm text-surface-white"
              : "text-headline-sm text-text-primary"
          }
        >
          {heading}
        </Heading>
      ) : null}
      {children}
    </Component>
  );
}
