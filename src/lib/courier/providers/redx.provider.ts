import type { ICourierProvider } from "../provider.interface";
import type {
  CreateShipmentInput,
  ShipmentResult,
  TrackingInfo,
  WebhookPayload,
  NormalizedWebhookEvent,
} from "../types";
import type { DeliveryStatus } from "@/types/database.types";

export class RedxProvider implements ICourierProvider {
  public readonly code = "REDX";
  public readonly name = "RedX Express";

  public normalizeStatus(rawStatus: string): DeliveryStatus {
    const s = rawStatus.toLowerCase().trim();
    switch (s) {
      case "ready_for_pickup":
        return "CREATED";
      case "pickup_done":
        return "PICKED_UP";
      case "in_transit":
        return "IN_TRANSIT";
      case "out_for_delivery":
        return "OUT_FOR_DELIVERY";
      case "delivered":
        return "DELIVERED";
      case "returned":
        return "RETURNED";
      case "failed":
        return "DELIVERY_FAILED";
      default:
        return "IN_TRANSIT";
    }
  }

  public async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const randomConsignment = `REDX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      trackingNumber: randomConsignment,
      shipmentReference: `REDX-${input.orderNumber}`,
      status: "CREATED",
      rawResponse: {
        tracking_id: randomConsignment,
        message: "Consignment created (Simulation Mode)",
      },
    };
  }

  public async cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `RedX tracking ${trackingNumber} cancellation requested. Reason: ${reason || "None"}`,
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
          message: "Consignment registered with RedX",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  public async handleWebhook(payload: WebhookPayload): Promise<NormalizedWebhookEvent> {
    const body = payload.parsedBody;
    const trackingNumber = (body.tracking_id || body.parcel_id) as string;
    const rawStatus = (body.status || "") as string;

    if (!trackingNumber) {
      return { isValid: false };
    }

    return {
      isValid: true,
      trackingNumber,
      normalizedStatus: this.normalizeStatus(rawStatus),
      message: `RedX status update: ${rawStatus}`,
      timestamp: new Date().toISOString(),
      metadata: body,
    };
  }
}
