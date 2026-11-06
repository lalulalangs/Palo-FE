import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics";

describe("analytics trackEvent", () => {
  beforeEach(() => {
    window.dataLayer = [];
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  afterEach(() => {
    delete window.dataLayer;
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("merekam track_whatsapp_click ke dataLayer", () => {
    trackEvent({
      event: "track_whatsapp_click",
      placement: "fab_home",
      label: "Floating WhatsApp Button",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "track_whatsapp_click",
        placement: "fab_home",
        label: "Floating WhatsApp Button",
      },
    ]);
  });

  it("memanggil window.gtag saat gtag tersedia", () => {
    const gtagMock = vi.fn();
    window.gtag = gtagMock;

    trackEvent({
      event: "add_to_cart",
      sku_id: 12,
      product_name: "Kaos Rinjani",
      price: 150000,
      quantity: 2,
    });

    expect(window.dataLayer).toHaveLength(1);
    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith("event", "add_to_cart", {
      sku_id: 12,
      product_name: "Kaos Rinjani",
      price: 150000,
      quantity: 2,
    });
  });

  it("merekam form_submit status success dan error", () => {
    trackEvent({
      event: "form_submit",
      form_name: "guest_checkout",
      status: "success",
    });

    trackEvent({
      event: "form_submit",
      form_name: "guest_checkout",
      status: "error",
      error_message: "Stok tidak cukup",
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer?.[0]).toEqual({
      event: "form_submit",
      form_name: "guest_checkout",
      status: "success",
    });
    expect(window.dataLayer?.[1]).toEqual({
      event: "form_submit",
      form_name: "guest_checkout",
      status: "error",
      error_message: "Stok tidak cukup",
    });
  });

  it("merekam begin_checkout event", () => {
    trackEvent({
      event: "begin_checkout",
      item_count: 3,
      subtotal: 450000,
    });

    expect(window.dataLayer?.[0]).toEqual({
      event: "begin_checkout",
      item_count: 3,
      subtotal: 450000,
    });
  });
});
