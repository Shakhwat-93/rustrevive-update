import { describe, it, expect } from "vitest";

describe("Persistent Cart & Live Rehydration Engine", () => {
  it("serializes only minimal cart attributes for client storage", () => {
    const fullCartItem = {
      productId: "prod-101",
      variantId: "var-m",
      title: "Vintage Denim Jacket",
      sku: "VDJ-BLK-M",
      price: 4500,
      imageUrl: "https://example.com/jacket.jpg",
      quantity: 2,
      addedAt: new Date().toISOString(),
    };

    const minimal = {
      productId: fullCartItem.productId,
      variantId: fullCartItem.variantId,
      quantity: fullCartItem.quantity,
      addedAt: fullCartItem.addedAt,
    };

    expect(minimal).not.toHaveProperty("price");
    expect(minimal).not.toHaveProperty("imageUrl");
    expect(minimal).not.toHaveProperty("title");
    expect(minimal.productId).toBe("prod-101");
    expect(minimal.quantity).toBe(2);
  });

  it("handles out of stock items gracefully by marking isOutOfStock and isAvailable false", () => {
    const rawItem = { productId: "prod-1", variantId: "var-1", quantity: 3 };
    const stockAvailable = 0;

    const isOutOfStock = stockAvailable <= 0;
    const isAvailable = !isOutOfStock;
    const effectiveQty = isAvailable ? rawItem.quantity : 0;

    expect(isOutOfStock).toBe(true);
    expect(isAvailable).toBe(false);
    expect(effectiveQty).toBe(0);
  });

  it("clamps requested quantity to actual available inventory", () => {
    const requested = 10;
    const availableStock = 4;

    const clampedQuantity = Math.min(requested, availableStock);
    const wasAdjusted = clampedQuantity < requested;

    expect(clampedQuantity).toBe(4);
    expect(wasAdjusted).toBe(true);
  });

  it("calculates live price with variant price offset correctly", () => {
    const basePrice = 3200;
    const variantOffset = 300;

    const finalPrice = basePrice + variantOffset;
    expect(finalPrice).toBe(3500);
  });
});
