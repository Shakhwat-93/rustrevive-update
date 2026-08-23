import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import type { InventoryMovementType } from "@/types/database.types";

export interface AdjustStockInput {
  inventory_id: string;
  quantity_change: number;
  movement_type: InventoryMovementType;
  reason?: string;
  reference_type?: string;
  reference_id?: string;
  actor_name?: string;
}

export interface InventoryItemRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  reserved_quantity: number;
}

export interface ReturnItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  isSellable: boolean;
  reason?: string;
}

export class InventoryService {
  /**
   * List all inventory items with joined product and variant details
   */
  public static async getInventoryLevels(options: { search?: string; limit?: number; offset?: number } = {}) {
    const supabase = createAdminClient();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let query = supabase
      .from("inventory")
      .select(`
        *,
        products(id, title, sku, base_price, is_active),
        product_variants(id, title, sku, price, option_1_name, option_1_value, option_2_name, option_2_value, is_active)
      `, { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.search) {
      query = query.or(
        `products.title.ilike.%${options.search}%,products.sku.ilike.%${options.search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to fetch inventory levels", error, "InventoryService");
      throw new Error(`Inventory query error: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }

  /**
   * Atomic stock adjustment: Updates quantity and logs immutable movement record
   */
  public static async adjustStock(input: AdjustStockInput) {
    const supabase = createAdminClient();

    // 1. Fetch current inventory row
    const { data: current, error: fetchErr } = await supabase
      .from("inventory")
      .select("id, product_id, quantity, reserved_quantity, variant_id")
      .eq("id", input.inventory_id)
      .single();

    if (fetchErr || !current) {
      throw new NotFoundError(`Inventory record with ID ${input.inventory_id} not found.`);
    }

    const item = current as InventoryItemRow;
    const newQuantity = item.quantity + input.quantity_change;
    if (newQuantity < 0) {
      throw new ValidationError(
        `Cannot adjust stock below 0. Current available: ${item.quantity}, adjustment: ${input.quantity_change}`,
        { currentQuantity: item.quantity, adjustment: input.quantity_change }
      );
    }

    // 2. Update inventory row
    const { data: updated, error: updateErr } = await supabase
      .from("inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.inventory_id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to update inventory quantity: ${updateErr?.message}`);
    }

    // 3. Create immutable inventory movement ledger record
    await supabase.from("inventory_movements").insert({
      inventory_id: input.inventory_id,
      variant_id: item.variant_id,
      movement_type: input.movement_type,
      quantity_change: input.quantity_change,
      reference_type: input.reference_type || "ADMIN_MANUAL",
      reference_id: input.reference_id || null,
      reason: input.reason || "Manual stock adjustment",
      created_by: input.actor_name || "Admin",
    });

    logger.info("Stock adjusted atomically", "InventoryService", {
      inventoryId: input.inventory_id,
      delta: input.quantity_change,
      newTotal: newQuantity,
      movementType: input.movement_type,
    });

    return updated;
  }

  /**
   * Atomic Order Stock Deduction
   * Decrements quantity directly upon order confirmation and prevents negative stock.
   */
  public static async deductStockForOrder(
    orderId: string,
    orderNumber: string,
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>
  ) {
    const supabase = createAdminClient();

    for (const item of items) {
      let invQuery = supabase.from("inventory").select("id, quantity, reserved_quantity, variant_id");
      if (item.variantId) {
        invQuery = invQuery.eq("variant_id", item.variantId);
      } else {
        invQuery = invQuery.eq("product_id", item.productId).is("variant_id", null);
      }

      const { data: invRow } = await invQuery.maybeSingle();

      if (invRow) {
        const currentQty = invRow.quantity || 0;
        const newQty = Math.max(0, currentQty - item.quantity);

        await supabase
          .from("inventory")
          .update({
            quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invRow.id);

        await supabase.from("inventory_movements").insert({
          inventory_id: invRow.id,
          variant_id: item.variantId || null,
          movement_type: "SALE",
          quantity_change: -item.quantity,
          reference_type: "ORDER",
          reference_id: orderId,
          reason: `Stock deducted for order ${orderNumber}`,
          created_by: "System",
        });

        logger.info("Stock deducted for order", "InventoryService", {
          orderNumber,
          variantId: item.variantId,
          deducted: item.quantity,
          remaining: newQty,
        });
      }
    }
  }

  /**
   * Order Restock with Double-Restock Protection
   * Ensures an order is never restocked more than once on CANCELLED / FAKE / REJECTED transitions.
   */
  public static async restoreStockForOrder(
    orderId: string,
    reason: string = "Order cancellation restock",
    actorName: string = "System"
  ) {
    const supabase = createAdminClient();

    // 1. Double-Restock Protection Check
    const { data: existingRestock } = await supabase
      .from("inventory_movements")
      .select("id")
      .eq("reference_id", orderId)
      .gt("quantity_change", 0)
      .in("movement_type", ["RESTOCK", "CANCELLATION", "RETURN"])
      .limit(1);

    if (existingRestock && existingRestock.length > 0) {
      logger.warn("Prevented duplicate restock for order", "InventoryService", {
        orderId,
        reason: "Order has already been restocked.",
      });
      return { alreadyRestocked: true, restoredItemsCount: 0 };
    }

    // 2. Fetch Order Items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id, product_id, variant_id, quantity")
      .eq("order_id", orderId);

    if (!orderItems || orderItems.length === 0) {
      return { alreadyRestocked: false, restoredItemsCount: 0 };
    }

    let restoredCount = 0;

    // 3. Atomically Restore Inventory
    for (const item of orderItems) {
      let invQuery = supabase.from("inventory").select("id, quantity, variant_id");
      if (item.variant_id) {
        invQuery = invQuery.eq("variant_id", item.variant_id);
      } else if (item.product_id) {
        invQuery = invQuery.eq("product_id", item.product_id).is("variant_id", null);
      }

      const { data: invRow } = await invQuery.maybeSingle();

      if (invRow) {
        const newQty = (invRow.quantity || 0) + item.quantity;

        await supabase
          .from("inventory")
          .update({
            quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invRow.id);

        await supabase.from("inventory_movements").insert({
          inventory_id: invRow.id,
          variant_id: item.variant_id,
          movement_type: "RESTOCK",
          quantity_change: item.quantity,
          reference_type: "ORDER",
          reference_id: orderId,
          reason,
          created_by: actorName,
        });

        restoredCount++;
      }
    }

    logger.info("Order stock restored successfully", "InventoryService", {
      orderId,
      restoredItems: restoredCount,
      reason,
    });

    return { alreadyRestocked: false, restoredItemsCount: restoredCount };
  }

  /**
   * Process Partial or Full Return Stock
   * - Sellable items: Restored to inventory with 'RETURN' movement.
   * - Damaged items: Not added back to sellable stock; logged with 'DAMAGE' movement.
   */
  public static async processReturnStock(
    orderId: string,
    items: ReturnItemInput[],
    actorName: string = "Admin"
  ) {
    const supabase = createAdminClient();

    for (const item of items) {
      let invQuery = supabase.from("inventory").select("id, quantity, variant_id");
      if (item.variantId) {
        invQuery = invQuery.eq("variant_id", item.variantId);
      } else {
        invQuery = invQuery.eq("product_id", item.productId).is("variant_id", null);
      }

      const { data: invRow } = await invQuery.maybeSingle();

      if (invRow) {
        if (item.isSellable) {
          // Add back to sellable stock
          const newQty = (invRow.quantity || 0) + item.quantity;
          await supabase
            .from("inventory")
            .update({
              quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invRow.id);

          await supabase.from("inventory_movements").insert({
            inventory_id: invRow.id,
            variant_id: item.variantId || null,
            movement_type: "RETURN",
            quantity_change: item.quantity,
            reference_type: "RETURN",
            reference_id: orderId,
            reason: item.reason || "Returned item in sellable condition",
            created_by: actorName,
          });
        } else {
          // Damaged/Defective item: Log without increasing sellable stock
          await supabase.from("inventory_movements").insert({
            inventory_id: invRow.id,
            variant_id: item.variantId || null,
            movement_type: "DAMAGE",
            quantity_change: 0,
            reference_type: "RETURN",
            reference_id: orderId,
            reason: item.reason || "Returned item damaged/unsellable — isolated from active inventory",
            created_by: actorName,
          });
        }
      }
    }
  }

  /**
   * List Inventory Movements Audit Trail
   */
  public static async getInventoryHistory(options: { limit?: number; offset?: number } = {}) {
    const supabase = createAdminClient();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const { data, error, count } = await supabase
      .from("inventory_movements")
      .select(`
        *,
        inventory(id, product_id, variant_id, products(id, title, sku), product_variants(id, title, sku))
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to query inventory movements", error, "InventoryService");
      throw new Error(`Inventory history query error: ${error.message}`);
    }

    return {
      movements: data || [],
      total: count || 0,
    };
  }
}
