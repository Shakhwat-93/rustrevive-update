"use client";

import type { PublicTrackingConfig } from "@/lib/services/marketing-tracking.service";

declare global {
  interface Window {
    dataLayer?: any[];
    fbq?: any;
    ttq?: any;
    gtag?: any;
    __rr_tracking_config?: PublicTrackingConfig;
    __rr_tracked_events?: Set<string>;
  }
}

export interface EcommerceItem {
  productId: string;
  variantId?: string | null;
  title: string;
  category?: string;
  sku?: string;
  price: number;
  quantity: number;
}

export interface PurchaseOrderPayload {
  orderId: string;
  orderNumber: string;
  eventId?: string;
  grandTotal: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  currency?: string;
  items: EcommerceItem[];
}

/**
 * Generate a cryptographically random or timestamp-based event ID for deduplication
 */
export function generateEventId(prefix: string = "evt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Initialize / ensure window.dataLayer exists
 */
function getDataLayer(): any[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/**
 * Event Deduplication Guard
 */
function hasEventFired(eventId: string): boolean {
  if (typeof window === "undefined") return false;
  window.__rr_tracked_events = window.__rr_tracked_events || new Set<string>();
  if (window.__rr_tracked_events.has(eventId)) return true;
  window.__rr_tracked_events.add(eventId);
  return false;
}

/**
 * Centralized Client Analytics Tracker
 */
export class AnalyticsTracker {
  /**
   * 1. PageView
   */
  public static pageView(url: string, title?: string) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("pv");
    const dataLayer = getDataLayer();

    // DataLayer / GTM
    dataLayer.push({
      event: "page_view",
      event_id: eventId,
      page_location: url,
      page_title: title || (typeof document !== "undefined" ? document.title : ""),
    });

    // Meta Pixel
    if (window.fbq) {
      window.fbq("track", "PageView", {}, { eventID: eventId });
    }

    // TikTok Pixel
    if (window.ttq) {
      window.ttq.page();
    }

    if (window.__rr_tracking_config?.debugTrackingEnabled) {
      console.log(`[Analytics Debug] PageView fired: ${url} (EventID: ${eventId})`);
    }
  }

  /**
   * 2. ViewContent (Product Page View)
   */
  public static viewContent(item: EcommerceItem) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("vc");
    const currency = "BDT";
    const dataLayer = getDataLayer();

    // GA4 / GTM
    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
    dataLayer.push({
      event: "view_item",
      event_id: eventId,
      ecommerce: {
        currency,
        value: item.price,
        items: [
          {
            item_id: item.variantId || item.productId,
            item_name: item.title,
            item_category: item.category || "Apparel",
            price: item.price,
            quantity: 1,
          },
        ],
      },
    });

    // Meta Pixel
    if (window.fbq) {
      window.fbq(
        "track",
        "ViewContent",
        {
          content_ids: [item.variantId || item.productId],
          content_name: item.title,
          content_category: item.category || "Apparel",
          content_type: "product",
          value: item.price,
          currency,
        },
        { eventID: eventId }
      );
    }

    // TikTok Pixel
    if (window.ttq) {
      window.ttq.track(
        "ViewContent",
        {
          content_id: item.variantId || item.productId,
          content_type: "product",
          content_name: item.title,
          price: item.price,
          quantity: 1,
          currency,
          value: item.price,
        },
        { event_id: eventId }
      );
    }

    if (window.__rr_tracking_config?.debugTrackingEnabled) {
      console.log(`[Analytics Debug] ViewContent: ${item.title} (EventID: ${eventId})`);
    }
  }

  /**
   * 3. AddToCart
   */
  public static addToCart(item: EcommerceItem) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("atc");
    const currency = "BDT";
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "add_to_cart",
      event_id: eventId,
      ecommerce: {
        currency,
        value: item.price * item.quantity,
        items: [
          {
            item_id: item.variantId || item.productId,
            item_name: item.title,
            item_category: item.category || "Apparel",
            price: item.price,
            quantity: item.quantity,
          },
        ],
      },
    });

    if (window.fbq) {
      window.fbq(
        "track",
        "AddToCart",
        {
          content_ids: [item.variantId || item.productId],
          content_name: item.title,
          content_type: "product",
          value: item.price * item.quantity,
          currency,
        },
        { eventID: eventId }
      );
    }

    if (window.ttq) {
      window.ttq.track(
        "AddToCart",
        {
          content_id: item.variantId || item.productId,
          content_type: "product",
          content_name: item.title,
          price: item.price,
          quantity: item.quantity,
          currency,
          value: item.price * item.quantity,
        },
        { event_id: eventId }
      );
    }

    if (window.__rr_tracking_config?.debugTrackingEnabled) {
      console.log(`[Analytics Debug] AddToCart: ${item.title} x ${item.quantity} (EventID: ${eventId})`);
    }
  }

  /**
   * 4. RemoveFromCart
   */
  public static removeFromCart(item: EcommerceItem) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("rfc");
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "remove_from_cart",
      event_id: eventId,
      ecommerce: {
        currency: "BDT",
        value: item.price * item.quantity,
        items: [
          {
            item_id: item.variantId || item.productId,
            item_name: item.title,
            price: item.price,
            quantity: item.quantity,
          },
        ],
      },
    });
  }

  /**
   * 5. ViewCart
   */
  public static viewCart(items: EcommerceItem[], total: number) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("vc_cart");
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "view_cart",
      event_id: eventId,
      ecommerce: {
        currency: "BDT",
        value: total,
        items: items.map((i) => ({
          item_id: i.variantId || i.productId,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  }

  /**
   * 6. InitiateCheckout
   */
  public static initiateCheckout(items: EcommerceItem[], total: number) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("ic");
    const currency = "BDT";
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "begin_checkout",
      event_id: eventId,
      ecommerce: {
        currency,
        value: total,
        items: items.map((i) => ({
          item_id: i.variantId || i.productId,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });

    if (window.fbq) {
      window.fbq(
        "track",
        "InitiateCheckout",
        {
          content_ids: items.map((i) => i.variantId || i.productId),
          content_type: "product",
          num_items: items.reduce((s, i) => s + i.quantity, 0),
          value: total,
          currency,
        },
        { eventID: eventId }
      );
    }

    if (window.ttq) {
      window.ttq.track(
        "InitiateCheckout",
        {
          contents: items.map((i) => ({
            content_id: i.variantId || i.productId,
            content_name: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
          currency,
          value: total,
        },
        { event_id: eventId }
      );
    }

    if (window.__rr_tracking_config?.debugTrackingEnabled) {
      console.log(`[Analytics Debug] InitiateCheckout: Total ৳${total} (EventID: ${eventId})`);
    }
  }

  /**
   * 7. AddShippingInfo
   */
  public static addShippingInfo(items: EcommerceItem[], total: number, shippingMethod: string) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("asi");
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "add_shipping_info",
      event_id: eventId,
      ecommerce: {
        currency: "BDT",
        value: total,
        shipping_tier: shippingMethod,
        items: items.map((i) => ({
          item_id: i.variantId || i.productId,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  }

  /**
   * 8. AddPaymentInfo
   */
  public static addPaymentInfo(items: EcommerceItem[], total: number, paymentMethod: string) {
    if (typeof window === "undefined") return;

    const eventId = generateEventId("api");
    const dataLayer = getDataLayer();

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "add_payment_info",
      event_id: eventId,
      ecommerce: {
        currency: "BDT",
        value: total,
        payment_type: paymentMethod,
        items: items.map((i) => ({
          item_id: i.variantId || i.productId,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  }

  /**
   * 9. Purchase (CRITICAL - Deduplicated with Exact Event ID)
   */
  public static purchase(order: PurchaseOrderPayload) {
    if (typeof window === "undefined") return;

    // Use existing eventId attached to order or fallback to deterministic order ID
    const eventId = order.eventId || `evt_order_${order.orderId}`;

    // Prevent duplicate fires on page refresh or component re-mounts
    if (hasEventFired(eventId)) {
      if (window.__rr_tracking_config?.debugTrackingEnabled) {
        console.warn(`[Analytics Debug] Duplicate Purchase event prevented for EventID: ${eventId}`);
      }
      return;
    }

    const currency = order.currency || "BDT";
    const dataLayer = getDataLayer();

    // GA4 / GTM standard schema
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "purchase",
      event_id: eventId,
      ecommerce: {
        transaction_id: order.orderNumber,
        value: order.grandTotal,
        tax: 0,
        shipping: order.shippingTotal,
        currency,
        coupon: order.discountTotal > 0 ? "COUPON" : undefined,
        items: order.items.map((i) => ({
          item_id: i.variantId || i.productId,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });

    // Meta Pixel (Exact matching eventID with Meta CAPI)
    if (window.fbq) {
      window.fbq(
        "track",
        "Purchase",
        {
          content_ids: order.items.map((i) => i.variantId || i.productId),
          content_type: "product",
          value: order.grandTotal,
          currency,
          num_items: order.items.reduce((s, i) => s + i.quantity, 0),
          order_id: order.orderNumber,
        },
        { eventID: eventId }
      );
    }

    // TikTok Pixel (Matching event_id with TikTok Events API)
    if (window.ttq) {
      window.ttq.track(
        "CompletePayment",
        {
          contents: order.items.map((i) => ({
            content_id: i.variantId || i.productId,
            content_name: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
          value: order.grandTotal,
          currency,
        },
        { event_id: eventId }
      );
    }

    if (window.__rr_tracking_config?.debugTrackingEnabled) {
      console.log(`[Analytics Debug] Purchase Fired: Order #${order.orderNumber} (EventID: ${eventId})`);
    }
  }
}
