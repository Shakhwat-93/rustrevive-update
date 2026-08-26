"use client";

import { useEffect, useRef } from "react";
import { AnalyticsTracker } from "@/lib/analytics/tracker";

interface OrderConfirmationTrackerProps {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  currency?: string;
  items: Array<{
    productId: string;
    variantId?: string | null;
    title: string;
    sku?: string;
    price: number;
    quantity: number;
  }>;
}

export function OrderConfirmationTracker({
  orderId,
  orderNumber,
  grandTotal,
  subtotal,
  discountTotal,
  shippingTotal,
  currency = "BDT",
  items,
}: OrderConfirmationTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    AnalyticsTracker.purchase({
      orderId,
      orderNumber,
      eventId: `evt_order_${orderId}`,
      grandTotal,
      subtotal,
      discountTotal,
      shippingTotal,
      currency,
      items,
    });
  }, [orderId, orderNumber, grandTotal, subtotal, discountTotal, shippingTotal, currency, items]);

  return null;
}
