"use client";

import { useActionState } from "react";

import { createGuestCheckoutAction } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { fieldError, isActionError } from "@/lib/action-result";
import type { CartItem } from "@/lib/types";

/**
 * Formulir checkout tamu via WhatsApp (PRD §3.11).
 *
 * Yang harus dipahami sebelum mengubah apa pun di sini:
 *
 * 1. **Ini BUKAN checkout.** Tombolnya membuka WhatsApp, bukan membuat order.
 *    Tidak ada `order_number`, tidak ada reservasi stok, tidak ada payment
 *    gateway (KONTRAK-API §5). Karena itu halaman hasilnya menampilkan notice
 *    itu dengan jujur, bukan memakai kata "berhasil".
 * 2. **Nama dan telepon opsional.** Backend (`GuestCheckoutController`)
 *    mewajibkan `items` dan membiarkan `guest_name`/`guest_phone` kosong.
 *    Memaksa keduanya wajib akan membuang pengguna yang sudah menyusun
 *    keranjang tanpa alasan yang jelas.
 * 3. **Spesifikasi custom tidak masuk ke sini.** PRD §1.1A: pembelian partai
 *    adalah permintaan lewat CS, bukan SKU berbayar. Jalur itu punya endpoint
 *    sendiri (`/guest/custom-inquiry`) dan tidak dicampur ke form pemesanan.
 */
export function GuestCheckoutForm({ items }: { items: CartItem[] }) {
  const [state, formAction, isPending] = useActionState(
    createGuestCheckoutAction,
    null,
  );
  const error = isActionError(state) ? state : null;
  const hasBlockingItem = items.some((item) => item.is_out_of_stock);

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-headline-sm text-text-primary">
        Jalur 1 — Checkout lewat WhatsApp
      </h2>
      <p className="text-caption leading-relaxed text-text-secondary">
        Tanpa akun. Daftar belanja disusun otomatis ke percakapan WhatsApp
        Customer Service untuk pengecekan stok fisik, rekomendasi ukuran, dan
        konfirmasi pembayaran.
      </p>

      {/*
        Item dikirim sebagai satu field `sku_id:quantity` yang diserialisasi
        dari cart yang sudah dirender server. Backend tetap memvalidasi ulang
        SKU, harga, dan stok dari database (PRD §3.6), jadi ini bukan lapisan
        keamanan — hanya menghindari array yang bisa dimanipulasi di form.
      */}
      <input type="hidden" name="items" value={serializeItems(items)} />

      <Input
        id="guest-name"
        name="guest_name"
        label="Nama (opsional)"
        hint="Membantu Customer Service menyapa Anda di WhatsApp."
        autoComplete="name"
        maxLength={120}
        disabled={isPending}
        error={fieldError(error, "guest_name")}
      />

      <Input
        id="guest-phone"
        name="guest_phone"
        type="tel"
        inputMode="tel"
        label="Nomor WhatsApp (opsional)"
        hint="Isi bila ingin nomor Anda dicantumkan di pesan."
        autoComplete="tel"
        maxLength={32}
        disabled={isPending}
        error={fieldError(error, "guest_phone")}
      />

      <Textarea
        id="guest-note"
        name="note"
        label="Catatan (opsional)"
        placeholder="Contoh: mohon dikirimkan pada jam kerja."
        maxLength={500}
        disabled={isPending}
        error={fieldError(error, "note")}
      />

      {hasBlockingItem ? (
        <PlaceholderNotice
          title="Ada item yang sedang tidak tersedia"
          body="Satu atau lebih item di keranjang kehabisan stok. Hapus item tersebut sebelum melanjutkan supaya pesan ke Customer Service tidak memuat barang yang tidak bisa dipenuhi."
        />
      ) : null}

      {error ? (
        <div role="alert">
          <PlaceholderNotice
            title="Belum bisa menghubungi Customer Service"
            body={error.message}
            variant="paper"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || hasBlockingItem}
        className={buttonClass({ fullWidth: true, size: "lg" })}
      >
        {isPending ? "Menyiapkan pesan…" : "Lanjut ke WhatsApp CS"}
      </button>

      <p className="text-caption leading-relaxed text-text-secondary">
        Membuka WhatsApp adalah menghubungi Customer Service, bukan bukti
        pesanan sudah tercatat dan bukan pembayaran yang selesai.
      </p>
    </form>
  );
}

/** `sku_id:quantity` dipisah koma — format yang dibaca Server Action. */
function serializeItems(items: CartItem[]): string {
  return items
    .filter((item) => !item.is_out_of_stock && item.quantity > 0)
    .map((item) => `${item.sku_id}:${item.quantity}`)
    .join(",");
}
