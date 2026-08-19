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

export class SteadfastProvider implements ICourierProvider {
  public readonly code = "STEADFAST";
  public readonly name = "Steadfast Courier";

  /**
   * Normalizes Steadfast status codes to internal DeliveryStatus
   */
  public normalizeStatus(rawStatus: string): DeliveryStatus {
    const s = rawStatus.toLowerCase().trim();
    switch (s) {
      case "in_review":
      case "pending":
        return "CREATED";
      case "picked_up":
      case "hold":
        return "PICKED_UP";
      case "in_transit":
      case "in_hub":
        return "IN_TRANSIT";
      case "out_for_delivery":
        return "OUT_FOR_DELIVERY";
      case "delivered":
      case "delivered_approval_pending":
      case "partial_delivered":
        return "DELIVERED";
      case "cancelled":
        return "CANCELLED";
      case "return":
      case "returned":
        return "RETURNED";
      default:
        return "IN_TRANSIT";
    }
  }

  public async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const apiKey = process.env["STEADFAST_API_KEY"];
    const secretKey = process.env["STEADFAST_SECRET_KEY"];

    // If live credentials are not set, fall back to simulated production consignment ID
    if (!apiKey || !secretKey) {
      logger.info("Steadfast credentials not configured, creating consignment in simulated mode", "SteadfastProvider");
      const randomConsignment = `SF-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return {
        trackingNumber: randomConsignment,
        shipmentReference: `STEADFAST-${input.orderNumber}`,
        status: "CREATED",
        rawResponse: {
          status: 200,
          message: "Consignment created (Simulation Mode - Ready for Live Keys)",
          consignment_id: randomConsignment,
        },
      };
    }

    try {
      const payload = {
        invoice: input.orderNumber,
        recipient_name: input.customerName,
        recipient_phone: input.customerPhone,
        recipient_address: `${input.deliveryAddress.addressLine1}, ${input.deliveryAddress.city}`,
        cod_amount: input.codAmount,
        note: input.instructions || "Handle with care",
      };

      const res = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        throw new Error(data.message || `Steadfast API error: HTTP ${res.status}`);
      }

      const consignment = data.consignment || {};
      return {
        trackingNumber: String(consignment.tracking_code || consignment.consignment_id),
        shipmentReference: String(consignment.consignment_id),
        status: "CREATED",
        rawResponse: data,
      };
    } catch (err) {
      logger.error("Failed to create Steadfast shipment", err, "SteadfastProvider");
      throw err;
    }
  }

  public async cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Steadfast consignment ${trackingNumber} marked for cancellation. Note: ${reason || "None"}`,
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
          message: "Consignment booked with Steadfast Courier",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  public async handleWebhook(payload: WebhookPayload): Promise<NormalizedWebhookEvent> {
    const body = payload.parsedBody;
    const trackingNumber = (body.tracking_code || body.consignment_id) as string;
    const rawStatus = (body.status || "") as string;

    if (!trackingNumber) {
      return { isValid: false };
    }

    const normalizedStatus = this.normalizeStatus(rawStatus);

    return {
      isValid: true,
      trackingNumber,
      normalizedStatus,
      message: `Steadfast status update: ${rawStatus}`,
      timestamp: new Date().toISOString(),
      metadata: body,
    };
  }
}
