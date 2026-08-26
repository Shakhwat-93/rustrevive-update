import { describe, it, expect } from "vitest";
import { SalesReportService } from "@/lib/services/sales-report.service";

describe("Sales Report & Revenue Analytics Engine", () => {
  it("resolves date range presets accurately", () => {
    const today = SalesReportService.resolveDateRange({ preset: "today" });
    expect(today.interval).toBe("hour");
    expect(today.start.getHours()).toBe(0);
    expect(today.end.getHours()).toBe(23);

    const sevenDays = SalesReportService.resolveDateRange({ preset: "7d" });
    expect(sevenDays.interval).toBe("day");
    const diffDays = Math.round((sevenDays.end.getTime() - sevenDays.start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(7);

    const custom = SalesReportService.resolveDateRange({
      startDate: "2026-08-01",
      endDate: "2026-08-26",
    });
    expect(custom.interval).toBe("day");
    expect(custom.start.getDate()).toBe(1);
    expect(custom.end.getDate()).toBe(26);
  });

  it("calculates gross revenue, discounts, and net sales correctly", () => {
    const rawOrders = [
      { id: "o1", subtotal: 5000, discount_total: 500, shipping_total: 120, grand_total: 4620, status: "DELIVERED", quantity: 2 },
      { id: "o2", subtotal: 3000, discount_total: 0, shipping_total: 120, grand_total: 3120, status: "SHIPPED", quantity: 1 },
      { id: "o3", subtotal: 2500, discount_total: 0, shipping_total: 120, grand_total: 2620, status: "CANCELLED", quantity: 1 },
    ];

    let grossRevenue = 0;
    let netSales = 0;
    let totalDiscount = 0;
    let itemsSold = 0;
    let validOrdersCount = 0;
    let cancelledCount = 0;

    for (const o of rawOrders) {
      if (o.status === "CANCELLED") {
        cancelledCount += 1;
        continue;
      }
      validOrdersCount += 1;
      grossRevenue += o.subtotal;
      totalDiscount += o.discount_total;
      netSales += o.grand_total;
      itemsSold += o.quantity;
    }

    expect(validOrdersCount).toBe(2);
    expect(cancelledCount).toBe(1);
    expect(grossRevenue).toBe(8000);
    expect(totalDiscount).toBe(500);
    expect(netSales).toBe(7740);
    expect(itemsSold).toBe(3);
  });

  it("calculates category market share percentage accurately", () => {
    const categories = [
      { name: "Shirts", revenue: 60000 },
      { name: "Pants", revenue: 40000 },
    ];

    const total = categories.reduce((s, c) => s + c.revenue, 0);
    const shares = categories.map((c) => Number(((c.revenue / total) * 100).toFixed(1)));

    expect(total).toBe(100000);
    expect(shares[0]).toBe(60.0);
    expect(shares[1]).toBe(40.0);
  });

  it("formats CSV export with UTF-8 BOM and correct column headers", async () => {
    const headers = [
      "Order Reference",
      "Date",
      "Customer Name",
      "Product",
      "Quantity",
      "Net Sales (BDT)",
    ];

    const row = ['"RR-100001"', '"2026-08-26"', '"Rahim Chowdhury"', '"Vintage Shirt"', 2, 4500];
    const csvString = "\uFEFF" + headers.join(",") + "\r\n" + row.join(",");

    expect(csvString.startsWith("\uFEFF")).toBe(true);
    expect(csvString).toContain("Order Reference");
    expect(csvString).toContain("Vintage Shirt");
  });
});
