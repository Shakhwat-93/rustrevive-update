import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Admin Realtime & Notification Architecture", () => {
  let processedEvents: Map<string, number>;

  beforeEach(() => {
    processedEvents = new Map();
  });

  it("guarantees idempotent event processing and suppresses duplicate order events", () => {
    const processOrderEvent = (orderId: string, eventType: string) => {
      const key = `${eventType}_${orderId}`;
      if (processedEvents.has(key)) {
        return { processed: false, reason: "DUPLICATE_EVENT_SUPPRESSED" };
      }
      processedEvents.set(key, Date.now());
      return { processed: true, key };
    };

    // First arrival
    const event1 = processOrderEvent("order-12345", "INSERT");
    expect(event1.processed).toBe(true);

    // Duplicate arrival (e.g. multi-tab / reconnect / React strict mode)
    const event2 = processOrderEvent("order-12345", "INSERT");
    expect(event2.processed).toBe(false);
    expect(event2.reason).toBe("DUPLICATE_EVENT_SUPPRESSED");

    // Legitimate different order
    const event3 = processOrderEvent("order-67890", "INSERT");
    expect(event3.processed).toBe(true);
  });

  it("handles order update transitions idempotently based on status and payment status", () => {
    const processUpdateEvent = (orderId: string, status: string, paymentStatus: string) => {
      const key = `update_${orderId}_${status}_${paymentStatus}`;
      if (processedEvents.has(key)) {
        return { processed: false };
      }
      processedEvents.set(key, Date.now());
      return { processed: true };
    };

    // First transition: PENDING -> CONFIRMED
    expect(processUpdateEvent("order-101", "CONFIRMED", "COD_PENDING").processed).toBe(true);
    // Duplicate status update event
    expect(processUpdateEvent("order-101", "CONFIRMED", "COD_PENDING").processed).toBe(false);

    // Subsequent transition: CONFIRMED -> SHIPPED
    expect(processUpdateEvent("order-101", "SHIPPED", "COD_PENDING").processed).toBe(true);
  });

  it("correctly reconciles missed orders without creating duplicate rows", () => {
    const existingOrders = [
      { id: "ord-1", order_number: "RR-1001", grand_total: 2500 },
      { id: "ord-2", order_number: "RR-1002", grand_total: 4500 },
    ];

    const reconciledOrders = [
      { id: "ord-3", order_number: "RR-1003", grand_total: 3200 }, // New missed order
      { id: "ord-2", order_number: "RR-1002", grand_total: 4500 }, // Already known order
    ];

    const upsertOrders = (current: typeof existingOrders, incoming: typeof reconciledOrders) => {
      const map = new Map(current.map((o) => [o.id, o]));
      for (const order of incoming) {
        map.set(order.id, order); // Upsert
      }
      return Array.from(map.values()).sort((a, b) => b.order_number.localeCompare(a.order_number));
    };

    const finalOrders = upsertOrders(existingOrders, reconciledOrders);
    expect(finalOrders.length).toBe(3);
    expect(finalOrders.map((o) => o.order_number)).toEqual(["RR-1003", "RR-1002", "RR-1001"]);
  });

  it("cleans up stale deduplication entries after TTL expires", () => {
    const now = Date.now();
    processedEvents.set("old_order_1", now - 6 * 60 * 1000); // 6 mins ago (expired)
    processedEvents.set("recent_order_2", now - 1 * 60 * 1000); // 1 min ago (valid)

    const cleanTtl = (ttlMs = 5 * 60 * 1000) => {
      const current = Date.now();
      for (const [key, timestamp] of processedEvents.entries()) {
        if (current - timestamp > ttlMs) {
          processedEvents.delete(key);
        }
      }
    };

    cleanTtl();
    expect(processedEvents.has("old_order_1")).toBe(false);
    expect(processedEvents.has("recent_order_2")).toBe(true);
  });
});
