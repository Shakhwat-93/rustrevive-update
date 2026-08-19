import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationService } from "@/lib/services/notification.service";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { ReturnStatus } from "@/types/database.types";

export interface CreateReturnRequestInput {
  orderNumber: string;
  phone: string;
  reason: string;
  items?: { productId: string; quantity: number; reason?: string }[];
}

export class ReturnService {
  /**
   * Submit return request by customer
   */
  public static async createReturnRequest(input: CreateReturnRequestInput) {
    const supabase = createAdminClient();

    // 1. Verify Order & Phone
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, customer_name, customer_phone, status")
      .eq("order_number", input.orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (error || !order) {
      throw new NotFoundError("Order reference not found.");
    }

    const cleanInputPhone = input.phone.replace(/[^0-9]/g, "");
    const cleanOrderPhone = order.customer_phone.replace(/[^0-9]/g, "");

    if (!cleanOrderPhone.endsWith(cleanInputPhone.slice(-8)) && !cleanInputPhone.endsWith(cleanOrderPhone.slice(-8))) {
      throw new ValidationError("Phone number does not match this order.", { field: "phone" });
    }

    if (order.status !== "DELIVERED" && order.status !== "SHIPPED") {
      throw new ValidationError("Returns can only be requested for shipped or delivered orders.");
    }

    // 2. Insert Return Request
    const { data: returnRow, error: retErr } = await supabase
      .from("return_requests")
      .insert({
        order_id: order.id,
        customer_id: order.customer_id,
        reason: input.reason.trim(),
        status: "REQUESTED",
        items: (input.items || []) as unknown as Record<string, string>[],
      })
      .select()
      .single();

    if (retErr || !returnRow) {
      logger.error("Failed to create return request", retErr, "ReturnService");
      throw new Error(`Return request failed: ${retErr?.message}`);
    }

    // 3. Update Order Status
    await supabase
      .from("orders")
      .update({
        status: "RETURN_REQUESTED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // 4. Log Timeline Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "RETURN_REQUESTED",
      old_status: order.status,
      new_status: "RETURN_REQUESTED",
      message: `Return request submitted by customer. Reason: ${input.reason.trim()}`,
      created_by: "Customer",
    });

    // 5. Notify Operations
    await NotificationService.sendOrderNotification({
      type: "RETURN_REQUESTED",
      title: `Return Requested: ${order.order_number}`,
      message: `Customer ${order.customer_name} requested a return for order ${order.order_number}.`,
      orderNumber: order.order_number,
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      grandTotal: 0,
    });

    return returnRow;
  }

  /**
   * List return requests for admin review
   */
  public static async listReturnRequests(status?: ReturnStatus | "ALL") {
    const supabase = createAdminClient();

    let query = supabase
      .from("return_requests")
      .select(`
        *,
        orders(id, order_number, customer_name, customer_phone, grand_total, status)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to list returns", error, "ReturnService");
      throw new Error(`Return fetch error: ${error.message}`);
    }

    return data || [];
  }
}
