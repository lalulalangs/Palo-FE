import type { ReactNode } from "react";

import { Container } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/jsonld";

/**
 * Kepala halaman yang konsisten.
 *
 * Mockup lama membangun ulang blok yang sama (eyebrow uppercase + H1 +
 * deskripsi) secara berbeda di 7 file, dan 5 di antaranya memakai
 * `<h1>` sebagai wrapper decoration sehingga urutan heading di dokumen tidak
 * masuk akal. Di sini eyebrow = `<p>`, H1 = satu-satunya `<h1>`, dan
 * deskripsi = `<p>`, jadi screen reader punya peta heading yang benar.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border-soft bg-surface-white">
      <Container className="py-8 tablet:py-10">
        {breadcrumbs ? (
          <div className="mb-5">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}

        <div className="flex flex-col gap-6 tablet:flex-row tablet:items-end tablet:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 flex items-center gap-2 text-caption uppercase tracking-widest text-accent-earth">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-earth" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-headline-lg-mobile text-brand-deep tablet:text-headline-lg">
              {title}
            </h1>
            {description ? (
              <div className="mt-3 text-body-md leading-relaxed text-text-secondary">
                {description}
              </div>
            ) : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>

        {children}
      </Container>
    </div>
  );
}

/**
 * Judul seksi dalam badan halaman.
 *
 * Semua halaman memakai `<h1>` untuk kepala halaman, jadi seksi di bawahnya
 * mulai dari `<h2>`. `h3` dipakai untuk sub-seksi (mis. nama varian di dalam
 * kartu produk).
 */
export function SectionHeading({
  title,
  description,
  eyebrow,
  action,
  id,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border-soft pb-4 tablet:flex-row tablet:items-end tablet:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-caption uppercase tracking-widest text-text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id}
          className="mt-1 text-headline-sm text-text-primary tablet:text-headline-md"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-body-md text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
