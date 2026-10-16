import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthAside } from "@/components/auth/AuthAside";
import { Container } from "@/components/layout/Container";
import { buildMetadata } from "@/lib/metadata";

/**
 * Halaman masuk.
 *
 * `noIndex` wajib: halaman ini hanya menghasilkan form kosong di hasil
 * pencarian dan tidak punya nilai untuk mesin pencari (ARSITEKTUR §9).
 *
 * Halaman daftar lives di `/daftar` dengan komponen yang sama, bukan tab
 * JavaScript — lihat catatan bug di `AuthForm`.
 */
export const metadata: Metadata = buildMetadata({
  title: "Masuk",
  description:
    "Masuk ke akun Palo Mountain Goods untuk melanjutkan pembayaran online dan melihat riwayat pesanan.",
  path: "/masuk",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_to?: string | string[] }>;
}) {
  const { redirect_to } = await searchParams;
  const redirectTo =
    typeof redirect_to === "string" ? redirect_to : undefined;

  return (
    <Container className="py-10 tablet:py-16">
      <div className="grid gap-8 tablet:grid-cols-12">
        <div className="tablet:col-span-6">
          <AuthAside />
        </div>
        <div className="tablet:col-span-6">
          <AuthForm mode="login" {...(redirectTo ? { redirectTo } : {})} />
        </div>
      </div>
    </Container>
  );
}
