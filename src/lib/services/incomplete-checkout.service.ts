import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export type IncompleteCheckoutStatus = "IN_PROGRESS" | "ABANDONED" | "CONVERTED" | "EXPIRED";

export interface IncompleteCartSnapshotItem {
  productId: string;
  variantId?: string | null;
  title: string;
  variantTitle?: string | null;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  lineTotal: number;
}

export interface TrackCheckoutInput {
  checkoutSessionId: string;
  cartSessionId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
  items: Array<{
    productId: string;
    variantId?: string | null;
    title: string;
    variantTitle?: string | null;
    sku: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
  }>;
  subtotal: number;
  discountTotal?: number;
  shippingTotal?: number;
  estimatedTotal: number;
  shippingMethodId?: string | null;
  couponCode?: string | null;
  customerNotes?: string | null;
}

export interface IncompleteCheckoutQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export class IncompleteCheckoutService {
  /**
   * Track checkout progress (idempotent upsert by checkout_session_id)
   */
  public static async trackProgress(input: TrackCheckoutInput) {
    if (!input.checkoutSessionId || !input.cartSessionId) {
      return { success: false, error: "Missing required session identifiers" };
    }

    // Meaningful check: Has customer provided any contact/address or progressed?
    const hasMeaningfulInfo = Boolean(
      input.customerName?.trim() ||
        input.customerPhone?.trim() ||
        input.customerEmail?.trim() ||
        input.shippingAddress?.trim() ||
        input.items.length > 0
    );

    if (!hasMeaningfulInfo) {
      return { success: true, tracked: false, reason: "No meaningful progress to persist yet" };
    }

    const supabase = createAdminClient();

    const cartSnapshot: IncompleteCartSnapshotItem[] = input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      title: item.title,
      variantTitle: item.variantTitle || null,
      sku: item.sku,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      imageUrl: item.imageUrl || null,
      lineTotal: (Number(item.price) || 0) * (Number(item.quantity) || 1),
    }));

    const itemCount = cartSnapshot.reduce((sum, item) => sum + item.quantity, 0);

    const record = {
      checkout_session_id: input.checkoutSessionId,
      cart_session_id: input.cartSessionId,
      customer_id: input.customerId || null,
      customer_name: input.customerName?.trim() || null,
      customer_phone: input.customerPhone?.trim() || null,
      customer_email: input.customerEmail?.trim() || null,
      shipping_address: input.shippingAddress?.trim() || null,
      city: input.city?.trim() || null,
      area: input.area?.trim() || null,
      postal_code: input.postalCode?.trim() || null,
      cart_snapshot: cartSnapshot,
      item_count: itemCount,
      subtotal: Number(input.subtotal) || 0,
      discount_total: Number(input.discountTotal) || 0,
      shipping_total: Number(input.shippingTotal) || 0,
      estimated_total: Number(input.estimatedTotal) || 0,
      shipping_method_id: input.shippingMethodId || null,
      coupon_code: input.couponCode || null,
      customer_notes: input.customerNotes || null,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert on conflict(checkout_session_id)
    const { data, error } = await supabase
      .from("incomplete_checkouts")
      .upsert(
        {
          ...record,
          status: "IN_PROGRESS",
        },
        {
          onConflict: "checkout_session_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      logger.error("Failed to upsert incomplete checkout", error, "IncompleteCheckoutService");
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id, tracked: true };
  }

  /**
   * Atomically mark incomplete checkout as CONVERTED when an order is successfully created
   */
  public static async markConverted(checkoutSessionId: string, orderId: string) {
    if (!checkoutSessionId || !orderId) return { success: false };

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("incomplete_checkouts")
        .update({
          status: "CONVERTED",
          converted_order_id: orderId,
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_session_id", checkoutSessionId)
        .select()
        .maybeSingle();

      if (error) {
        logger.warn(
          `Could not mark checkout converted for session ${checkoutSessionId}: ${error.message}`,
          "IncompleteCheckoutService"
        );
        return { success: false, error: error.message };
      }

      logger.info(
        `Incomplete checkout converted: ${checkoutSessionId} -> Order ${orderId}`,
        "IncompleteCheckoutService"
      );
      return { success: true, data };
    } catch (err: unknown) {
      logger.error("Error marking checkout converted", err, "IncompleteCheckoutService");
      return { success: false };
    }
  }

  /**
   * Fetch paginated incomplete checkouts with automatic abandonment calculation
   */
  public static async getIncompleteCheckouts(params: IncompleteCheckoutQueryParams = {}) {
    const supabase = createAdminClient();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    // 1. Auto-mark inactive IN_PROGRESS checkouts as ABANDONED (inactive > 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await supabase
      .from("incomplete_checkouts")
      .update({ status: "ABANDONED", updated_at: new Date().toISOString() })
      .eq("status", "IN_PROGRESS")
      .lt("last_activity_at", thirtyMinutesAgo);

    // 2. Build Query
    let query = supabase
      .from("incomplete_checkouts")
      .select("*", { count: "exact" });

    // Status filter
    if (params.status && params.status !== "ALL") {
      query = query.eq("status", params.status as IncompleteCheckoutStatus);
    }

    // Search
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(
        `customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,customer_email.ilike.%${s}%,checkout_session_id.ilike.%${s}%`
      );
    }

    // Date range
    if (params.startDate) {
      query = query.gte("created_at", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("created_at", params.endDate);
    }

    // Sort by recent activity
    query = query
      .order("last_activity_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;

    if (error) {
      logger.error("Failed to query incomplete checkouts", error, "IncompleteCheckoutService");
      throw error;
    }

    // 3. Compute KPI summary metrics
    const { data: allRows } = await supabase
      .from("incomplete_checkouts")
      .select("status, estimated_total, converted_order_id");

    const kpi = {
      total: allRows?.length || 0,
      inProgress: 0,
      abandoned: 0,
      converted: 0,
      expired: 0,
      abandonedValue: 0,
      convertedValue: 0,
      recoveryRate: 0,
    };

    (allRows || []).forEach((r) => {
      const val = Number(r.estimated_total) || 0;
      if (r.status === "IN_PROGRESS") kpi.inProgress += 1;
      else if (r.status === "ABANDONED") {
        kpi.abandoned += 1;
        kpi.abandonedValue += val;
      } else if (r.status === "CONVERTED") {
        kpi.converted += 1;
        kpi.convertedValue += val;
      } else if (r.status === "EXPIRED") {
        kpi.expired += 1;
      }
    });

    const totalEligible = kpi.abandoned + kpi.converted;
    kpi.recoveryRate = totalEligible > 0 ? Number(((kpi.converted / totalEligible) * 100).toFixed(1)) : 0;

    return {
      checkouts: rows || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      kpi,
    };
  }

  /**
   * Get single incomplete checkout detail with converted order reference
   */
  public static async getIncompleteCheckoutById(id: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("incomplete_checkouts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    let convertedOrder: any = null;
    if (data.converted_order_id) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, grand_total, status, created_at")
        .eq("id", data.converted_order_id)
        .maybeSingle();
      convertedOrder = order;
    }

    return {
      ...data,
      convertedOrder,
    };
  }

  /**
   * Delete incomplete checkout record (admin maintenance)
   */
  public static async deleteIncompleteCheckout(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("incomplete_checkouts").delete().eq("id", id);
    if (error) {
      throw error;
    }
    return { success: true };
  }
}
