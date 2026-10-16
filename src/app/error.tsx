"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { buttonClass } from "@/components/ui/Button";

/**
 * Error boundary global.
 *
 * Wajib `"use client"` karena error boundary harus Client Component
 * (ARSITEKTUR §7).
 *
 * Dua hal yang sengaja TIDAK dilakukan di sini:
 * 1. **Tidak ada `console.error(error)`.** Repo ini melarang `console.log`,
 *    dan tanpa layanan pelaporan error, mencetak ke console hanya membocorkan
 *    detail ke browser pengguna. `error.digest` ditampilkan sebagai kunci
 *    pencocokan dengan log server — aman, karena Next.js menyanitasi pesan
 *    error di produksi sebelum mengirimkannya ke client.
 * 2. **Tidak menampilkan `error.message` di produksi.** Next.js sudah
 *    menggantinya dengan pesan generik plus `digest`, dan menampilkan detail
 *    akan berisiko membocorkan internal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16 tablet:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-caption uppercase tracking-widest text-accent-earth">
          Terjadi kesalahan
        </p>
        <h1 className="mt-3 text-headline-lg-mobile text-brand-deep tablet:text-headline-lg">
          Halaman gagal dimuat
        </h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Ada gangguan saat memuat bagian ini. Silakan coba lagi — jika
          masalahnya berlanjut, hubungi Customer Service.
        </p>

        {error.digest ? (
          <p className="mt-4 text-caption text-text-secondary">
            Kode kesalahan:{" "}
            <code className="rounded-sm bg-surface-sage px-1.5 py-0.5 font-mono text-caption text-text-primary">
              {error.digest}
            </code>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 tablet:flex-row tablet:justify-center">
          <button type="button" onClick={() => reset()} className={buttonClass({ size: "lg" })}>
            Coba lagi
          </button>
          <Link href="/" className={buttonClass({ variant: "outline", size: "lg" })}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </Container>
  );
}
