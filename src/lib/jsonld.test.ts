import { describe, it, expect } from "vitest";
import { productJsonLd } from "./jsonld";
import type { ProductDetail } from "./types";

const mockProduct: ProductDetail = {
  id: 1,
  slug: "kaos-rinjani",
  name: "Kaos Ekspedisi Rinjani",
  short_description: "Kaos katun bambu",
  description: "Kaos katun bambu premium edisi Senaru",
  price_min: 150000,
  price_max: 180000,
  price_display: "Rp 150.000",
  is_out_of_stock: false,
  is_placeholder: false,
  badge: "Baru",
  images: [
    {
      url: "https://storage.palorinjani.com/products/kaos-1.jpg",
      alt: "Kaos Ekspedisi Tampak Depan",
    },
  ],
  category: {
    name: "Apparel",
    slug: "apparel",
  },
  variants: [
    {
      id: 101,
      name: "Ukuran",
      attributes: null,
      skus: [
        {
          id: 1001,
          code: "KAOS-RNJ-M",
          price: 150000,
          price_display: null,
          stock: 10,
          is_out_of_stock: false,
          is_active: true,
        },
        {
          id: 1002,
          code: "KAOS-RNJ-XL",
          price: 180000,
          price_display: null,
          stock: 5,
          is_out_of_stock: false,
          is_active: true,
        },
      ],
    },
  ],
};

describe("productJsonLd", () => {
  it("generates complete and valid Google Rich Results AggregateOffer schema", () => {
    const result = productJsonLd({ product: mockProduct });
    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("Product");
    expect(result!.name).toBe("Kaos Ekspedisi Rinjani");

    const offers = result!.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("AggregateOffer");
    expect(offers.priceCurrency).toBe("IDR");
    expect(offers.price).toBe(150000);
    expect(offers.lowPrice).toBe(150000);
    expect(offers.highPrice).toBe(180000);
    expect(offers.offerCount).toBe(2);
    expect(offers.availability).toBe("https://schema.org/InStock");
    expect(offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(offers.seller).toEqual({
      "@type": "Organization",
      name: "Palo Mountain Goods",
    });
  });

  it("omits highPrice when price_min equals price_max", () => {
    const singlePriceProduct: ProductDetail = {
      ...mockProduct,
      price_min: 150000,
      price_max: 150000,
    };
    const result = productJsonLd({ product: singlePriceProduct });
    const offers = result!.offers as Record<string, unknown>;

    expect(offers.price).toBe(150000);
    expect(offers.lowPrice).toBe(150000);
    expect(offers.highPrice).toBeUndefined();
  });

  it("sets OutOfStock availability when product.is_out_of_stock is true", () => {
    const oosProduct: ProductDetail = {
      ...mockProduct,
      is_out_of_stock: true,
    };
    const result = productJsonLd({ product: oosProduct });
    const offers = result!.offers as Record<string, unknown>;

    expect(offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits offers and sku when product is a placeholder per PRD §1.1A", () => {
    const placeholderProduct: ProductDetail = {
      ...mockProduct,
      is_placeholder: true,
    };
    const result = productJsonLd({ product: placeholderProduct });
    expect(result).not.toBeNull();
    expect(result!.offers).toBeUndefined();
    expect(result!.sku).toBeUndefined();
  });
});
