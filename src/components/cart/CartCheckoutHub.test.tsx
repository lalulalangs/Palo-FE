import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartCheckoutHub } from "./CartCheckoutHub";
import type { CartItem, CartSummary } from "@/lib/types";

const mockSummary: CartSummary = {
  item_count: 2,
  subtotal: 350000,
  subtotal_display: "Rp 350.000",
};

const mockItems: CartItem[] = [
  {
    sku_id: 1,
    product_name: "Kaos Rinjani",
    product_slug: "kaos-rinjani",
    variant_name: "Hitam / L",
    sku_code: "KR-BLK-L",
    unit_price: 175000,
    unit_price_display: "Rp 175.000",
    quantity: 2,
    subtotal: 350000,
    subtotal_display: "Rp 350.000",
    image: null,
    available_stock: 10,
    is_out_of_stock: false,
  },
];

describe("CartCheckoutHub", () => {
  it("renders compact summary header correctly", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={false}
        blockedLength={0}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ringkasan pesanan" })).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 350.000").length).toBeGreaterThan(0);
    expect(screen.getByText("Dihitung saat konfirmasi")).toBeInTheDocument();
  });

  it("defaults to WhatsApp tab when user is a guest (!isLoggedIn)", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={false}
        blockedLength={0}
      />,
    );

    const waTab = screen.getByRole("tab", { name: /Lewat WhatsApp/i });
    const onlineTab = screen.getByRole("tab", { name: /Bayar Online/i });

    expect(waTab).toHaveAttribute("aria-selected", "true");
    expect(onlineTab).toHaveAttribute("aria-selected", "false");
  });

  it("defaults to Online tab when user is logged in (isLoggedIn=true)", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={true}
        blockedLength={0}
      />,
    );

    const waTab = screen.getByRole("tab", { name: /Lewat WhatsApp/i });
    const onlineTab = screen.getByRole("tab", { name: /Bayar Online/i });

    expect(waTab).toHaveAttribute("aria-selected", "false");
    expect(onlineTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Keuntungan Bayar Online/i)).toBeInTheDocument();
  });

  it("allows switching tabs by clicking", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={false}
        blockedLength={0}
      />,
    );

    const onlineTab = screen.getByRole("tab", { name: /Bayar Online/i });
    fireEvent.click(onlineTab);

    expect(onlineTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Keuntungan Bayar Online/i)).toBeInTheDocument();
  });

  it("renders stock blocked warning and disables online CTA when blockedLength > 0", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={true}
        blockedReason="Yuk, kurangi jumlah produk yang melebihi sisa stok."
        blockedLength={1}
      />,
    );

    expect(
      screen.getByText("Yuk, kurangi jumlah produk yang melebihi sisa stok."),
    ).toBeInTheDocument();

    const onlineBtn = screen.getByRole("button", {
      name: /Lanjut ke checkout online/i,
    });
    expect(onlineBtn).toBeDisabled();
  });

  it("supports keyboard navigation with ArrowRight and ArrowLeft", () => {
    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={false}
        blockedLength={0}
      />,
    );

    const waTab = screen.getByRole("tab", { name: /Lewat WhatsApp/i });
    const onlineTab = screen.getByRole("tab", { name: /Bayar Online/i });

    expect(waTab).toHaveAttribute("aria-selected", "true");

    // Navigate to online tab via ArrowRight
    fireEvent.keyDown(waTab, { key: "ArrowRight" });
    expect(onlineTab).toHaveAttribute("aria-selected", "true");
    expect(waTab).toHaveAttribute("aria-selected", "false");

    // Navigate back to wa tab via ArrowLeft
    fireEvent.keyDown(onlineTab, { key: "ArrowLeft" });
    expect(waTab).toHaveAttribute("aria-selected", "true");
    expect(onlineTab).toHaveAttribute("aria-selected", "false");
  });

  it("renders dynamic courier options when couriers prop is provided", () => {
    const mockCouriers = [
      { id: "jne", name: "JNE", label: "JNE", desc: "Reguler / YES" },
      { id: "pos", name: "POS Indonesia", label: "POS Indonesia", desc: "Kilat Khusus" },
    ];

    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={false}
        blockedLength={0}
        couriers={mockCouriers}
      />,
    );

    expect(screen.getByText("POS Indonesia")).toBeInTheDocument();
    expect(screen.getByText("Kilat Khusus")).toBeInTheDocument();
  });

  it("updates online benefit courier copywriting dynamically", () => {
    const mockCouriers = [
      { id: "jne", name: "JNE", label: "JNE", desc: "Reguler / YES" },
      { id: "pos", name: "POS Indonesia", label: "POS Indonesia", desc: "Kilat Khusus" },
    ];

    render(
      <CartCheckoutHub
        items={mockItems}
        summary={mockSummary}
        isLoggedIn={true}
        blockedLength={0}
        couriers={mockCouriers}
      />,
    );

    expect(
      screen.getByText(/Hitung ongkos kirim real-time langsung dari berbagai ekspedisi resmi \(JNE, POS Indonesia\)\./i),
    ).toBeInTheDocument();
  });
});
