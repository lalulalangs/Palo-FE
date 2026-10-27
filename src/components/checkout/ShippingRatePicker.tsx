"use client";

import { formatEstimasi, formatRupiah } from "@/lib/format";
import type { ShippingService } from "@/lib/types";

/**
 * Pemilih layanan pengiriman.
 *
 * Elemennya `<label>` + `<input type="radio">` yang **benar-benar terlihat**
 * (bukan `opacity-0` seperti mockup lama). Radio yang disembunyikan begitu
 * saja tidak bisa difokuskan dengan keyboard dan tidak pernah diumumkan
 * pembaca layar, sehingga pengguna tidak bisa memilih ongkir tanpa mouse.
 *
 * Ongkos yang tampil SELALU hasil `POST /shipping/quote`, tidak pernah
 * dihitung di browser dan tidak pernah memakai angka default (PRD §3.8).
 */
export function ShippingRatePicker({
  services,
  selectedKey,
  destinationCity,
  onSelect,
  disabled = false,
  isPending = false,
}: {
  services: ShippingService[];
  selectedKey: string | null;
  destinationCity: string;
  onSelect: (service: ShippingService) => void;
  disabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <fieldset className="border-0 p-0" disabled={disabled || isPending}>
      <legend className="text-label-md font-semibold text-text-primary">
        Metode pengiriman ke {destinationCity}
      </legend>

      <p className="mt-1 text-body-sm text-text-secondary">
        Ongkos dihitung ulang di server setiap kali alamat atau isi keranjang
        berubah.
      </p>

      <div className="mt-4 space-y-3">
        {services.map((service) => {
          const key = `${service.courier} ${service.service}`;
          const isSelected = selectedKey === key;

          return (
            <label
              key={key}
              className={[
                "flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md border p-4 transition-colors",
                isSelected
                  ? "border-brand-forest bg-surface-sage"
                  : "border-border-soft bg-surface-white hover:bg-surface-paper",
                disabled || isPending ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-start gap-3">
                <input
                  type="radio"
                  name="shipping_service"
                  value={key}
                  checked={isSelected}
                  onChange={() => onSelect(service)}
                  className="mt-1 h-5 w-5 shrink-0 accent-brand-forest"
                />
                <span className="min-w-0">
                  <span className="block text-title-md font-semibold text-text-primary">
                    {service.courier} {service.service}
                  </span>
                  <span className="block text-body-sm text-text-secondary">
                    {service.description
                      ? `${service.description} · `
                      : ""}
                    {formatEstimasi(service.etd)}
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-title-md font-semibold text-brand-forest">
                  {formatRupiah(service.cost)}
                </span>
                {isSelected ? (
                  <span className="block text-body-sm text-text-secondary">
                    Terpilih
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
