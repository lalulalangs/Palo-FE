"use client";

import { useActionState, useEffect, useRef } from "react";

import { createGuestCheckoutAction } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { fieldError, isActionError } from "@/lib/action-result";
import { formatHarga } from "@/lib/format";
import type {
  GuestCheckoutActionState,
  GuestResultHandoff,
} from "@/lib/guest-handoff";
import { stockStateOf } from "@/lib/cart-stock";
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
export function GuestCheckoutForm({
  items,
  variant = "primary",
}: {
  items: CartItem[];
  /** Hanya satu CTA primer per tampilan; diisi oleh halaman induk. */
  variant?: "primary" | "outline";
}) {
  const [state, formAction, isPending] = useActionState<
    GuestCheckoutActionState | null,
    FormData
  >(createGuestCheckoutAction, null);
  const error = isActionError(state) ? state : null;
  // Sukses = hasil dikembalikan action dan panel ditampilkan DI SINI.
  // Tidak ada cookie, tidak ada redirect, tidak ada halaman perantara.
  const handoff = state?.ok ? state.handoff : null;
  // Gerbang yang sama dipakai baris keranjang dan ringkasan: stok basi
  // (jumlah > sisa stok) juga memblokir jalur tamu, bukan hanya stok habis.
  const hasBlockingItem = items.some((item) => stockStateOf(item) !== "cukup");

  if (handoff) return <GuestResultPanel handoff={handoff} />;

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-headline-sm text-text-primary">
        Checkout lewat WhatsApp
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
          title="Ada barang yang perlu disesuaikan dulu"
          body="Satu atau lebih barang habis atau jumlahnya melebihi sisa stok. Sesuaikan jumlahnya sebelum melanjutkan."
          variant="paper"
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
        className={buttonClass({ variant, fullWidth: true, size: "lg" })}
      >
        {isPending ? "Menyiapkan pesan…" : "Lanjut ke WhatsApp CS"}
      </button>

      <p className="text-caption leading-relaxed text-text-secondary">
        Pesanan langsung tercatat di sistem setelah tombol ini ditekan.
        Pembayaran (VA/QRIS) disepakati lewat WhatsApp dan baru diproses
        setelah admin memverifikasinya.
      </p>
    </form>
  );
}

/**
 * Hasil setelah pesan WhatsApp disiapkan.
 *
 * Dulu ini halaman `/keranjang/sukses` yang dibuka lewat redirect + cookie
 * serah-terima. Cookie itu yang berulang kali gagal (mutasi saat render, lalu
 * tidak pernah sampai ke browser), jadi hasilnya sekarang dirender di tempat
 * pengguna menekan tombol — tidak ada perpindahan halaman yang bisa gagal.
 *
 * Fokus dipindah ke judul supaya pembaca layar langsung tahu isi formulir
 * sudah berganti menjadi hasil.
 */
function GuestResultPanel({ handoff }: { handoff: GuestResultHandoff }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-headline-sm text-text-primary"
      >
        Pesanan tercatat, menunggu konfirmasi
      </h2>

      <div className="rounded-lg border-2 border-accent-earth/50 bg-surface-paper p-4">
        <p className="text-title-md text-brand-deep">Pesanan sudah masuk</p>
        <p className="mt-2 text-body-md text-text-secondary">{handoff.notice}</p>
        <p className="mt-2 text-caption leading-relaxed text-text-secondary">
          Customer Service akan menghubungi Anda lewat WhatsApp untuk memilih
          pembayaran (VA atau QRIS). Pesanan baru diproses setelah pembayaran
          diverifikasi admin. Bila tidak dibayar dalam 1×24 jam, pesanan
          kedaluwarsa otomatis. Ongkos kirim dikonfirmasi CS dan belum termasuk
          angka di bawah.
        </p>
      </div>

      <div className="rounded-lg border border-border-soft bg-surface-white p-4">
        {handoff.order_number ? (
          <>
            <p className="text-caption uppercase tracking-widest text-text-secondary">
              Nomor pesanan
            </p>
            <p className="mt-1 font-mono text-title-lg font-bold tracking-wider text-text-primary">
              {handoff.order_number}
            </p>
          </>
        ) : null}
        <p className="mt-3 text-caption uppercase tracking-widest text-text-secondary">
          Kode referensi
        </p>
        <p className="mt-1 font-mono text-title-lg font-bold tracking-wider text-brand-deep">
          {handoff.reference_code}
        </p>
        <p className="mt-1 text-caption text-text-secondary">
          Sebutkan kode ini di awal percakapan supaya Customer Service bisa
          menemukan catatan Anda.
        </p>
      </div>

      {handoff.estimated_total > 0 || handoff.estimated_total_display ? (
        <p className="text-body-md text-text-primary">
          Estimasi total{" "}
          <strong className="font-semibold text-brand-forest">
            {formatHarga(
              handoff.estimated_total,
              handoff.estimated_total_display,
            )}
          </strong>{" "}
          <span className="text-caption text-text-secondary">
            (belum termasuk ongkos kirim)
          </span>
        </p>
      ) : null}

      <a
        href={handoff.wa_url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ size: "lg", fullWidth: true })}
      >
        Buka WhatsApp dan kirim pesan
      </a>

      <p className="text-caption leading-relaxed text-text-secondary">
        Tautan ini membuka percakapan dengan pesan yang sudah terisi. Membuka
        tautan tidak mengirim apa pun — Anda tetap menekan tombol kirim di
        WhatsApp.
      </p>
    </div>
  );
}

/**
 * `sku_id:quantity` dipisah koma — format yang dibaca Server Action.
 *
 * Baris `habis` dibuang, dan baris `kurang` dikirim dengan jumlah yang sudah
 * diturunkan ke sisa stok. Ini lapisan UX, bukan keamanan: backend tetap
 * memvalidasi SKU, harga, dan stok.
 */
function serializeItems(items: CartItem[]): string {
  return items
    .filter((item) => stockStateOf(item) !== "habis" && item.quantity > 0)
    .map(
      (item) =>
        `${item.sku_id}:${Math.min(item.quantity, item.available_stock)}`,
    )
    .join(",");
}
