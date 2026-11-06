import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  organizationJsonLd,
  productJsonLd,
  webSiteJsonLd,
} from "./jsonld";
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

describe("normalizePhoneNumber", () => {
  it("normalizes leading 08 to +628", () => {
    expect(normalizePhoneNumber("08123456789")).toBe("+628123456789");
  });

  it("normalizes leading 628 to +628", () => {
    expect(normalizePhoneNumber("628123456789")).toBe("+628123456789");
  });

  it("preserves phone numbers already with + prefix", () => {
    expect(normalizePhoneNumber("+628123456789")).toBe("+628123456789");
  });
});

describe("organizationJsonLd", () => {
  it("generates hybrid omnichannel ClothingStore and OnlineStore schema", () => {
    const result = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: "halo@palorinjani.com",
      instagramUrl: "https://instagram.com/palorinjani",
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: "081234567890",
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toEqual(["ClothingStore", "OnlineStore"]);
    expect(result["@id"]).toBe("https://palorinjani.com/#store");
    expect(result.alternateName).toBe("PALORINJANI");
    expect(result.priceRange).toBe("$$");
    expect(result.currenciesAccepted).toBe("IDR");
    expect(result.paymentAccepted).toBe("Cash, QRIS, Bank Transfer, Online Payment");
    expect(result.hasMap).toBe("https://maps.app.goo.gl/E5vjb4TYu3x9obSR9");
  });

  it("includes correct geo coordinates and opening hours", () => {
    const result = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: null,
    });

    expect(result.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: -8.3013169,
      longitude: 116.4080834,
    });

    expect(result.openingHours).toBe("Mo-Su 08:00-21:00");
    expect(result.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "21:00",
      },
    ]);
  });

  it("normalizes Indonesian phone number (08xx) to E.164 (+628xx)", () => {
    const result = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: "cs@palorinjani.com",
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: "08123456789",
    });

    expect(result.telephone).toBe("+628123456789");
    const contactPoints = result.contactPoint as Array<Record<string, unknown>>;
    expect(contactPoints[0].telephone).toBe("+628123456789");
    expect(contactPoints[0].email).toBe("cs@palorinjani.com");
  });

  it("preserves already formatted E.164 phone numbers", () => {
    const result = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: "+628987654321",
    });

    expect(result.telephone).toBe("+628987654321");
  });

  it("provides structured logo and image with correct fallbacks", () => {
    const withFallback = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: null,
    });

    expect(withFallback.image).toBe("https://palorinjani.com/og-image.png");
    expect(withFallback.logo).toEqual({
      "@type": "ImageObject",
      "@id": "https://palorinjani.com/#logo",
      url: "https://palorinjani.com/palo-rinjani-logo.png",
      caption: "Logo Palo Mountain Goods",
    });

    const withCustom = organizationJsonLd({
      brandName: "Custom Brand",
      logoUrl: "/custom-logo.png",
      address: null,
      email: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: null,
    });

    expect(withCustom.image).toBe("https://palorinjani.com/custom-logo.png");
    expect(withCustom.logo).toEqual({
      "@type": "ImageObject",
      "@id": "https://palorinjani.com/#logo",
      url: "https://palorinjani.com/custom-logo.png",
      caption: "Logo Custom Brand",
    });
  });

  it("uses default address when options.address is null", () => {
    const result = organizationJsonLd({
      brandName: "Palo Mountain Goods",
      logoUrl: null,
      address: null,
      email: null,
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      whatsapp: null,
    });

    expect(result.address).toEqual({
      "@type": "PostalAddress",
      streetAddress:
        "Jl. Pariwisata Senaru, Bayan, Lombok Utara, Nusa Tenggara Barat",
      addressLocality: "Lombok Utara",
      addressRegion: "Nusa Tenggara Barat",
      postalCode: "83354",
      addressCountry: "ID",
    });
  });
});

describe("webSiteJsonLd", () => {
  it("points publisher to #store", () => {
    const result = webSiteJsonLd();
    expect(result.publisher).toEqual({
      "@id": "https://palorinjani.com/#store",
    });
  });
});
