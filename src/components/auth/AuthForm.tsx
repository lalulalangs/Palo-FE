"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fieldError, isActionError } from "@/lib/action-result";

/**
 * Formulir autentikasi dalam dua mode: masuk dan daftar.
 *
 * **Bug mockup yang harus tetap diperbaiki:** di mockup lama, tab
 * "Daftar Akun Baru" tidak mengganti apa pun — hanya atribut
 * `aria-selected` yang berubah sementara isi form tetap form masuk.
 * KONTRAK-API §4 tegas: "Tombol 'Buat Akun' membuka `POST /auth/register`,
 * bukan form login — kesalahan yang ada di mockup lama."
 *
 * Di sini mode berasal dari URL (`/masuk` vs `/daftar`), jadi:
 * - field yang dikirim benar-benar berbeda,
 * - tautannya bisa dibagikan dan tombol back/forward bekerja,
 * - tab tetap bisa difokuskan dengan keyboard.
 */
export type AuthMode = "login" | "register";

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: AuthMode;
  /** Tujuan setelah berhasil; sudah divalidasi ulang di Server Action. */
  redirectTo?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    mode === "login" ? loginAction : registerAction,
    null,
  );
  const error = isActionError(state) ? state : null;
  const isRegister = mode === "register";

  return (
    <div className="rounded-lg border border-border-soft bg-surface-white p-5 tablet:p-8">
      <nav
        aria-label="Pilih formulir"
        className="mb-6 flex gap-1 border-b border-border-soft"
      >
        <Link
          href={withRedirect("/masuk", redirectTo)}
          aria-current={isRegister ? undefined : "page"}
          className={[
            "flex min-h-11 items-center rounded-t-md border-b-2 px-4 text-label-md font-semibold transition-colors",
            isRegister
              ? "border-transparent text-text-secondary hover:text-text-primary"
              : "border-brand-forest text-brand-forest",
          ].join(" ")}
        >
          Masuk
        </Link>
        <Link
          href={withRedirect("/daftar", redirectTo)}
          aria-current={isRegister ? "page" : undefined}
          className={[
            "flex min-h-11 items-center rounded-t-md border-b-2 px-4 text-label-md font-semibold transition-colors",
            isRegister
              ? "border-brand-forest text-brand-forest"
              : "border-transparent text-text-secondary hover:text-text-primary",
          ].join(" ")}
        >
          Daftar Akun Baru
        </Link>
      </nav>

      <h2 className="text-headline-sm text-text-primary">
        {isRegister ? "Buat akun baru" : "Selamat datang kembali"}
      </h2>
      <p className="mt-1 text-body-sm text-text-secondary">
        {isRegister
          ? "Daftar sekarang untuk kemudahan transaksi dan pantau pesananmu kapan saja."
          : "Yuk, masukkan email dan kata sandi akunmu."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {/*
          Tujuan comeback dibawa sebagai field tersembunyi dan DIVALIDASI ULANG
          di Server Action sebelum `redirect()`. Tanpa validasi itu, `?redirect_to`
          bisa diisi `//evil.com` dan dipakai memancing pengguna ke situs palsu
          tepat setelah login.
        */}
        {redirectTo ? (
          <input type="hidden" name="redirect_to" value={redirectTo} />
        ) : null}

        {isRegister ? (
          <Input
            id="auth-name"
            name="name"
            label="Nama lengkap"
            autoComplete="name"
            required
            maxLength={120}
            disabled={isPending}
            error={fieldError(error, "name")}
          />
        ) : null}

        <Input
          id="auth-email"
          name="email"
          type="email"
          inputMode="email"
          label="Email"
          autoComplete="email"
          required
          maxLength={255}
          disabled={isPending}
          error={fieldError(error, "email")}
        />

        <Input
          id="auth-password"
          name="password"
          type="password"
          label="Kata sandi"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          maxLength={255}
          disabled={isPending}
          error={fieldError(error, "password")}
        />

        {isRegister ? (
          <Input
            id="auth-password-confirm"
            name="password_confirmation"
            type="password"
            label="Ulangi kata sandi"
            autoComplete="new-password"
            required
            maxLength={255}
            disabled={isPending}
            error={fieldError(error, "password_confirmation")}
            hint="Gunakan minimal 8 karakter dengan kombinasi huruf dan angka biar makin aman."
          />
        ) : null}

        {!isRegister ? (
          <div className="flex items-center gap-2">
            <input
              id="auth-remember"
              name="remember"
              type="checkbox"
              disabled={isPending}
              className="h-5 w-5 rounded-sm border border-border-soft accent-brand-forest"
            />
            <label
              htmlFor="auth-remember"
              className="text-label-md text-text-primary"
            >
              Ingat saya di perangkat ini
            </label>
          </div>
        ) : null}

        {error ? (
          <div role="alert">
            <PlaceholderNotice
              title={
                error.kind === "rate-limit"
                  ? "Terlalu banyak percobaan"
                  : error.kind === "auth"
                    ? "Gagal masuk"
                    : "Belum bisa diproses"
              }
              body={error.message}
              variant="paper"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className={buttonClass({ size: "lg", fullWidth: true })}
        >
          {isPending ? "Memproses…" : isRegister ? "Buat akun" : "Masuk"}
        </button>
      </form>

      {/*
        Jalur tamu selalu tersedia (PRD §1.1). Menaruh tautan ini di bawah
        formulir memastikan orang yang tidak ingin membuat akun tidak terjebak
        di halaman auth.
      */}
      <div className="mt-6 rounded-md bg-surface-sage/70 p-3">
        <p className="text-body-sm leading-relaxed text-text-secondary">
          Mau belanja lebih praktis tanpa akun? Kamu tetap bisa pesan langsung via
          WhatsApp Customer Service dari halaman keranjang, lho!
        </p>
        <Link
          href="/keranjang"
          className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand-forest underline underline-offset-4"
        >
          Buka keranjang
        </Link>
      </div>
    </div>
  );
}

/** Pertahankan tujuan comeback saat berpindah tab masuk/daftar. */
function withRedirect(path: string, redirectTo: string | undefined): string {
  if (!redirectTo) return path;
  return `${path}?redirect_to=${encodeURIComponent(redirectTo)}`;
}
