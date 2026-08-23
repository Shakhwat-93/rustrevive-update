import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "@/lib/services/inventory.service";
import { ValidationError } from "@/lib/errors/app-error";

// Mock Supabase admin client
const mockInventoryState: Record<string, { id: string; product_id: string; variant_id: string | null; quantity: number; reserved_quantity: number }> = {};
const mockMovements: Array<{ id: string; inventory_id: string; movement_type: string; quantity_change: number; reference_id?: string; reference_type?: string }> = [];
const mockOrderItems: Record<string, Array<{ id: string; product_id: string; variant_id: string | null; quantity: number }>> = {};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "inventory") {
        return {
          select: (_fields?: string) => ({
            eq: (field: string, val: string) => ({
              single: async () => {
                const item = Object.values(mockInventoryState).find((i) => (i as Record<string, unknown>)[field] === val);
                return { data: item || null, error: item ? null : { message: "Not found" } };
              },
              maybeSingle: async () => {
                const item = Object.values(mockInventoryState).find((i) => (i as Record<string, unknown>)[field] === val);
                return { data: item || null, error: null };
              },
              is: (f2: string, v2: unknown) => ({
                maybeSingle: async () => {
                  const item = Object.values(mockInventoryState).find(
                    (i) => (i as Record<string, unknown>)[field] === val && (i as Record<string, unknown>)[f2] === v2
                  );
                  return { data: item || null, error: null };
                },
              }),
            }),
            order: () => ({
              range: async () => ({
                data: Object.values(mockInventoryState),
                error: null,
                count: Object.keys(mockInventoryState).length,
              }),
            }),
          }),
          update: (updates: { quantity: number }) => ({
            eq: (field: string, val: string) => {
              const item = Object.values(mockInventoryState).find((i) => (i as Record<string, unknown>)[field] === val);
              if (item) {
                item.quantity = updates.quantity;
              }
              return {
                select: () => ({
                  single: async () => ({ data: item, error: null }),
                }),
              };
            },
          }),
          insert: async (row: typeof mockInventoryState[string]) => {
            const id = row.id || `inv-${Date.now()}`;
            mockInventoryState[id] = { ...row, id };
            return { data: mockInventoryState[id], error: null };
          },
        };
      }

      if (table === "inventory_movements") {
        return {
          insert: async (row: typeof mockMovements[number]) => {
            const record = { ...row, id: `mov-${mockMovements.length + 1}` };
            mockMovements.push(record);
            return { data: record, error: null };
          },
          select: () => ({
            eq: (field: string, val: string) => ({
              gt: (_f: string, _v: number) => ({
                in: (_f2: string, _types: string[]) => ({
                  limit: async () => {
                    const match = mockMovements.filter((m) => (m as Record<string, unknown>)[field] === val && m.quantity_change > 0);
                    return { data: match, error: null };
                  },
                }),
              }),
            }),
          }),
        };
      }

      if (table === "order_items") {
        return {
          select: () => ({
            eq: async (_field: string, val: string) => ({
              data: mockOrderItems[val] || [],
              error: null,
            }),
          }),
        };
      }

      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  }),
}));

describe("Inventory System Core Test Matrix", () => {
  beforeEach(() => {
    // Reset mock state
    for (const key of Object.keys(mockInventoryState)) {
      delete mockInventoryState[key];
    }
    mockMovements.length = 0;
    for (const key of Object.keys(mockOrderItems)) {
      delete mockOrderItems[key];
    }

    mockInventoryState["inv-1"] = {
      id: "inv-1",
      product_id: "prod-1",
      variant_id: "var-m",
      quantity: 10,
      reserved_quantity: 0,
    };

    mockInventoryState["inv-2"] = {
      id: "inv-2",
      product_id: "prod-1",
      variant_id: "var-l",
      quantity: 1,
      reserved_quantity: 0,
    };
  });

  // TEST 1: Stock = 10, Order = 2 -> Expected stock = 8
  it("TEST 1: correctly deducts stock on order confirmation", async () => {
    await InventoryService.deductStockForOrder("order-101", "RR-100101", [
      { productId: "prod-1", variantId: "var-m", quantity: 2 },
    ]);

    expect(mockInventoryState["inv-1"]!.quantity).toBe(8);
    const saleMovement = mockMovements.find((m) => m.movement_type === "SALE" && m.reference_id === "order-101");
    expect(saleMovement).toBeDefined();
    expect(saleMovement?.quantity_change).toBe(-2);
  });

  // TEST 2: Stock = 1, Order = 1 -> Expected stock = 0
  it("TEST 2: correctly reduces stock to 0 when last item is purchased", async () => {
    await InventoryService.deductStockForOrder("order-102", "RR-100102", [
      { productId: "prod-1", variantId: "var-l", quantity: 1 },
    ]);

    expect(mockInventoryState["inv-2"]!.quantity).toBe(0);
  });

  // TEST 3 & 4: Prevent negative adjustments
  it("TEST 3 & 4: prevents negative stock adjustments", async () => {
    await expect(
      InventoryService.adjustStock({
        inventory_id: "inv-2",
        quantity_change: -5,
        movement_type: "MANUAL_ADJUSTMENT",
      })
    ).rejects.toThrow(ValidationError);
  });

  // TEST 5: Cancel order restores stock
  it("TEST 5: restores stock upon order cancellation", async () => {
    mockInventoryState["inv-1"]!.quantity = 8;
    mockOrderItems["order-201"] = [
      { id: "item-1", product_id: "prod-1", variant_id: "var-m", quantity: 2 },
    ];

    const result = await InventoryService.restoreStockForOrder("order-201", "Order cancelled by customer");
    expect(result.alreadyRestocked).toBe(false);
    expect(result.restoredItemsCount).toBe(1);
    expect(mockInventoryState["inv-1"]!.quantity).toBe(10);
  });

  // TEST 6: Double-restock protection
  it("TEST 6: prevents duplicate restock when cancellation is called twice", async () => {
    mockInventoryState["inv-1"]!.quantity = 8;
    mockOrderItems["order-202"] = [
      { id: "item-2", product_id: "prod-1", variant_id: "var-m", quantity: 2 },
    ];

    // First cancel
    const first = await InventoryService.restoreStockForOrder("order-202", "Order cancelled");
    expect(first.alreadyRestocked).toBe(false);
    expect(mockInventoryState["inv-1"]!.quantity).toBe(10);

    // Second cancel attempt
    const second = await InventoryService.restoreStockForOrder("order-202", "Order cancelled again");
    expect(second.alreadyRestocked).toBe(true);
    expect(mockInventoryState["inv-1"]!.quantity).toBe(10); // Still 10, not 12!
  });

  // TEST 7: Fake order restock
  it("TEST 7: restores stock when order is marked as fake", async () => {
    mockInventoryState["inv-1"]!.quantity = 7;
    mockOrderItems["order-fake"] = [
      { id: "item-3", product_id: "prod-1", variant_id: "var-m", quantity: 3 },
    ];

    const result = await InventoryService.restoreStockForOrder("order-fake", "Fake order detected");
    expect(result.alreadyRestocked).toBe(false);
    expect(mockInventoryState["inv-1"]!.quantity).toBe(10);
  });

  // TEST 8 & 9: Return stock handling (Sellable vs Damaged)
  it("TEST 8 & 9: handles partial returns with sellable and damaged item separation", async () => {
    mockInventoryState["inv-1"]!.quantity = 5;

    await InventoryService.processReturnStock("order-ret", [
      { productId: "prod-1", variantId: "var-m", quantity: 2, isSellable: true, reason: "Customer changed mind" },
      { productId: "prod-1", variantId: "var-m", quantity: 1, isSellable: false, reason: "Torn seam" },
    ]);

    // Only sellable 2 items added back (5 + 2 = 7)
    expect(mockInventoryState["inv-1"]!.quantity).toBe(7);

    const returnMov = mockMovements.find((m) => m.movement_type === "RETURN");
    const damageMov = mockMovements.find((m) => m.movement_type === "DAMAGE");

    expect(returnMov?.quantity_change).toBe(2);
    expect(damageMov?.quantity_change).toBe(0);
  });
});
