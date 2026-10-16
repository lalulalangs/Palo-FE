import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { buttonClass } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/metadata";

/**
 * 404 global.
 *
 * `app/not-found.tsx` di root juga menangani URL yang tidak cocok dengan route
 * mana pun di aplikasi, jadi halaman ini adalah respons untuk "/tidak-ada"
 * maupun "/produk/tidak-ada".
 *
 * `noIndex` wajib: halaman 404 yang terindeks adalah sinyal buruk untuk SEO
 * (PRD §4.4). Next.js juga menyuntikkan `<meta name="robots" content="noindex">`
 * otomatis untuk status 404, tapi kita tidak bergantung pada itu.
 */
export const metadata: Metadata = buildMetadata({
  title: "Halaman tidak ditemukan",
  description:
    "Alamat yang Anda buka tidak tersedia di Palo Mountain Goods. Kembali ke katalog atau hubungi Customer Service.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Container className="py-16 tablet:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-caption uppercase tracking-widest text-accent-earth">
          Error 404
        </p>
        <h1 className="mt-3 text-headline-lg-mobile text-brand-deep tablet:text-headline-lg">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Alamat yang Anda buka tidak tersedia. Katalog mungkin sudah dipindahkan,
          atau tautannya salah ketik.
        </p>

        <div className="mt-8 flex flex-col gap-3 tablet:flex-row tablet:justify-center">
          <Link href="/produk" className={buttonClass({ size: "lg" })}>
            Lihat Katalog
          </Link>
          <Link
            href="/"
            className={buttonClass({ variant: "outline", size: "lg" })}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </Container>
  );
}
