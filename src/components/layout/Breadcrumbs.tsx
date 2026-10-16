import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/jsonld";

/**
 * Breadcrumb visual.
 *
 * Wajib memakai `<ol>` + `aria-current="page"` — mockup lama memakai `<nav>`
 * berisi teks dengan `span` pemisah, sehingga pengguna screen reader tidak
 * tahu posisi mereka di hierarki situs.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Remah roti" className="w-full overflow-x-auto">
      <ol className="flex flex-wrap items-center gap-2 text-label-sm text-text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="font-semibold text-text-primary">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-brand-forest"
                >
                  {item.name}
                </Link>
              )}
              {isLast ? null : (
                <span aria-hidden="true" className="text-border-soft">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
