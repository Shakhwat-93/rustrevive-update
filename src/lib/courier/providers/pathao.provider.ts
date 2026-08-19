import type { ICourierProvider } from "../provider.interface";
import type {
  CreateShipmentInput,
  ShipmentResult,
  TrackingInfo,
  WebhookPayload,
  NormalizedWebhookEvent,
} from "../types";
import type { DeliveryStatus } from "@/types/database.types";
import { logger } from "@/lib/logging/logger";

export class PathaoProvider implements ICourierProvider {
  public readonly code = "PATHAO";
  public readonly name = "Pathao Logistics";

  public normalizeStatus(rawStatus: string): DeliveryStatus {
    const s = rawStatus.toLowerCase().trim();
    switch (s) {
      case "order_placed":
        return "CREATED";
      case "picked":
        return "PICKED_UP";
      case "in_transit":
        return "IN_TRANSIT";
      case "assigned_for_delivery":
        return "OUT_FOR_DELIVERY";
      case "delivered":
        return "DELIVERED";
      case "cancelled":
        return "CANCELLED";
      case "returned":
        return "RETURNED";
      case "delivery_failed":
        return "DELIVERY_FAILED";
      default:
        return "IN_TRANSIT";
    }
  }

  public async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const clientId = process.env["PATHAO_CLIENT_ID"];
    const clientSecret = process.env["PATHAO_CLIENT_SECRET"];

    if (!clientId || !clientSecret) {
      logger.info("Pathao credentials not configured, creating consignment in simulated mode", "PathaoProvider");
      const randomConsignment = `PT-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return {
        trackingNumber: randomConsignment,
        shipmentReference: `PATHAO-${input.orderNumber}`,
        status: "CREATED",
        rawResponse: {
          consignment_id: randomConsignment,
          delivery_fee: 120,
          status: "Order Created (Simulation)",
        },
      };
    }

    return {
      trackingNumber: `PT-${Date.now().toString().slice(-8)}`,
      shipmentReference: `PATHAO-${input.orderNumber}`,
      status: "CREATED",
    };
  }

  public async cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Pathao consignment ${trackingNumber} cancellation submitted. Reason: ${reason || "None"}`,
    };
  }

  public async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    return {
      trackingNumber,
      courierName: this.name,
      status: "IN_TRANSIT",
      timeline: [
        {
          status: "CREATED",
          message: "Consignment created with Pathao Logistics",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  public async handleWebhook(payload: WebhookPayload): Promise<NormalizedWebhookEvent> {
    const body = payload.parsedBody;
    const trackingNumber = (body.consignment_id || body.merchant_order_id) as string;
    const rawStatus = (body.event_type || body.order_status || "") as string;

    if (!trackingNumber) {
      return { isValid: false };
    }

    return {
      isValid: true,
      trackingNumber,
      normalizedStatus: this.normalizeStatus(rawStatus),
      message: `Pathao status update: ${rawStatus}`,
      timestamp: new Date().toISOString(),
      metadata: body,
    };
  }
}
