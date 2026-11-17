import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { ProductListItem } from "@/lib/types";

function makeProduct(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 1,
    name: "Kaos Rinjani",
    slug: "kaos-rinjani",
    is_placeholder: false,
    short_description: "Kaos penjelajahan.",
    price_min: 150000,
    price_max: 150000,
    price_display: "Rp 150.000",
    is_out_of_stock: false,
    badge: null,
    badge_tone: "neutral",
    sizes: ["M", "L"],
    image: {
      url: "https://staging.palorinjani.com/storage/media/kaos.webp",
      alt: "Kaos Rinjani",
    },
    category: {
      name: "Apparel",
      slug: "apparel",
    },
    ...overrides,
  };
}

describe("ProductCard", () => {
  it('menampilkan "Katalog" dan tidak pernah menampilkan "[Nama Koleksi]" saat category null', () => {
    render(<ProductCard product={makeProduct({ category: null })} />);

    expect(screen.getByText("Katalog")).toBeInTheDocument();
    expect(screen.queryByText(/\[Nama Koleksi\]/i)).not.toBeInTheDocument();
  });

  it('menampilkan "Katalog" saat category.name kosong atau hanya spasi', () => {
    const { rerender } = render(
      <ProductCard
        product={makeProduct({ category: { name: "", slug: "apparel" } })}
      />,
    );

    expect(screen.getByText("Katalog")).toBeInTheDocument();
    expect(screen.queryByText(/\[Nama Koleksi\]/i)).not.toBeInTheDocument();

    rerender(
      <ProductCard
        product={makeProduct({ category: { name: "   ", slug: "apparel" } })}
      />,
    );

    expect(screen.getByText("Katalog")).toBeInTheDocument();
    expect(screen.queryByText(/\[Nama Koleksi\]/i)).not.toBeInTheDocument();
  });

  it("menampilkan nama kategori saat category.name terisi", () => {
    render(
      <ProductCard
        product={makeProduct({ category: { name: "Apparel", slug: "apparel" } })}
      />,
    );

    expect(screen.getByText("Apparel")).toBeInTheDocument();
    expect(screen.queryByText("Katalog")).not.toBeInTheDocument();
    expect(screen.queryByText(/\[Nama Koleksi\]/i)).not.toBeInTheDocument();
  });
});
