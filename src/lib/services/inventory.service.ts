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
  quantity: number;
  reserved_quantity: number;
  variant_id: string | null;
}

export class InventoryService {
  /**
   * List all inventory items with joined product and variant details
   */
  public static async getInventoryLevels(options: { search?: string; limit?: number; offset?: number } = {}) {
    const supabase = createAdminClient();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const query = supabase
      .from("inventory")
      .select(`
        *,
        products(id, title, sku, base_price),
        product_variants(id, title, sku, price)
      `, { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
      .select("id, quantity, reserved_quantity, variant_id")
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
}
