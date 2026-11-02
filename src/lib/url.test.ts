import { describe, it, expect } from "vitest";
import { safeExternalUrl, safeWhatsappUrl, paymentRedirectUrl } from "./url";

describe("url utilities", () => {
  describe("safeExternalUrl", () => {
    it("menerima URL http dan https yang valid", () => {
      expect(safeExternalUrl("https://example.com")).toBe("https://example.com/");
      expect(safeExternalUrl("http://example.com/path")).toBe("http://example.com/path");
    });

    it("menolak skema berbahaya atau tidak valid", () => {
      expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
      expect(safeExternalUrl("data:text/html,<h1>test</h1>")).toBeNull();
      expect(safeExternalUrl("//contoh.com")).toBeNull();
      expect(safeExternalUrl("/relative/path")).toBeNull();
      expect(safeExternalUrl(null)).toBeNull();
      expect(safeExternalUrl(undefined)).toBeNull();
      expect(safeExternalUrl("")).toBeNull();
    });
  });

  describe("safeWhatsappUrl", () => {
    it("menerima domain resmi WhatsApp (wa.me, api.whatsapp.com, web.whatsapp.com)", () => {
      expect(safeWhatsappUrl("https://wa.me/6281234567890")).toBe("https://wa.me/6281234567890");
      expect(safeWhatsappUrl("https://wa.me/6281234567890?text=Halo")).toBe(
        "https://wa.me/6281234567890?text=Halo",
      );
      expect(safeWhatsappUrl("https://api.whatsapp.com/send?phone=6281234567890")).toBe(
        "https://api.whatsapp.com/send?phone=6281234567890",
      );
      expect(safeWhatsappUrl("https://web.whatsapp.com/send?phone=6281234567890")).toBe(
        "https://web.whatsapp.com/send?phone=6281234567890",
      );
      // Case-insensitive
      expect(safeWhatsappUrl("HTTPS://WA.ME/6281234567890")).toBe("https://wa.me/6281234567890");
      expect(safeWhatsappUrl("https://API.WHATSAPP.COM/send?phone=6281234567890")).toBe(
        "https://api.whatsapp.com/send?phone=6281234567890",
      );
    });

    it("menolak domain berbahaya / phishing yang mirip WhatsApp", () => {
      expect(safeWhatsappUrl("https://evil-wa.me/6281234567890")).toBeNull();
      expect(safeWhatsappUrl("https://wa.me.attacker.com/6281234567890")).toBeNull();
      expect(safeWhatsappUrl("https://phishing.com/wa.me")).toBeNull();
      expect(safeWhatsappUrl("https://whatsapp.com/login")).toBeNull();
      expect(safeWhatsappUrl("https://fakewhatsapp.com")).toBeNull();
    });

    it("menolak skema non-http(s) dan input kosong", () => {
      expect(safeWhatsappUrl("javascript:alert(1)")).toBeNull();
      expect(safeWhatsappUrl("data:text/html,<h1>test</h1>")).toBeNull();
      expect(safeWhatsappUrl("")).toBeNull();
      expect(safeWhatsappUrl(null)).toBeNull();
      expect(safeWhatsappUrl(undefined)).toBeNull();
    });
  });

  describe("paymentRedirectUrl", () => {
    it("mengembalikan URL pembayaran dari source yang valid", () => {
      expect(
        paymentRedirectUrl({ payment_url: "https://pay.doku.com/checkout/123" }),
      ).toBe("https://pay.doku.com/checkout/123");
    });
  });
});
