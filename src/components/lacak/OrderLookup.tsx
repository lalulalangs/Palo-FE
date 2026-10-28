"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { trackOrderAction } from "@/actions/checkout";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrderTimeline } from "@/components/lacak/OrderTimeline";
import type { OrderDetail } from "@/lib/types";

/**
 * Pencarian nomor pesanan.
 *
 * **Batasan yang harus dinyatakan terbuka, bukan disembunyikan:**
 * `GET /orders/{orderNumber}` hanya mengembalikan pesanan milik pengguna yang
 * sedang login — `OrderController::show` memfilter `user_id` di dalam query.
 * Artinya tidak ada lookup pesanan anonim yang aman, jadi "lacak tanpa login"
 * yang muncul di mockup tidak dapat dipenuhi lewat API yang ada.
 *
 * Daripada membuat endpoint yang membocorkan keberadaan pesanan orang lain,
 * halaman ini untuk tamu hanya mengarahkan ke login, dan nomor pesanan tidak
 * pernah dikonfirmasi ada atau tidak. Hasilnya memang kurang informatif bagi
 * pengunjung tanpa akun, tetapi tidak memperbocorkan data siapa pun.
 */
export function OrderLookup({ initialOrder }: { initialOrder: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [result, setResult] = useState<{
    found: boolean;
    requiresLogin: boolean;
    detail: OrderDetail | null;
  } | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = orderNumber.trim().toUpperCase();

    if (normalized.length === 0) {
      setResult({ found: false, requiresLogin: false, detail: null });
      return;
    }

    // URL ikut diperbarui supaya nomor pesanan bisa dibagikan dan tombol
    // back bekerja.
    startTransition(async () => {
      router.replace(`/lacak?order=${encodeURIComponent(normalized)}`, {
        scroll: false,
      });
      const response = await trackOrderAction(normalized);
      setResult({
        found: response.found,
        requiresLogin: response.requiresLogin,
        detail: response.detail,
      });
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <Input
          id="order-number"
          name="order"
          label="Nomor pesanan"
          hint="Tuliskan nomor pesanan yang tertera di riwayat belanja atau email konfirmasimu."
          autoCapitalize="characters"
          autoComplete="off"
          required
          maxLength={64}
          disabled={isPending}
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
        />
        <button
          type="submit"
          disabled={isPending}
          className={buttonClass({ size: "lg", fullWidth: true })}
        >
          {isPending ? "Mencari…" : "Lacak pesanan"}
        </button>
      </form>

      {/*
        `aria-live="polite"` supaya hasil pencarian diumumkan pembaca layar
        tanpa memindahkan fokus dari kolom pencarian.
      */}
      <div role="status" aria-live="polite" className="space-y-4">
        {result?.requiresLogin ? (
          <PlaceholderNotice
            title="Masuk ke Akunmu"
            body="Untuk keamanan data privasi, detail pesanan hanya dapat dilihat setelah kamu masuk ke akunmu. Yuk, masuk sekarang!"
          />
        ) : null}

        {result && !result.requiresLogin && !result.found ? (
          <PlaceholderNotice
            title="Pesanan tidak ditemukan"
            body="Nomor pesanan belum ditemukan. Pastikan format nomor pesanan sudah benar atau masuk dengan akun yang kamu gunakan saat belanja, ya."
            variant="paper"
          />
        ) : null}

        {result?.detail ? <OrderTimeline order={result.detail} /> : null}
      </div>
    </div>
  );
}
