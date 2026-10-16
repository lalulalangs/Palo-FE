import type { Metadata } from "next";

import { AuthAside } from "@/components/auth/AuthAside";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";
import { buildMetadata } from "@/lib/metadata";

/**
 * Halaman **Buat Akun**.
 *
 * Ini yang hilang di mockup lama: judul dan tabnya menyebut "Buat Akun", tapi
 * formulir yang benar-benar dirender adalah form masuk. KONTRAK-API §4
 * menyebutkan kesalahan itu secara eksplisit, dan `AuthForm` di mode
 * `register` mengirim `POST /auth/register` dengan `name`, `email`, `password`,
 * dan `password_confirmation` — bukan `POST /auth/login`.
 *
 * `noIndex` sama seperti `/masuk`: form kosong tidak punya nilai untuk SEO.
 */
export const metadata: Metadata = buildMetadata({
  title: "Buat Akun",
  description:
    "Daftar akun Palo Mountain Goods untuk pembayaran online, riwayat pesanan, dan pelacakan status pesanan.",
  path: "/daftar",
  noIndex: true,
});

export default async function RegisterPage({
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
          <AuthForm
            mode="register"
            {...(redirectTo ? { redirectTo } : {})}
          />
        </div>
      </div>
    </Container>
  );
}
