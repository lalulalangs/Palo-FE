"use client";

import { useId, useState } from "react";

interface ProductAccordionProps {
  description: string | null;
}

interface SizeRow {
  size: string;
  chest: string;
  length: string;
  sleeve: string;
}

const SIZE_CHART: SizeRow[] = [
  { size: "S", chest: "52 cm", length: "70 cm", sleeve: "22 cm" },
  { size: "M", chest: "55 cm", length: "72 cm", sleeve: "23 cm" },
  { size: "L", chest: "58 cm", length: "75 cm", sleeve: "24 cm" },
  { size: "XL", chest: "62 cm", length: "78 cm", sleeve: "25 cm" },
];

export function ProductAccordion({ description }: ProductAccordionProps) {
  const baseId = useId();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    description: true,
    sizeChart: false,
    careReturn: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const parsedDescription = parseDescription(description);

  return (
    <div className="w-full divide-y divide-border-soft border-y border-border-soft">
      {/* Seksi 1: Deskripsi & Karakter Bahan */}
      <div className="group">
        <h3>
          <button
            type="button"
            id={`${baseId}-desc-header`}
            aria-controls={`${baseId}-desc-panel`}
            aria-expanded={openSections.description}
            onClick={() => toggleSection("description")}
            className="flex min-h-12 w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest"
          >
            <span className="text-title-sm font-semibold text-text-primary group-hover:text-brand-forest">
              Deskripsi &amp; Karakter Bahan
            </span>
            <span
              className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center text-text-secondary transition-transform duration-200 ease-out ${
                openSections.description ? "rotate-180 text-brand-forest" : ""
              }`}
              aria-hidden="true"
            >
              <ChevronDownIcon />
            </span>
          </button>
        </h3>
        <div
          id={`${baseId}-desc-panel`}
          role="region"
          aria-labelledby={`${baseId}-desc-header`}
          hidden={!openSections.description}
          className={`pb-5 pt-1 text-body-md leading-relaxed text-text-secondary ${
            !openSections.description ? "hidden" : "block"
          }`}
        >
          {parsedDescription ? (
            <div className="space-y-3">
              {parsedDescription.narratives.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}

              {parsedDescription.bullets.length > 0 ? (
                <ul className="mt-3 list-inside list-disc space-y-1.5 pl-1">
                  {parsedDescription.bullets.map((bullet, idx) => (
                    <li key={idx} className="marker:text-brand-forest">
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-text-secondary">
              Detail spesifikasi dan keunggulan bahan untuk produk ini sedang kami
              siapkan. Silakan hubungi Customer Service kami jika ada pertanyaan!
            </p>
          )}
        </div>
      </div>

      {/* Seksi 2: Panduan Ukuran (Size Chart) */}
      <div className="group">
        <h3>
          <button
            type="button"
            id={`${baseId}-size-header`}
            aria-controls={`${baseId}-size-panel`}
            aria-expanded={openSections.sizeChart}
            onClick={() => toggleSection("sizeChart")}
            className="flex min-h-12 w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest"
          >
            <span className="text-title-sm font-semibold text-text-primary group-hover:text-brand-forest">
              Panduan Ukuran (Size Chart)
            </span>
            <span
              className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center text-text-secondary transition-transform duration-200 ease-out ${
                openSections.sizeChart ? "rotate-180 text-brand-forest" : ""
              }`}
              aria-hidden="true"
            >
              <ChevronDownIcon />
            </span>
          </button>
        </h3>
        <div
          id={`${baseId}-size-panel`}
          role="region"
          aria-labelledby={`${baseId}-size-header`}
          hidden={!openSections.sizeChart}
          className={`pb-5 pt-1 ${!openSections.sizeChart ? "hidden" : "block"}`}
        >
          <div className="overflow-x-auto rounded-lg border border-border-soft">
            <table className="w-full border-collapse text-left text-label-sm">
              <thead className="border-b border-border-soft bg-surface-sage/50">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-text-primary">
                    Ukuran
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-text-primary">
                    Lebar Dada
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-text-primary">
                    Panjang Baju
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-text-primary">
                    Panjang Lengan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface-white">
                {SIZE_CHART.map((row) => (
                  <tr key={row.size} className="hover:bg-surface-paper/60 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-brand-deep">
                      {row.size}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{row.chest}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{row.length}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-caption text-text-secondary leading-relaxed">
            * Toleransi ukuran ±1-2 cm.
          </p>
        </div>
      </div>

      {/* Seksi 3: Instruksi Perawatan */}
      <div className="group">
        <h3>
          <button
            type="button"
            id={`${baseId}-care-header`}
            aria-controls={`${baseId}-care-panel`}
            aria-expanded={openSections.careReturn}
            onClick={() => toggleSection("careReturn")}
            className="flex min-h-12 w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest"
          >
            <span className="text-title-sm font-semibold text-text-primary group-hover:text-brand-forest">
              Instruksi Perawatan &amp; Pencucian
            </span>
            <span
              className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center text-text-secondary transition-transform duration-200 ease-out ${
                openSections.careReturn ? "rotate-180 text-brand-forest" : ""
              }`}
              aria-hidden="true"
            >
              <ChevronDownIcon />
            </span>
          </button>
        </h3>
        <div
          id={`${baseId}-care-panel`}
          role="region"
          aria-labelledby={`${baseId}-care-header`}
          hidden={!openSections.careReturn}
          className={`pb-5 pt-1 text-label-sm leading-relaxed text-text-secondary ${
            !openSections.careReturn ? "hidden" : "block"
          }`}
        >
          <ul className="list-inside list-disc space-y-1.5 text-text-secondary">
            <li>Cuci dengan air dingin suhu di bawah 30°C (putaran mesin lembut atau cuci tangan).</li>
            <li>Hindari penggunaan pemutih pakaian berbahan klorin.</li>
            <li>Jemur di area teduh berangin, hindari paparan sinar matahari terik langsung.</li>
            <li>Setrika dengan suhu sedang; balik pakaian dan hindari kontak langsung pada area grafis/sablon.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function parseDescription(desc: string | null): { narratives: string[]; bullets: string[] } | null {
  if (!desc || desc.trim().length === 0) return null;

  const lines = desc.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const narratives: string[] = [];
  const bullets: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      bullets.push(line.replace(/^[-*•]\s*/, ""));
    } else {
      narratives.push(line);
    }
  }

  return { narratives, bullets };
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
