import type { ReactNode } from "react";

/**
 * Pembungkus lebar konten.
 *
 * Mockup lama memakai `max-w-[1400px]` dan `max-w-7xl` (=1280px) berbeda
 * antarkolom yang bergantian. Di sini satu container supaya ritme horizontal
 * konsisten dan mudah dibaca mata.
 */
export function Container({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: "wide" | "reading";
  className?: string;
}) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 tablet:px-8 desktop:px-12",
        width === "wide" ? "max-w-[1400px]" : "max-w-3xl",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
