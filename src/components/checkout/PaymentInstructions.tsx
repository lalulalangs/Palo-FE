import type { PaymentInfo } from "@/lib/types";

import { formatHarga } from "@/lib/format";

/**
 * Instruksi pembayaran dari `OrderDetail.payment`.
 *
 * Sumbernya `payments.raw_response` yang diteruskan `OrderDetailResource` apa
 * adanya. Backend mengisi `va_number`/`bank_name` untuk Virtual Account, dan
 * `qr_string` untuk QRIS — jadi tiap blok hanya dirender bila field-nya ada,
 * bukan mengarang nomor rekening.
 *
 * Catatan keamanan: `qr_string` ditampilkan sebagai teks, tidak diubah menjadi
 * gambar lewat layanan pihak ketiga. Membuat QR dari API luar berarti mengirim
 * payload pembayaran ke server yang tidak dikenal.
 */
export function PaymentInstructions({ payment }: { payment: PaymentInfo }) {
  const instructions = payment.instructions;
  const vaNumber = instructions?.va_number ?? null;
  const qrString = instructions?.qr_string ?? null;
  const bankName = instructions?.bank_name ?? null;
  const instructionsText = instructions?.instructions_text ?? null;
  const method = instructions?.method ?? payment.method;

  const hasAny =
    Boolean(vaNumber) ||
    Boolean(qrString) ||
    Boolean(bankName) ||
    Boolean(instructionsText);

  if (!hasAny) {
    return (
      <p className="text-body-md leading-relaxed text-text-secondary">
        Panduan pembayaran lagi kami siapkan. Yuk, coba muat ulang halaman sebentar lagi, atau hubungi Customer Service dengan menyebutkan nomor pesananmu kalau butuh bantuan!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {method ? (
        <p className="text-body-sm text-text-secondary">
          Metode:{" "}
          <span className="font-semibold text-text-primary">
            {/* `online` = kanal belum dipilih; jangan tampilkan sebagai jargon. */}
            {method === "online" ? "dipilih di halaman DOKU" : method}
          </span>
          {" · "}
          Jumlah:{" "}
          <span className="font-semibold text-text-primary">
            {formatHarga(payment.amount, null)}
          </span>
        </p>
      ) : null}

      {vaNumber ? (
        <div className="rounded-md border border-border-soft bg-surface-paper p-4">
          <p className="text-caption uppercase tracking-widest text-text-secondary">
            {bankName ? `Virtual Account ${bankName}` : "Nomor Virtual Account"}
          </p>
          <p className="mt-1 select-all font-mono text-headline-md font-bold tracking-wider text-brand-deep">
            {vaNumber}
          </p>
        </div>
      ) : null}

      {qrString ? (
        <div className="rounded-md border border-border-soft bg-surface-paper p-4">
          <p className="text-caption uppercase tracking-widest text-text-secondary">
            {bankName ? `QRIS ${bankName}` : "QRIS"}
          </p>
          <p className="mt-1 select-all break-all font-mono text-body-sm leading-relaxed text-text-primary">
            {qrString}
          </p>
        </div>
      ) : null}

      {instructionsText ? (
        <p className="text-body-md leading-relaxed text-text-primary">
          {instructionsText}
        </p>
      ) : null}
    </div>
  );
}
