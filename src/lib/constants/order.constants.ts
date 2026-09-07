import type { OrderStatus } from "@/types/database.types";

/**
 * Strict Order State Machine Transitions Rules
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED", "REFUNDED"],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

/**
 * Canonical Ecommerce Lifecycle Tracking Event Names
 */
export const LIFECYCLE_TRACKING_EVENTS = {
  DELIVERED: "Delivered",
  CANCELLED_AFTER_DELIVERY_HANDOVER: "CancelledAfterDelivery",
} as const;

export type LifecycleTrackingEvent =
  (typeof LIFECYCLE_TRACKING_EVENTS)[keyof typeof LIFECYCLE_TRACKING_EVENTS];
