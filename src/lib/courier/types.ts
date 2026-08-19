import type { DeliveryStatus } from "@/types/database.types";

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    area?: string;
    postalCode?: string;
  };
  codAmount: number; // in BDT
  totalWeightGrams?: number;
  itemCount: number;
  instructions?: string;
}

export interface ShipmentResult {
  trackingNumber: string;
  shipmentReference: string;
  labelUrl?: string;
  status: DeliveryStatus;
  rawResponse?: Record<string, unknown>;
}

export interface TrackingTimelineEntry {
  status: DeliveryStatus;
  message: string;
  timestamp: string;
  location?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  courierName: string;
  status: DeliveryStatus;
  estimatedDelivery?: string;
  timeline: TrackingTimelineEntry[];
}

export interface WebhookPayload {
  rawBody: string;
  headers: Record<string, string>;
  parsedBody: Record<string, unknown>;
}

export interface NormalizedWebhookEvent {
  isValid: boolean;
  trackingNumber?: string;
  shipmentReference?: string;
  normalizedStatus?: DeliveryStatus;
  message?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
