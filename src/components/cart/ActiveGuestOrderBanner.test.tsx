import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActiveGuestOrderBanner } from "./ActiveGuestOrderBanner";
import * as storefrontActions from "@/actions/storefront";

vi.mock("@/actions/storefront", () => ({
  cancelGuestOrderAction: vi.fn(),
  getGuestOrderStatusAction: vi.fn(),
}));

const ACTIVE_GUEST_ORDER_KEY = "palorinjani_active_guest_order";

const mockHandoff = {
  reference_code: "REF12345",
  order_number: "PRJ-20261103-0001",
  wa_url: "https://wa.me/628123456789",
  notice: "Silakan lanjutkan konfirmasi pesanan ke WhatsApp CS.",
  estimated_total: 150000,
  estimated_total_display: "Rp 150.000",
};

describe("ActiveGuestOrderBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function setSessionStorageHandoff() {
    sessionStorage.setItem(
      ACTIVE_GUEST_ORDER_KEY,
      JSON.stringify({
        handoff: mockHandoff,
        timestamp: Date.now(),
      }),
    );
  }

  it("renders banner when valid handoff exists in sessionStorage", async () => {
    setSessionStorageHandoff();
    vi.mocked(storefrontActions.getGuestOrderStatusAction).mockResolvedValue({
      ok: true,
      data: {
        order_number: "PRJ-20261103-0001",
        reference_code: "REF12345",
        status: "awaiting_confirmation",
        status_label: "Menunggu Konfirmasi CS",
        can_cancel: true,
        payment_method: "whatsapp",
        total: 150000,
        created_at: null,
        confirmed_at: null,
      },
    });

    render(<ActiveGuestOrderBanner />);

    expect(screen.getByRole("region", { name: "Pesanan Tamu Aktif" })).toBeInTheDocument();
    expect(screen.getByText("PRJ-20261103-0001")).toBeInTheDocument();
    expect(screen.getByText("REF12345")).toBeInTheDocument();
  });

  it("dismisses banner and removes item from sessionStorage when manual close button is clicked", async () => {
    setSessionStorageHandoff();
    vi.mocked(storefrontActions.getGuestOrderStatusAction).mockResolvedValue({
      ok: true,
      data: {
        order_number: "PRJ-20261103-0001",
        reference_code: "REF12345",
        status: "awaiting_confirmation",
        status_label: "Menunggu Konfirmasi CS",
        can_cancel: true,
        payment_method: "whatsapp",
        total: 150000,
        created_at: null,
        confirmed_at: null,
      },
    });

    render(<ActiveGuestOrderBanner />);

    const closeButton = screen.getByRole("button", {
      name: "Tutup pemberitahuan pesanan",
    });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);

    expect(sessionStorage.getItem(ACTIVE_GUEST_ORDER_KEY)).toBeNull();
    expect(screen.queryByRole("region", { name: "Pesanan Tamu Aktif" })).not.toBeInTheDocument();
  });

  it("auto-heals on mount if order is already processed or completed in backend", async () => {
    setSessionStorageHandoff();
    vi.mocked(storefrontActions.getGuestOrderStatusAction).mockResolvedValue({
      ok: true,
      data: {
        order_number: "PRJ-20261103-0001",
        reference_code: "REF12345",
        status: "processing",
        status_label: "Diproses",
        can_cancel: false,
        payment_method: "whatsapp",
        total: 150000,
        created_at: null,
        confirmed_at: null,
      },
    });

    render(<ActiveGuestOrderBanner />);

    await waitFor(() => {
      expect(sessionStorage.getItem(ACTIVE_GUEST_ORDER_KEY)).toBeNull();
      expect(screen.queryByRole("region", { name: "Pesanan Tamu Aktif" })).not.toBeInTheDocument();
      expect(screen.getByText(/Pesananmu telah dikonfirmasi dan diproses/i)).toBeInTheDocument();
    });
  });

  it("auto-heals when cancellation fails because order is already processed", async () => {
    setSessionStorageHandoff();
    vi.mocked(storefrontActions.getGuestOrderStatusAction).mockResolvedValue({
      ok: true,
      data: {
        order_number: "PRJ-20261103-0001",
        reference_code: "REF12345",
        status: "awaiting_confirmation",
        status_label: "Menunggu Konfirmasi CS",
        can_cancel: true,
        payment_method: "whatsapp",
        total: 150000,
        created_at: null,
        confirmed_at: null,
      },
    });

    vi.mocked(storefrontActions.cancelGuestOrderAction).mockResolvedValue({
      ok: false,
      kind: "validation",
      message: "Pesanan tidak dalam status menunggu konfirmasi sehingga tidak dapat dibatalkan.",
      fieldErrors: {},
    });

    render(<ActiveGuestOrderBanner />);

    const cancelTrigger = screen.getByRole("button", { name: "Batalkan Pesanan" });
    fireEvent.click(cancelTrigger);

    const confirmButton = screen.getByRole("button", { name: "Ya, Batalkan Pesanan" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(sessionStorage.getItem(ACTIVE_GUEST_ORDER_KEY)).toBeNull();
      expect(screen.queryByRole("region", { name: "Pesanan Tamu Aktif" })).not.toBeInTheDocument();
      expect(
        screen.getByText(
          /Pesananmu sudah diproses atau diselesaikan oleh tim Customer Service kami, sehingga kartu pesanan aktif telah dibersihkan./i,
        ),
      ).toBeInTheDocument();
    });
  });
});
