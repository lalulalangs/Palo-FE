"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Link navigasi dengan state aktif.
 *
 * Why `usePathname()`: penanda aktif harus berasal dari URL nyata, bukan
 * dari tebakan saat render di server. Menandai item aktif sebagai
 * placeholder `aria-current="false"` (atau `tabIndex`) akan membingungkan
 * pembaca layar.
 *
 * Button "Kembali" browser adalah pola yang sama, tapi native `Link`
 * lebih cepat untuk prefetch dan tetap bisa di-render server.
 */
export function ActiveLink({
  href,
  children,
  className,
  activeClassName,
  inactiveClassName,
}: {
  href: string;
  children: ReactNode;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`${className} ${isActive ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}
