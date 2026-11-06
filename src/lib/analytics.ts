export type TrackWhatsAppClickEvent = {
  event: "track_whatsapp_click";
  placement: string;
  label?: string;
  phone_number?: string;
};

export type FormSubmitEvent = {
  event: "form_submit";
  form_name: string;
  status: "success" | "error";
  error_message?: string;
};

export type AddToCartEvent = {
  event: "add_to_cart";
  sku_id: number;
  product_name: string;
  price: number;
  quantity: number;
};

export type BeginCheckoutEvent = {
  event: "begin_checkout";
  item_count: number;
  subtotal: number;
};

export type AnalyticsEvent =
  | TrackWhatsAppClickEvent
  | FormSubmitEvent
  | AddToCartEvent
  | BeginCheckoutEvent;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (
      command: "event",
      eventName: string,
      eventParams?: Record<string, unknown>,
    ) => void;
  }
}

/**
 * Merekam event analitik browser ke window.dataLayer dan window.gtag (GA4).
 * Aman dipanggil di server-side rendering (no-op jika window undefined).
 */
export function trackEvent(payload: AnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload as unknown as Record<string, unknown>);

  if (typeof (window as unknown as { gtag?: unknown }).gtag === "function") {
    const { event, ...params } = payload;
    window.gtag!("event", event, params);
  }
}
