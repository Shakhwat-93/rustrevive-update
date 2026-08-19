import { describe, it, expect } from "vitest";
import { CourierFactory } from "@/lib/courier/courier-factory";
import { SteadfastProvider } from "@/lib/courier/providers/steadfast.provider";
import { PathaoProvider } from "@/lib/courier/providers/pathao.provider";
import { RedxProvider } from "@/lib/courier/providers/redx.provider";

describe("Courier Provider Abstraction & Factory", () => {
  it("resolves providers correctly via CourierFactory", () => {
    const custom = CourierFactory.getProvider("CUSTOM");
    const steadfast = CourierFactory.getProvider("STEADFAST");
    const pathao = CourierFactory.getProvider("PATHAO");
    const redx = CourierFactory.getProvider("REDX");

    expect(custom.code).toBe("CUSTOM");
    expect(steadfast.code).toBe("STEADFAST");
    expect(pathao.code).toBe("PATHAO");
    expect(redx.code).toBe("REDX");
  });

  it("falls back to CustomProvider for unknown courier codes", () => {
    const fallback = CourierFactory.getProvider("UNKNOWN_COURIER");
    expect(fallback.code).toBe("CUSTOM");
  });
});

describe("Courier Status Normalization Engine", () => {
  const steadfast = new SteadfastProvider();
  const pathao = new PathaoProvider();
  const redx = new RedxProvider();

  it("normalizes Steadfast status strings", () => {
    expect(steadfast.normalizeStatus("in_review")).toBe("CREATED");
    expect(steadfast.normalizeStatus("picked_up")).toBe("PICKED_UP");
    expect(steadfast.normalizeStatus("in_transit")).toBe("IN_TRANSIT");
    expect(steadfast.normalizeStatus("out_for_delivery")).toBe("OUT_FOR_DELIVERY");
    expect(steadfast.normalizeStatus("delivered")).toBe("DELIVERED");
    expect(steadfast.normalizeStatus("delivered_approval_pending")).toBe("DELIVERED");
    expect(steadfast.normalizeStatus("cancelled")).toBe("CANCELLED");
    expect(steadfast.normalizeStatus("returned")).toBe("RETURNED");
  });

  it("normalizes Pathao status strings", () => {
    expect(pathao.normalizeStatus("order_placed")).toBe("CREATED");
    expect(pathao.normalizeStatus("picked")).toBe("PICKED_UP");
    expect(pathao.normalizeStatus("in_transit")).toBe("IN_TRANSIT");
    expect(pathao.normalizeStatus("assigned_for_delivery")).toBe("OUT_FOR_DELIVERY");
    expect(pathao.normalizeStatus("delivered")).toBe("DELIVERED");
    expect(pathao.normalizeStatus("delivery_failed")).toBe("DELIVERY_FAILED");
  });

  it("normalizes RedX status strings", () => {
    expect(redx.normalizeStatus("ready_for_pickup")).toBe("CREATED");
    expect(redx.normalizeStatus("pickup_done")).toBe("PICKED_UP");
    expect(redx.normalizeStatus("in_transit")).toBe("IN_TRANSIT");
    expect(redx.normalizeStatus("out_for_delivery")).toBe("OUT_FOR_DELIVERY");
    expect(redx.normalizeStatus("delivered")).toBe("DELIVERED");
    expect(redx.normalizeStatus("failed")).toBe("DELIVERY_FAILED");
  });
});

describe("In-House Shipment Creation", () => {
  it("creates in-house consignment tracking reference", async () => {
    const custom = CourierFactory.getProvider("CUSTOM");
    const res = await custom.createShipment({
      orderId: "ord-123",
      orderNumber: "RR-100001",
      customerName: "Rahim Uddin",
      customerPhone: "01711000000",
      deliveryAddress: {
        addressLine1: "House 10, Road 4",
        city: "Dhaka",
      },
      codAmount: 2500,
      itemCount: 2,
    });

    expect(res.trackingNumber).toMatch(/^RR-EXP-\d+/);
    expect(res.shipmentReference).toBe("INHOUSE-RR-100001");
    expect(res.status).toBe("CREATED");
  });
});
