import type {
  CreateShipmentInput,
  ShipmentResult,
  TrackingInfo,
  WebhookPayload,
  NormalizedWebhookEvent,
} from "./types";

export interface ICourierProvider {
  readonly code: string;
  readonly name: string;

  /**
   * Create shipment with the courier partner
   */
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;

  /**
   * Cancel an existing shipment
   */
  cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message: string }>;

  /**
   * Fetch live tracking progress from courier
   */
  getTracking(trackingNumber: string): Promise<TrackingInfo>;

  /**
   * Verify and normalize inbound webhook
   */
  handleWebhook(payload: WebhookPayload): Promise<NormalizedWebhookEvent>;
}
