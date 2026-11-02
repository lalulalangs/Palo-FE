import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CheckoutFlow } from "./CheckoutFlow";
import { placeOrderAction } from "@/actions/checkout";
import type { CartItem, Voucher } from "@/lib/types";
import type { AddressInput } from "@/lib/checkout-form";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

// Mock Server Actions
vi.mock("@/actions/checkout", () => ({
  quoteShippingAction: vi.fn().mockResolvedValue({
    services: [
      {
        courier: "JNE",
        service: "REG",
        cost: 20000,
        etd: "2-3 hari",
        description: "Layanan Reguler JNE",
      },
    ],
    destinationCity: "Bandung Barat",
    canProceed: true,
  }),
  placeOrderAction: vi.fn().mockResolvedValue({
    order: {
      order_number: "ORD-COD-12345",
      cod_reference_code: "COD-12345",
      payment_method: "cod",
    },
    paymentUrl: null,
  }),
}));

const mockCart: CartItem[] = [
  {
    sku_id: 1,
    product_name: "Palo T-Shirt Route Sage Green",
    product_slug: "palo-t-shirt-route-sage-green",
    variant_name: "Green Basic / Size L",
    sku_code: "TS-SAGE-L",
    unit_price: 185000,
    unit_price_display: "Rp 185.000",
    quantity: 1,
    subtotal: 185000,
    subtotal_display: "Rp 185.000",
    image: "/tshirt.webp",
    available_stock: 5,
    is_out_of_stock: false,
  },
];

const mockDefaultAddress: AddressInput = {
  recipient_name: "Dimas Pratama",
  phone: "081298765432",
  street: "Jl. Raya Lembang No. 42",
  destination_id: 101,
  city: "Bandung Barat",
  province: "Jawa Barat",
  postal_code: "40391",
  district: "Lembang",
  subdistrict: "Kayuambon",
  notes: null,
};

const mockVouchers: Voucher[] = [];

describe("CheckoutFlow Payment Step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function advanceToPaymentStep() {
    render(
      <CheckoutFlow
        cart={mockCart}
        defaultAddress={mockDefaultAddress}
        userName="Dimas Pratama"
        userEmail="dimas@example.com"
        vouchers={mockVouchers}
      />,
    );

    // Step 0 -> Step 1: Submit Alamat
    const hitungOngkirBtn = screen.getByRole("button", {
      name: /Lanjut ke ongkir/i,
    });
    fireEvent.click(hitungOngkirBtn);

    // Step 1: Pilih Kurir
    const shippingRadio = await screen.findByRole("radio", {
      name: /JNE REG/i,
    });
    fireEvent.click(shippingRadio);

    // Step 1 -> Step 2: Lanjut ke Pembayaran setelah tombol aktif
    const lanjutBayarBtn = await screen.findByRole("button", {
      name: /Lanjut ke pembayaran/i,
    });
    await vi.waitFor(() => {
      expect(lanjutBayarBtn).not.toBeDisabled();
    });
    fireEvent.click(lanjutBayarBtn);

    // Menunggu step 2 (Pembayaran) tampil
    await screen.findByText("Pilih Metode Pembayaran");
  }

  it("merender kartu pilihan pembayaran Online dan COD dengan standar microcopy Tokopedia", async () => {
    await advanceToPaymentStep();

    // Radio Opsi 1: Online
    expect(
      screen.getAllByText("Pembayaran Online Otomatis").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(
        "Praktis dan langsung diproses melalui QRIS, Virtual Account BCA, Mandiri, BRI, atau E-Wallet.",
      ),
    ).toBeInTheDocument();

    // Radio Opsi 2: COD (tanpa badge POPULER dan tanpa (COD))
    expect(
      screen.getAllByText("Bayar di Tempat").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("POPULER")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Bayar tunai langsung ke kurir saat paket tiba di alamatmu.",
      ),
    ).toBeInTheDocument();

    // Default label tombol saat Online
    expect(
      screen.getByRole("button", { name: "Lanjut ke Pembayaran" }),
    ).toBeInTheDocument();

    // Tombol Kembali
    expect(
      screen.getByRole("link", { name: "Kembali" }),
    ).toBeInTheDocument();
  });

  it("menampilkan callout COD dan memperbarui label tombol ketika metode COD dipilih", async () => {
    await advanceToPaymentStep();

    const codRadio = screen.getByRole("radio", {
      name: /Bayar di Tempat/i,
    });
    fireEvent.click(codRadio);

    // Kotak Info COD (Callout) muncul tanpa emoji 💡 dan tanpa (DP)
    expect(
      screen.getByText("Konfirmasi Cepat 1-Klik via WhatsApp"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Tanpa uang muka atau DP\. Setelah membuat pesanan, kirim pesan konfirmasi ke Customer Service agar pesananmu segera disiapkan dari gudang Senaru\./i,
      ),
    ).toBeInTheDocument();

    // Tombol utama berubah ke COD: "Buat Pesanan"
    expect(
      screen.getByRole("button", { name: "Buat Pesanan" }),
    ).toBeInTheDocument();

    // Teks penenang di bawah tombol utama
    expect(
      screen.getByText(
        /Dengan menekan tombol Buat Pesanan, kamu akan diarahkan ke halaman konfirmasi WhatsApp untuk verifikasi pesananmu\./i,
      ),
    ).toBeInTheDocument();

    // CheckoutSummary memperbarui info pembayaran
    expect(
      screen.getByText(/Bayar di Tempat — Tunai saat kurir tiba/),
    ).toBeInTheDocument();
  });

  it("dapat beralih kembali dari COD ke Pembayaran Online Otomatis", async () => {
    await advanceToPaymentStep();

    // Pilih COD
    const codRadio = screen.getByRole("radio", {
      name: /Bayar di Tempat/i,
    });
    fireEvent.click(codRadio);
    expect(
      screen.getByRole("button", { name: "Buat Pesanan" }),
    ).toBeInTheDocument();

    // Kembalikan ke Online
    const onlineRadio = screen.getByRole("radio", {
      name: /Pembayaran Online Otomatis/i,
    });
    fireEvent.click(onlineRadio);

    // Callout COD hilang
    expect(
      screen.queryByText("Konfirmasi Cepat 1-Klik via WhatsApp"),
    ).not.toBeInTheDocument();

    // Tombol utama kembali ke Online
    expect(
      screen.getByRole("button", { name: "Lanjut ke Pembayaran" }),
    ).toBeInTheDocument();
  });

  it("mengirimkan order dengan metode paymentMethod 'cod' saat tombol Buat Pesanan ditekan", async () => {
    await advanceToPaymentStep();

    const codRadio = screen.getByRole("radio", {
      name: /Bayar di Tempat/i,
    });
    fireEvent.click(codRadio);

    const submitBtn = screen.getByRole("button", { name: "Buat Pesanan" });
    fireEvent.click(submitBtn);

    await vi.waitFor(() => {
      expect(placeOrderAction).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: "cod" }),
      );
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("/checkout/berhasil?order=ORD-COD-12345"),
      );
    });
  });
});
