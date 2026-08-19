import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourierFactory } from "@/lib/courier/courier-factory";
import { NotificationService } from "@/lib/services/notification.service";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { DeliveryStatus, OrderStatus } from "@/types/database.types";

export interface CreateShipmentRequest {
  orderId: string;
  courierCode?: string; // 'STEADFAST' | 'PATHAO' | 'REDX' | 'CUSTOM'
  instructions?: string;
  actorName?: string;
}

export interface FulfillmentQueryFilters {
  status?: DeliveryStatus | "ALL";
  courier_code?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class FulfillmentService {
  /**
   * Dispatches shipment to courier partner and creates fulfillment record
   */
  public static async createShipmentForOrder(request: CreateShipmentRequest) {
    const supabase = createAdminClient();

    // 1. Fetch Order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(*),
        fulfillments(*)
      `)
      .eq("id", request.orderId)
      .single();

    if (orderErr || !order) {
      throw new NotFoundError(`Order with ID ${request.orderId} not found.`);
    }

    // 2. Validate Order State
    if (order.status === "CANCELLED") {
      throw new ValidationError(`Cannot create shipment for cancelled order ${order.order_number}.`);
    }

    if (order.fulfillment_status === "FULFILLED" && order.fulfillments && order.fulfillments.length > 0) {
      const existing = order.fulfillments[0];
      return existing;
    }

    // 3. Dispatch to Courier Provider
    const courierCode = request.courierCode || "CUSTOM";
    const courier = CourierFactory.getProvider(courierCode);

    // Fetch courier_provider_id
    const { data: dbProvider } = await supabase
      .from("courier_providers")
      .select("id, name, code")
      .eq("code", courier.code)
      .maybeSingle();

    const deliveryAddr = order.shipping_address_snapshot as unknown as {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      area?: string;
      postalCode?: string;
    };

    const shipmentResult = await courier.createShipment({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: {
        addressLine1: deliveryAddr.addressLine1,
        addressLine2: deliveryAddr.addressLine2,
        city: deliveryAddr.city,
        area: deliveryAddr.area,
        postalCode: deliveryAddr.postalCode,
      },
      codAmount: order.payment_method === "CASH_ON_DELIVERY" ? order.grand_total : 0,
      itemCount: order.order_items?.reduce((acc: number, i: { quantity: number }) => acc + i.quantity, 0) || 1,
      instructions: request.instructions || order.customer_notes || undefined,
    });

    // 4. Insert Fulfillment Record
    const { data: fulfillment, error: fulErr } = await supabase
      .from("fulfillments")
      .insert({
        order_id: order.id,
        courier_provider_id: dbProvider?.id || null,
        status: shipmentResult.status || "CREATED",
        tracking_number: shipmentResult.trackingNumber,
        shipping_label_url: shipmentResult.labelUrl || null,
        shipment_reference: shipmentResult.shipmentReference,
        courier_notes: `Created via ${courier.name}`,
      })
      .select()
      .single();

    if (fulErr || !fulfillment) {
      logger.error("Failed to persist fulfillment row", fulErr, "FulfillmentService");
      throw new Error(`Fulfillment creation failed: ${fulErr?.message}`);
    }

    // 5. Update Order Status to SHIPPED & FULFILLED
    await supabase
      .from("orders")
      .update({
        status: "SHIPPED",
        fulfillment_status: "FULFILLED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // 6. Log Timeline Event
    const actor = request.actorName || "Admin Staff";
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "SHIPMENT_CREATED",
      old_status: order.status,
      new_status: "SHIPPED",
      message: `Shipment booked with ${courier.name}. Tracking reference: ${shipmentResult.trackingNumber}`,
      created_by: actor,
      metadata: {
        courier: courier.name,
        trackingNumber: shipmentResult.trackingNumber,
      } as unknown as Record<string, string>,
    });

    // 7. Trigger Outbound Notification
    await NotificationService.sendOrderNotification({
      type: "ORDER_SHIPPED",
      title: `Order ${order.order_number} Dispatched`,
      message: `Your package has been handed over to ${courier.name}. Tracking ID: ${shipmentResult.trackingNumber}`,
      orderNumber: order.order_number,
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      grandTotal: order.grand_total,
      trackingNumber: shipmentResult.trackingNumber,
      courierName: courier.name,
    });

    logger.info("Shipment created successfully", "FulfillmentService", {
      orderNumber: order.order_number,
      trackingNumber: shipmentResult.trackingNumber,
      courier: courier.name,
    });

    return fulfillment;
  }

  /**
   * Update Fulfillment and sync parent Order Status
   */
  public static async updateFulfillmentStatus(
    trackingNumber: string,
    newStatus: DeliveryStatus,
    reason?: string,
    actorName: string = "Courier Webhook"
  ) {
    const supabase = createAdminClient();

    // 1. Fetch fulfillment
    const { data: fulfillment, error: fetchErr } = await supabase
      .from("fulfillments")
      .select("*, orders(*)")
      .eq("tracking_number", trackingNumber)
      .maybeSingle();

    if (fetchErr || !fulfillment) {
      throw new NotFoundError(`Fulfillment with tracking number ${trackingNumber} not found.`);
    }

    if (fulfillment.status === newStatus) {
      return fulfillment; // Idempotent no-op
    }

    // 2. Update Fulfillment
    const { data: updatedFulfillment } = await supabase
      .from("fulfillments")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fulfillment.id)
      .select()
      .single();

    const parentOrder = fulfillment.orders as unknown as {
      id: string;
      order_number: string;
      status: OrderStatus;
      payment_method: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      grand_total: number;
    };

    if (parentOrder) {
      if (newStatus === "DELIVERED") {
        await supabase
          .from("orders")
          .update({
            status: "DELIVERED",
            payment_status: parentOrder.payment_method === "CASH_ON_DELIVERY" ? "COD_COLLECTED" : "PAID",
            fulfillment_status: "FULFILLED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", parentOrder.id);
      } else if (newStatus === "CANCELLED" || newStatus === "DELIVERY_FAILED") {
        await supabase
          .from("orders")
          .update({
            fulfillment_status: newStatus === "CANCELLED" ? "CANCELLED" : "PARTIALLY_FULFILLED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", parentOrder.id);
      }

      // Log timeline event
      await supabase.from("order_events").insert({
        order_id: parentOrder.id,
        event_type: "DELIVERY_STATUS_CHANGED",
        old_status: fulfillment.status,
        new_status: newStatus,
        message: reason
          ? `Delivery status updated to ${newStatus}. Note: ${reason}`
          : `Parcel status updated to ${newStatus} (${trackingNumber})`,
        created_by: actorName,
      });

      // Send delivery notification if delivered
      if (newStatus === "DELIVERED") {
        await NotificationService.sendOrderNotification({
          type: "ORDER_DELIVERED",
          title: `Order ${parentOrder.order_number} Delivered`,
          message: `Your package has been successfully delivered. Thank you for shopping with Rust & Revive.`,
          orderNumber: parentOrder.order_number,
          orderId: parentOrder.id,
          customerName: parentOrder.customer_name,
          customerPhone: parentOrder.customer_phone,
          customerEmail: parentOrder.customer_email,
          grandTotal: parentOrder.grand_total,
          trackingNumber,
        });
      }
    }

    return updatedFulfillment;
  }

  /**
   * List Fulfillments with Dashboard Status Metrics
   */
  public static async listFulfillments(filters: FulfillmentQueryFilters = {}) {
    const supabase = createAdminClient();
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let query = supabase
      .from("fulfillments")
      .select(`
        *,
        courier_providers(id, name, code),
        orders(id, order_number, customer_name, customer_phone, grand_total, status)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      query = query.or(`tracking_number.ilike.%${filters.search}%,shipment_reference.ilike.%${filters.search}%`);
    }

    const { data: fulfillments, count, error } = await query;

    if (error) {
      logger.error("Failed to list fulfillments", error, "FulfillmentService");
      throw new Error(`Fulfillment query error: ${error.message}`);
    }

    // Pipeline metrics
    const { data: allFulfillments } = await supabase.from("fulfillments").select("status");
    const metrics = {
      total: allFulfillments?.length || 0,
      created: allFulfillments?.filter((f) => f.status === "CREATED").length || 0,
      picked_up: allFulfillments?.filter((f) => f.status === "PICKED_UP").length || 0,
      in_transit: allFulfillments?.filter((f) => f.status === "IN_TRANSIT").length || 0,
      out_for_delivery: allFulfillments?.filter((f) => f.status === "OUT_FOR_DELIVERY").length || 0,
      delivered: allFulfillments?.filter((f) => f.status === "DELIVERED").length || 0,
      failed: allFulfillments?.filter((f) => f.status === "DELIVERY_FAILED").length || 0,
      returned: allFulfillments?.filter((f) => f.status === "RETURNED").length || 0,
    };

    return {
      fulfillments: fulfillments || [],
      total: count || 0,
      metrics,
    };
  }

  /**
   * Secure 2-Factor Customer Order Tracking Lookup (Order Number + Phone)
   */
  public static async getTrackingByOrderNumberAndPhone(orderNumber: string, rawPhone: string) {
    const supabase = createAdminClient();
    const cleanPhone = rawPhone.trim().replace(/[^0-9]/g, "");

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        status,
        payment_status,
        fulfillment_status,
        created_at,
        shipping_address_snapshot,
        fulfillments(*, courier_providers(name, code)),
        order_events(*)
      `)
      .eq("order_number", orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (error || !order) {
      throw new NotFoundError("No order found matching the provided order reference number.");
    }

    // Verify Phone Number Match
    const orderPhoneClean = order.customer_phone.replace(/[^0-9]/g, "");
    if (!orderPhoneClean.endsWith(cleanPhone.slice(-8)) && !cleanPhone.endsWith(orderPhoneClean.slice(-8))) {
      throw new ValidationError("The phone number does not match this order reference.", { field: "phone" });
    }

    const latestFulfillment = order.fulfillments && order.fulfillments.length > 0 ? order.fulfillments[0] : null;

    return {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      status: order.status,
      fulfillmentStatus: order.fulfillment_status,
      paymentStatus: order.payment_status,
      placedAt: order.created_at,
      shippingDestination: (order.shipping_address_snapshot as { city?: string; area?: string })?.city || "Bangladesh",
      fulfillment: latestFulfillment
        ? {
            trackingNumber: latestFulfillment.tracking_number,
            status: latestFulfillment.status,
            courierName: latestFulfillment.courier_providers?.name || "Rust & Revive Logistics",
            updatedAt: latestFulfillment.updated_at,
          }
        : null,
      timeline: order.order_events || [],
    };
  }
}
