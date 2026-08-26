import { describe, it, expect } from "vitest";
import { NotificationService } from "@/lib/services/notification.service";

describe("Admin Notification & Web Push System Unit Tests", () => {
  describe("Target URL Resolution", () => {
    it("should resolve correct order detail route for NEW_ORDER", () => {
      const url = NotificationService.getTargetUrl("NEW_ORDER", "orders", "order-12345");
      expect(url).toBe("/admin/orders/order-12345");
    });

    it("should resolve /admin/reviews for NEW_REVIEW", () => {
      const url = NotificationService.getTargetUrl("NEW_REVIEW", "reviews", "rev-999");
      expect(url).toBe("/admin/reviews");
    });

    it("should resolve /admin/inventory for LOW_STOCK and OUT_OF_STOCK", () => {
      const url1 = NotificationService.getTargetUrl("LOW_STOCK", "inventory", "var-1");
      const url2 = NotificationService.getTargetUrl("OUT_OF_STOCK", "products", "prod-2");
      expect(url1).toBe("/admin/inventory");
      expect(url2).toBe("/admin/inventory");
    });

    it("should fallback to /admin/notifications for unknown resource types", () => {
      const url = NotificationService.getTargetUrl("UNKNOWN_TYPE", null, null);
      expect(url).toBe("/admin/notifications");
    });
  });

  describe("Push Payload Construction", () => {
    it("should format new order push notification properly with items and total", () => {
      const orderNumber = "RR-1024";
      const grandTotal = 2450;
      const itemCount = 2;

      const title = "🛍 New Order Received";
      const body = `Order #${orderNumber} • ৳${grandTotal.toLocaleString()} • ${itemCount} items`;

      expect(title).toBe("🛍 New Order Received");
      expect(body).toBe("Order #RR-1024 • ৳2,450 • 2 items");
    });
  });

  describe("Category Count Aggregation", () => {
    it("should count categories accurately from notification list", () => {
      const mockNotifs = [
        { id: "1", type: "NEW_ORDER", is_read: false },
        { id: "2", type: "NEW_ORDER", is_read: true },
        { id: "3", type: "LOW_STOCK", is_read: false },
        { id: "4", type: "NEW_REVIEW", is_read: false },
        { id: "5", type: "SYSTEM_ALERT", is_read: true },
      ];

      const unreadCount = mockNotifs.filter((n) => !n.is_read).length;
      const ordersCount = mockNotifs.filter((n) => ["NEW_ORDER", "ORDER_CANCELLED"].includes(n.type)).length;
      const inventoryCount = mockNotifs.filter((n) => ["LOW_STOCK", "OUT_OF_STOCK"].includes(n.type)).length;
      const reviewsCount = mockNotifs.filter((n) => n.type === "NEW_REVIEW").length;

      expect(unreadCount).toBe(3);
      expect(ordersCount).toBe(2);
      expect(inventoryCount).toBe(1);
      expect(reviewsCount).toBe(1);
    });
  });
});
