import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { CodConfirmationCard } from "./CodConfirmationCard";
import type { OrderDetail } from "@/lib/types";

const mockOrder: OrderDetail = {
  order_number: "ORD-20261102-0001",
  cod_reference_code: "COD-20261102-7A9B2",
  status: "awaiting_confirmation",
  status_label: "Menunggu Konfirmasi CS",
  first_item_name: "Palo T-Shirt Route Sage Green",
  item_count: 1,
  subtotal: 185000,
  discount_total: 0,
  shipping_cost: 24000,
  service_fee: 0,
  grand_total: 209000,
  grand_total_display: "Rp 209.000",
  voucher_code: null,
  payment_expires_at: "2026-11-03T09:00:00Z",
  needs_reconciliation: false,
  placed_at: "2026-11-02T09:00:00Z",
  shipping_courier: "J&T",
  shipping_service: "Regular",
  shipping_etd: "2-3 hari",
  tracking_number: null,
  payment_method: "cod",
  is_cod: true,
  whatsapp_url:
    "https://wa.me/6281234567890?text=Halo%20Admin%20Palorinjani%2C%20saya%20ingin%20konfirmasi%20pesanan%20COD",
  whatsapp_message:
    "Halo Admin Palorinjani, saya ingin konfirmasi pesanan COD.\n\n*Kode Order:* COD-20261102-7A9B2",
  shipping_address: {
    recipient_name: "Dimas Pratama",
    phone: "081298765432",
    street: "Jl. Raya Lembang No. 42",
    subdistrict: "Kayuambon",
    district: "Lembang",
    city: "Bandung Barat",
    city_code: null,
    province: "Jawa Barat",
    province_code: null,
    postal_code: "40391",
    notes: null,
  },
  items: [
    {
      sku_code: "TS-SAGE-L",
      product_name: "Palo T-Shirt Route Sage Green",
      product_slug: "palo-t-shirt-route-sage-green",
      variant_name: "Green Basic / Size L",
      image: "/tshirt.webp",
      quantity: 1,
      unit_price: 185000,
      subtotal: 185000,
    },
  ],
  history: [],
  payment: {
    method: "cod",
    status: "pending",
    amount: 209000,
    instructions: {
      qr_string: null,
      va_number: null,
      bank_name: null,
      instructions_text: null,
      expires_at: null,
      whatsapp_url:
        "https://wa.me/6281234567890?text=Halo%20Admin%20Palorinjani%2C%20saya%20ingin%20konfirmasi%20pesanan%20COD",
      whatsapp_message:
        "Halo Admin Palorinjani, saya ingin konfirmasi pesanan COD.\n\n*Kode Order:* COD-20261102-7A9B2",
      cod_reference_code: "COD-20261102-7A9B2",
    },
  },
};

describe("CodConfirmationCard Component", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("merender banner status dan kode referensi COD dengan benar", () => {
    render(<CodConfirmationCard order={mockOrder} />);

    expect(
      screen.getByText(/Menunggu Konfirmasi WhatsApp/i),
    ).toBeInTheDocument();
    expect(screen.getByText("COD-20261102-7A9B2")).toBeInTheDocument();
  });

  it("merender standar microcopy ramah ala Tokopedia", () => {
    render(<CodConfirmationCard order={mockOrder} />);

    // Heading utama
    expect(
      screen.getByText(
        "Yeay, pesananmu sudah tercatat! Yuk, selesaikan 1 langkah terakhir.",
      ),
    ).toBeInTheDocument();

    // Sub-heading
    expect(
      screen.getByText(
        /Klik tombol WhatsApp di bawah untuk kirim pesan konfirmasi otomatis ke admin\. Begitu terkirim, pesananmu langsung kami kemas dari gudang Senaru!/i,
      ),
    ).toBeInTheDocument();

    // Tombol utama WhatsApp (tanpa emoji, tanpa kurung)
    const whatsappBtn = screen.getByRole("link", {
      name: /Konfirmasi Pesanan via WhatsApp 1-Klik/i,
    });
    expect(whatsappBtn).toBeInTheDocument();
    expect(whatsappBtn).toHaveAttribute("target", "_blank");
    expect(whatsappBtn).toHaveAttribute("rel", "noopener noreferrer");
    expect(whatsappBtn.getAttribute("href")).toContain("wa.me/6281234567890");

    // Info penenang 24 jam
    expect(
      screen.getByText(/Stok produkmu aman selama/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/24 jam/i),
    ).toBeInTheDocument();

    // Kotak info uang tunai
    expect(
      screen.getByText(/Siapkan Uang Tunai Pas Saat Kurir Tiba:/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Rp 209.000")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Tips: Menyiapkan uang pas akan mempercepat proses serah terima paketmu dengan kurir\./i,
      ),
    ).toBeInTheDocument();
  });

  it("menyediakan akordeon fallback 3-lapis dengan tombol copy yang berfungsi", async () => {
    render(<CodConfirmationCard order={mockOrder} />);

    // Judul akordeon
    expect(
      screen.getByText(
        "Kendala membuka WhatsApp otomatis? Klik di sini untuk bantuan manual",
      ),
    ).toBeInTheDocument();

    // Lapis 1: Salin teks pesanan
    const copyMessageBtn = screen.getByRole("button", {
      name: /Salin Teks Pesanan/i,
    });
    await act(async () => {
      fireEvent.click(copyMessageBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("COD-20261102-7A9B2"),
    );
    expect(screen.getByText("Tersalin")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText("Salin Teks Pesanan")).toBeInTheDocument();

    // Lapis 2: Salin nomor CS
    const copyPhoneBtn = screen.getByRole("button", {
      name: /Salin Nomor CS/i,
    });
    await act(async () => {
      fireEvent.click(copyPhoneBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith("0812-3456-7890");
    expect(screen.getByText("Tersalin")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText(/Salin Nomor CS: 0812-3456-7890/i)).toBeInTheDocument();

    // Lapis 3: Tautan WhatsApp Web
    const webBtn = screen.getByRole("link", { name: /Buka WhatsApp Web/i });
    expect(webBtn).toHaveAttribute("target", "_blank");
    expect(webBtn.getAttribute("href")).toContain("web.whatsapp.com/send");
  });

  it("menolak URL phishing berbahaya dan beralih ke instruksi kontak resmi tanpa nomor dummy", () => {
    const maliciousOrder: OrderDetail = {
      ...mockOrder,
      whatsapp_url: "https://phishing-scam.com/wa.me/evil",
      payment: null,
    };

    render(<CodConfirmationCard order={maliciousOrder} />);

    // Tombol 1-klik WA berbahaya TIDAK dirender
    expect(
      screen.queryByRole("link", {
        name: /Konfirmasi Pesanan via WhatsApp 1-Klik/i,
      }),
    ).not.toBeInTheDocument();

    // Menampilkan fallback instruksi ramah dengan link ke /kontak
    expect(
      screen.getByText(/Nomor WhatsApp konfirmasi belum tersedia otomatis/i),
    ).toBeInTheDocument();
    const contactLink = screen.getByRole("link", {
      name: /Hubungi Customer Service di Halaman Kontak/i,
    });
    expect(contactLink).toHaveAttribute("href", "/kontak");

    // Tidak ada nomor dummy yang bocor
    expect(screen.queryByText(/0812-3456-7890/i)).not.toBeInTheDocument();
  });

  it("menerima URL resmi WhatsApp api.whatsapp.com dan web.whatsapp.com", () => {
    const apiOrder: OrderDetail = {
      ...mockOrder,
      whatsapp_url: "https://api.whatsapp.com/send?phone=628999888777&text=Halo",
      payment: null,
    };

    render(<CodConfirmationCard order={apiOrder} />);

    const whatsappBtn = screen.getByRole("link", {
      name: /Konfirmasi Pesanan via WhatsApp 1-Klik/i,
    });
    expect(whatsappBtn).toHaveAttribute(
      "href",
      "https://api.whatsapp.com/send?phone=628999888777&text=Halo",
    );
    expect(screen.getByText(/Salin Nomor CS: 0899-9888-777/i)).toBeInTheDocument();
  });

  it("menangani skenario ketiadaan nomor CS dari server secara ramah tanpa nomor dummy", () => {
    const minimalOrder: OrderDetail = {
      ...mockOrder,
      cod_reference_code: null,
      whatsapp_url: null,
      whatsapp_message: null,
      payment: null,
    };

    render(<CodConfirmationCard order={minimalOrder} />);

    // Tombol 1-klik WA disembunyikan
    expect(
      screen.queryByRole("link", {
        name: /Konfirmasi Pesanan via WhatsApp 1-Klik/i,
      }),
    ).not.toBeInTheDocument();

    // Link ke halaman kontak resmi tersedia
    expect(
      screen.getByText(/Nomor WhatsApp konfirmasi belum tersedia otomatis/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Hubungi Customer Service di Halaman Kontak/i,
      }),
    ).toHaveAttribute("href", "/kontak");

    // Di dalam akordeon: Menampilkan info link /kontak dan tidak ada tombol nomor dummy
    expect(screen.queryByText(/0812-3456-7890/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Nomor WhatsApp CS tidak terlampir/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Halaman Kontak Resmi Toko/i })).toHaveAttribute(
      "href",
      "/kontak",
    );
  });

  it("menangani kegagalan Clipboard API dengan fallback execCommand dan feedback yang ramah", async () => {
    writeTextMock.mockRejectedValue(new Error("Clipboard write permission denied"));

    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execCommandMock,
      writable: true,
      configurable: true,
    });

    render(<CodConfirmationCard order={mockOrder} />);

    const copyBtn = screen.getByRole("button", {
      name: /Salin Teks Pesanan/i,
    });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(execCommandMock).toHaveBeenCalledWith("copy");
    expect(screen.getByText("Tersalin")).toBeInTheDocument();
  });

  it("menampilkan pesan error ramah jika kedua Clipboard API dan execCommand gagal", async () => {
    writeTextMock.mockRejectedValue(new Error("Permission denied"));

    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockImplementation(() => {
        throw new Error("execCommand not supported");
      }),
      writable: true,
      configurable: true,
    });

    render(<CodConfirmationCard order={mockOrder} />);

    const copyBtn = screen.getByRole("button", {
      name: /Salin Teks Pesanan/i,
    });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText("Gagal Menyalin Teks")).toBeInTheDocument();
    expect(
      screen.getByText(/Silakan blok dan salin teks di kotak atas secara manual/i),
    ).toBeInTheDocument();
  });
});
