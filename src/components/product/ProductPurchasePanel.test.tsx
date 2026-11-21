import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import type { ProductDetail } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/cart-actions", () => ({
  addSkuToCartAction: vi.fn(),
}));

function makeProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 1,
    name: "PALO LONG SLEEVE ROUTE BLACK WASH",
    slug: "palo-long-sleeve-route-black-wash",
    is_placeholder: false,
    short_description: "Kaos lengan panjang.",
    description: "Kaos lengan panjang nyaman dipakai harian.",
    price_min: 195000,
    price_max: 195000,
    price_display: "Rp 195.000",
    is_out_of_stock: false,
    badge: null,
    images: [],
    category: {
      name: "Apparel",
      slug: "apparel",
    },
    variants: [
      {
        id: 10,
        name: "Size M",
        attributes: { size: "M" },
        skus: [
          {
            id: 100,
            code: "PL-LS-M",
            stock: 5,
            price: 195000,
            price_display: "Rp 195.000",
            is_out_of_stock: false,
            is_active: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("ProductPurchasePanel", () => {
  it("tidak merender badge spesifikasi bahan palsu/hardcoded", () => {
    render(<ProductPurchasePanel product={makeProduct()} />);

    expect(
      screen.queryByLabelText("Spesifikasi cepat bahan"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Cotton Combed 32s")).not.toBeInTheDocument();
    expect(screen.queryByText("180 GSM")).not.toBeInTheDocument();
    expect(screen.queryByText("Oversized Boxy Fit")).not.toBeInTheDocument();
    expect(screen.queryByText("Stone Wash")).not.toBeInTheDocument();
  });
});
