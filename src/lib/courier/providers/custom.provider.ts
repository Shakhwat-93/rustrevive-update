import type { ICourierProvider } from "../provider.interface";
import type {
  CreateShipmentInput,
  ShipmentResult,
  TrackingInfo,
  WebhookPayload,
  NormalizedWebhookEvent,
} from "../types";

export class CustomProvider implements ICourierProvider {
  public readonly code = "CUSTOM";
  public readonly name = "Custom In-House Logistics";

  public async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const timestamp = Date.now().toString().slice(-6);
    const trackingNumber = `RR-EXP-${timestamp}`;

    return {
      trackingNumber,
      shipmentReference: `INHOUSE-${input.orderNumber}`,
      status: "CREATED",
      rawResponse: {
        method: "In-House Fleet Dispatch",
        dispatched_at: new Date().toISOString(),
      },
    };
  }

  public async cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `In-house dispatch ${trackingNumber} cancelled. Reason: ${reason || "Internal request"}`,
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
          message: "Consignment booked with Rust & Revive Logistics",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  public async handleWebhook(payload: WebhookPayload): Promise<NormalizedWebhookEvent> {
    const body = payload.parsedBody;
    const trackingNumber = (body.tracking_number || body.consignment_id) as string;
    const rawStatus = ((body.status || "IN_TRANSIT") as string).toUpperCase();

    return {
      isValid: true,
      trackingNumber,
      normalizedStatus: rawStatus === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
      message: (body.message as string) || `Custom webhook received: ${rawStatus}`,
      timestamp: new Date().toISOString(),
      metadata: body,
    };
  }
}
