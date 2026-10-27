"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { createGuestCheckoutAction } from "@/actions/storefront";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { DestinationPicker, type PickedDestination } from "@/components/checkout/DestinationPicker";
import { buttonClass } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { fieldError, isActionError } from "@/lib/action-result";
import { addressRegion } from "@/lib/checkout-form";
import { formatHarga } from "@/lib/format";
import type {
  GuestCheckoutActionState,
  GuestResultHandoff,
} from "@/lib/guest-handoff";
import { stockStateOf } from "@/lib/cart-stock";
import type { CartItem, ShippingDestination } from "@/lib/types";

const ACTIVE_GUEST_ORDER_KEY = "palorinjani_active_guest_order";
const ACTIVE_ORDER_TTL_MS = 60 * 60 * 1000; // 1 jam

const COURIER_OPTIONS = [
  {
    id: "cs_recommendation",
    label: "Rekomendasi CS",
    badge: "Paling Hemat",
    desc: "CS carikan opsi terbaik",
  },
  {
    id: "jne",
    label: "JNE",
    badge: null,
    desc: "Reguler / YES",
  },
  {
    id: "jnt",
    label: "J&T Express",
    badge: null,
    desc: "Reguler / EZ",
  },
] as const;

const EMPTY_DESTINATION: PickedDestination = {
  destination_id: 0,
  city: "",
  province: "",
  district: null,
  subdistrict: null,
  postal_code: null,
};

function subscribeStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getActiveOrderSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_GUEST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      handoff: GuestResultHandoff;
      timestamp: number;
    };
    if (
      parsed &&
      parsed.handoff &&
      typeof parsed.timestamp === "number" &&
      Date.now() - parsed.timestamp < ACTIVE_ORDER_TTL_MS
    ) {
      return JSON.stringify(parsed.handoff);
    }
    sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
    return null;
  } catch {
    return null;
  }
}

function getActiveOrderServerSnapshot(): string | null {
  return null;
}

/**
 * Formulir checkout tamu via WhatsApp (PRD §3.11).
 * Dilengkapi dengan 4 seksi logis:
 * 1. Data Pemesan (nama & no. WhatsApp)
 * 2. Alamat Pengiriman (DestinationPicker & Detail Jalan)
 * 3. Pilihan Ekspedisi (Segmented Radio Cards)
 * 4. Catatan & Selesai (Catatan & CTA Primer dengan spinner)
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
  const handoff = state?.ok ? state.handoff : null;

  // State alamat tujuan pengiriman
  const [destination, setDestination] = useState<PickedDestination>(EMPTY_DESTINATION);

  // State pilihan kurir (default: cs_recommendation)
  const [selectedCourier, setSelectedCourier] = useState<string>("cs_recommendation");

  // Baca sessionStorage secara reaktif via useSyncExternalStore
  const storedHandoffJson = useSyncExternalStore(
    subscribeStorage,
    getActiveOrderSnapshot,
    getActiveOrderServerSnapshot,
  );

  const [isDismissed, setIsDismissed] = useState(false);

  const savedHandoff = useMemo(() => {
    if (!storedHandoffJson) return null;
    try {
      return JSON.parse(storedHandoffJson) as GuestResultHandoff;
    } catch {
      return null;
    }
  }, [storedHandoffJson]);

  // Simpan ke sessionStorage saat action mengembalikan handoff baru
  useEffect(() => {
    if (handoff) {
      try {
        sessionStorage.setItem(
          ACTIVE_GUEST_ORDER_KEY,
          JSON.stringify({ handoff, timestamp: Date.now() }),
        );
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Abaikan bila sessionStorage diblokir
      }
    }
  }, [handoff]);

  const handleNewOrder = () => {
    try {
      sessionStorage.removeItem(ACTIVE_GUEST_ORDER_KEY);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Abaikan bila sessionStorage diblokir
    }
    setIsDismissed(true);
    window.location.reload();
  };

  const handleSelectDestination = (dest: ShippingDestination | null) => {
    setDestination(addressRegion(dest));
  };

  const activeHandoff = handoff ?? (isDismissed ? null : savedHandoff);

  // Gerbang yang sama dipakai baris keranjang dan ringkasan: stok basi
  // (jumlah > sisa stok) juga memblokir jalur tamu, bukan hanya stok habis.
  const hasBlockingItem = items.some((item) => stockStateOf(item) !== "cukup");

  if (activeHandoff) {
    return (
      <GuestResultPanel
        handoff={activeHandoff}
        onNewOrder={handleNewOrder}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h2 className="text-headline-sm text-text-primary">
          Checkout lewat WhatsApp
        </h2>
        <p className="mt-1 text-caption leading-relaxed text-text-secondary">
          Tanpa akun. Daftar belanja dan informasi pengiriman disusun otomatis ke percakapan WhatsApp
          Customer Service untuk pengecekan fisik, rekomendasi ongkir, dan konfirmasi pembayaran.
        </p>
      </div>

      {/* Item diserialisasi dari cart yang dirender server */}
      <input type="hidden" name="items" value={serializeItems(items)} />

      {/* Honeypot anti-bot: disembunyikan visual dan ARIA */}
      <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="guest-company">Perusahaan</label>
        <input
          id="guest-company"
          name="hp_company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Hidden inputs untuk wilayah destinasi hasil DestinationPicker */}
      <input type="hidden" name="destination_id" value={destination.destination_id || ""} />
      <input type="hidden" name="city" value={destination.city} />
      <input type="hidden" name="district" value={destination.district ?? ""} />
      <input type="hidden" name="subdistrict" value={destination.subdistrict ?? ""} />
      <input type="hidden" name="province" value={destination.province} />
      <input type="hidden" name="postal_code" value={destination.postal_code ?? ""} />

      {/* =========================================================================
          SEKSI 1: Data Pemesan
      ========================================================================= */}
      <section aria-labelledby="section-buyer-title" className="space-y-3">
        <div className="border-b border-border-soft pb-2">
          <h3 id="section-buyer-title" className="text-label-md font-semibold text-text-primary">
            1. Data Pemesan
          </h3>
          <p className="text-caption text-text-secondary">
            Nama dan nomor kontak untuk percakapan dengan Customer Service.
          </p>
        </div>

        <div className="grid gap-3 tablet:grid-cols-2">
          <Input
            id="guest-name"
            name="guest_name"
            label="Nama lengkap (opsional)"
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
        </div>
      </section>

      {/* =========================================================================
          SEKSI 2: Alamat Pengiriman
      ========================================================================= */}
      <section aria-labelledby="section-shipping-title" className="space-y-3">
        <div className="border-b border-border-soft pb-2">
          <h3 id="section-shipping-title" className="text-label-md font-semibold text-text-primary">
            2. Alamat Pengiriman
          </h3>
          <p className="text-caption text-text-secondary">
            Pilih wilayah tujuan dan detail jalan untuk memudahkan CS menghitung ongkir resmi.
          </p>
        </div>

        <DestinationPicker
          picked={destination}
          disabled={isPending}
          onSelect={handleSelectDestination}
          error={fieldError(error, "destination_id")}
        />

        <Input
          id="guest-street"
          name="street"
          label="Detail alamat jalan (opsional)"
          placeholder="Nama jalan, nomor rumah, RT/RW, atau patokan"
          autoComplete="street-address"
          maxLength={300}
          disabled={isPending}
          error={fieldError(error, "street")}
          hint="Membantu estimasi ongkos kirim dan pengantaran kurir."
        />
      </section>

      {/* =========================================================================
          SEKSI 3: Pilihan Ekspedisi
      ========================================================================= */}
      <section aria-labelledby="courier-group-label" className="space-y-3">
        <div className="border-b border-border-soft pb-2">
          <h3 id="courier-group-label" className="text-label-md font-semibold text-text-primary">
            3. Pilihan Ekspedisi
          </h3>
          <p className="text-caption text-text-secondary">
            Pilih preferensi jasa pengiriman. Tarif ongkir final akan dikonfirmasi via WhatsApp.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-labelledby="courier-group-label"
          className="grid grid-cols-1 gap-2.5 tablet:grid-cols-3"
        >
          {COURIER_OPTIONS.map((option) => {
            const isSelected = selectedCourier === option.id;
            return (
              <label
                key={option.id}
                className={[
                  "relative flex min-h-[5.5rem] cursor-pointer select-none flex-col justify-between rounded-lg border p-3 transition-all",
                  isSelected
                    ? "border-brand-forest bg-surface-sage/50 ring-2 ring-brand-forest ring-offset-1"
                    : "border-border-soft bg-surface-white hover:border-brand-forest/40 hover:bg-surface-paper",
                  isPending ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex flex-col gap-1">
                  {option.badge ? (
                    <span className="self-start rounded-full bg-brand-forest px-2 py-0.5 text-[10px] font-bold tracking-tight text-surface-white">
                      {option.badge}
                    </span>
                  ) : (
                    <span className="h-4" aria-hidden="true" />
                  )}
                  <span className="text-label-sm font-semibold leading-tight text-text-primary">
                    {option.label}
                  </span>
                  <span className="text-[11px] leading-snug text-text-secondary">
                    {option.desc}
                  </span>
                </div>
                <input
                  type="radio"
                  name="courier"
                  value={option.id}
                  checked={isSelected}
                  disabled={isPending}
                  onChange={() => setSelectedCourier(option.id)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SEKSI 4: Catatan & Submit
      ========================================================================= */}
      <section aria-labelledby="section-note-title" className="space-y-3">
        <div className="border-b border-border-soft pb-2">
          <h3 id="section-note-title" className="text-label-md font-semibold text-text-primary">
            4. Catatan & Selesai
          </h3>
          <p className="text-caption text-text-secondary">
            Tambahkan instruksi khusus untuk Customer Service jika ada.
          </p>
        </div>

        <Textarea
          id="guest-note"
          name="note"
          label="Catatan (opsional)"
          placeholder="Contoh: Titipkan di pos satpam bila rumah kosong, atau butuh rekomendasi ukuran."
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
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon className="h-5 w-5 animate-spin" />
              <span>Menyiapkan pesan…</span>
            </span>
          ) : (
            "Lanjut ke WhatsApp CS"
          )}
        </button>

        <p className="text-caption leading-relaxed text-text-secondary">
          Pesanan langsung tercatat di sistem setelah tombol ini ditekan.
          Pembayaran (VA/QRIS) disepakati lewat WhatsApp dan baru diproses
          setelah admin memverifikasinya.
        </p>
      </section>
    </form>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Hasil setelah pesan WhatsApp disiapkan.
 */
function GuestResultPanel({
  handoff,
  onNewOrder,
}: {
  handoff: GuestResultHandoff;
  onNewOrder?: () => void;
}) {
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

      {onNewOrder ? (
        <button
          type="button"
          onClick={onNewOrder}
          className={buttonClass({ variant: "outline", size: "md", fullWidth: true })}
        >
          Buat Pesanan Baru
        </button>
      ) : null}

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
