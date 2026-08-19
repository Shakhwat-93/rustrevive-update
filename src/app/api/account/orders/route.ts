import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/account/orders
 * Returns orders belonging to the authenticated customer.
 * Uses server-side customer_id lookup — never trusts client-supplied identity.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountOrders:GET");
    }

    // Look up customer record via auth_user_id
    const { data: customerData } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const customer = customerData as { id: string } | null;
    if (!customer) {
      // Customer has account but no orders placed yet
      return successResponse([]);
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_status, fulfillment_status,
        subtotal, shipping_total, discount_total, grand_total, currency,
        created_at, shipping_address_snapshot
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ordersError) throw ordersError;

    return successResponse(orders || []);
  } catch (err: unknown) {
    logger.error("Failed to fetch account orders", err as Error, "AccountOrders:GET");
    return errorResponse(err, "AccountOrders:GET");
  }
}
