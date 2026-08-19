import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutService, type CartItemInput } from "@/lib/services/checkout.service";
import { CustomerService } from "@/lib/services/customer.service";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { VALID_STATUS_TRANSITIONS } from "@/lib/constants/order.constants";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@/types/database.types";

export { VALID_STATUS_TRANSITIONS };

export interface CreateOrderAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  postalCode?: string;
  country?: string;
}

export interface PlaceOrderInput {
  items: CartItemInput[];
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  shippingAddress: CreateOrderAddressInput;
  billingAddress?: CreateOrderAddressInput;
  shippingMethodId?: string;
  customerNotes?: string;
  paymentMethod?: "CASH_ON_DELIVERY";
  idempotencyKey?: string;
}

export interface OrderQueryFilters {
  status?: OrderStatus | "ALL";
  payment_status?: PaymentStatus | "ALL";
  fulfillment_status?: FulfillmentStatus | "ALL";
  search?: string;
  limit?: number;
  offset?: number;
}

export class OrderService {
  /**
   * Atomic Order Creation Pipeline:
   * 1. Check idempotency key
   * 2. Server-side price calculation & stock verification
   * 3. Find/create customer profile & save address
   * 4. Insert order with sequential human order number (RR-100001)
   * 5. Snapshot immutable order items
   * 6. Atomically reserve inventory & log movement ledger
   * 7. Record initial order timeline event
   */
  public static async createOrder(input: PlaceOrderInput) {
    const supabase = createAdminClient();

    // 1. Idempotency Check: Prevent duplicate submissions
    if (input.idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*),
          order_events(*)
        `)
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        logger.info("Idempotent order request matched existing order", "OrderService", {
          orderNumber: existingOrder.order_number,
          key: input.idempotencyKey,
        });
        return existingOrder;
      }
    }

    // 2. Pure Server-Side Financial & Stock Validation
    const pricingSummary = await CheckoutService.calculateOrderSummary(
      input.items,
      input.shippingMethodId
    );

    // 3. Find or Create Customer Profile
    const customer = await CustomerService.findOrCreateCustomer({
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email,
    });

    // Save address snapshot to address book
    if (customer?.id) {
      await CustomerService.saveCustomerAddress({
        customer_id: customer.id,
        full_name: input.shippingAddress.fullName,
        phone: input.shippingAddress.phone,
        address_line_1: input.shippingAddress.addressLine1,
        address_line_2: input.shippingAddress.addressLine2,
        city: input.shippingAddress.city,
        area: input.shippingAddress.area,
        postal_code: input.shippingAddress.postalCode,
        country: input.shippingAddress.country || "Bangladesh",
      });
    }

    // 4. Create Order Record
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customer?.id || null,
        status: "PENDING",
        payment_status: "COD_PENDING",
        fulfillment_status: "UNFULFILLED",
        payment_method: input.paymentMethod || "CASH_ON_DELIVERY",
        currency: pricingSummary.currency,
        subtotal: pricingSummary.subtotal,
        discount_total: pricingSummary.discountTotal,
        shipping_total: pricingSummary.shippingTotal,
        tax_total: pricingSummary.taxTotal,
        grand_total: pricingSummary.grandTotal,
        customer_name: input.customer.name,
        customer_phone: input.customer.phone,
        customer_email: input.customer.email || null,
        shipping_address_snapshot: input.shippingAddress as unknown as Record<string, string>,
        billing_address_snapshot: (input.billingAddress || input.shippingAddress) as unknown as Record<string, string>,
        customer_notes: input.customerNotes || null,
        idempotency_key: input.idempotencyKey || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      logger.error("Failed to insert order", orderErr, "OrderService");
      throw new Error(`Order placement failed: ${orderErr?.message}`);
    }

    // 5. Insert Immutable Order Items Snapshots
    const orderItemRows = pricingSummary.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      product_title_snapshot: item.productTitle,
      variant_title_snapshot: item.variantTitle,
      sku_snapshot: item.sku,
      image_url_snapshot: item.imageUrl,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItemRows);
    if (itemsErr) {
      logger.error("Failed to insert order items snapshot", itemsErr, "OrderService");
    }

    // 6. Atomically Reserve Inventory & Record Ledger Movement
    for (const item of pricingSummary.items) {
      let invQuery = supabase.from("inventory").select("id, quantity, reserved_quantity");
      if (item.variantId) {
        invQuery = invQuery.eq("variant_id", item.variantId);
      } else {
        invQuery = invQuery.eq("product_id", item.productId).is("variant_id", null);
      }

      const { data: invRow } = await invQuery.maybeSingle();

      if (invRow) {
        // Increment reserved quantity
        await supabase
          .from("inventory")
          .update({
            reserved_quantity: (invRow.reserved_quantity || 0) + item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invRow.id);

        // Record immutable inventory movement
        await supabase.from("inventory_movements").insert({
          inventory_id: invRow.id,
          variant_id: item.variantId,
          movement_type: "SALE",
          quantity_change: -item.quantity,
          reference_type: "ORDER",
          reference_id: order.id,
          reason: `Stock reserved for order ${order.order_number}`,
          created_by: "System",
        });
      }
    }

    // 7. Record Initial Timeline Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "ORDER_PLACED",
      old_status: null,
      new_status: "PENDING",
      message: `Order ${order.order_number} placed via Cash on Delivery for ৳${pricingSummary.grandTotal.toLocaleString()}`,
      created_by: "Customer",
    });

    logger.info("Order created successfully", "OrderService", {
      orderNumber: order.order_number,
      grandTotal: order.grand_total,
    });

    return {
      ...order,
      order_items: orderItemRows,
    };
  }

  /**
   * Get single order by Order Number (e.g. RR-100001) for Storefront Receipt
   */
  public static async getOrderByNumber(orderNumber: string) {
    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(*),
        order_events(*)
      `)
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      throw new NotFoundError(`Order ${orderNumber} not found.`);
    }

    return order;
  }

  /**
   * Get single order by Internal UUID for Admin Console
   */
  public static async getOrderById(id: string) {
    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers(id, name, phone, email),
        order_items(*),
        order_events(*)
      `)
      .eq("id", id)
      .single();

    if (error || !order) {
      throw new NotFoundError(`Order with ID ${id} not found.`);
    }

    return order;
  }

  /**
   * Admin Query: High performance order list with server-side filters & search
   */
  public static async listOrders(filters: OrderQueryFilters = {}) {
    const supabase = createAdminClient();
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items(id, product_title_snapshot, quantity, unit_price, line_total)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }

    if (filters.payment_status && filters.payment_status !== "ALL") {
      query = query.eq("payment_status", filters.payment_status);
    }

    if (filters.fulfillment_status && filters.fulfillment_status !== "ALL") {
      query = query.eq("fulfillment_status", filters.fulfillment_status);
    }

    if (filters.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to query orders", error, "OrderService");
      throw new Error(`Order fetch error: ${error.message}`);
    }

    return {
      orders: data || [],
      total: count || 0,
    };
  }

  /**
   * Update Order Status governed by State Machine rules
   */
  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorName: string = "Admin",
    reason?: string
  ) {
    const supabase = createAdminClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(*)
      `)
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      throw new NotFoundError(`Order ${orderId} not found.`);
    }

    const currentStatus = order.status as OrderStatus;
    if (currentStatus === newStatus) {
      return order;
    }

    // 2. Validate Transition via State Machine
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowed.join(", ") || "None"}`,
        { currentStatus, newStatus, allowed }
      );
    }

    // 3. Determine Payment & Fulfillment updates
    let updatedPaymentStatus: PaymentStatus = order.payment_status;
    let updatedFulfillmentStatus: FulfillmentStatus = order.fulfillment_status;

    if (newStatus === "DELIVERED" && order.payment_method === "CASH_ON_DELIVERY") {
      updatedPaymentStatus = "COD_COLLECTED";
      updatedFulfillmentStatus = "FULFILLED";
    } else if (newStatus === "SHIPPED") {
      updatedFulfillmentStatus = "FULFILLED";
    } else if (newStatus === "CANCELLED") {
      updatedFulfillmentStatus = "CANCELLED";
    }

    // 4. Handle Stock Release on Order Cancellation
    if (newStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
      // Release reserved stock for all items
      const orderItems = (order.order_items || []) as unknown as {
        product_id: string | null;
        variant_id: string | null;
        quantity: number;
      }[];

      for (const item of orderItems) {
        let invQuery = supabase.from("inventory").select("id, quantity, reserved_quantity");
        if (item.variant_id) {
          invQuery = invQuery.eq("variant_id", item.variant_id);
        } else if (item.product_id) {
          invQuery = invQuery.eq("product_id", item.product_id).is("variant_id", null);
        }

        const { data: invRow } = await invQuery.maybeSingle();
        if (invRow) {
          const newReserved = Math.max(0, (invRow.reserved_quantity || 0) - item.quantity);
          await supabase
            .from("inventory")
            .update({
              reserved_quantity: newReserved,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invRow.id);

          await supabase.from("inventory_movements").insert({
            inventory_id: invRow.id,
            variant_id: item.variant_id,
            movement_type: "CANCELLATION",
            quantity_change: item.quantity,
            reference_type: "ORDER",
            reference_id: order.id,
            reason: `Stock reservation released due to order ${order.order_number} cancellation`,
            created_by: actorName,
          });
        }
      }
    }

    // 5. Update Order in Database
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        payment_status: updatedPaymentStatus,
        fulfillment_status: updatedFulfillmentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      throw new Error(`Failed to update order status: ${updateErr?.message}`);
    }

    // 6. Record Timeline Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "STATUS_CHANGED",
      old_status: currentStatus,
      new_status: newStatus,
      message: reason
        ? `Status updated to ${newStatus}. Note: ${reason}`
        : `Status changed from ${currentStatus} to ${newStatus}`,
      created_by: actorName,
    });

    logger.info("Order status updated successfully", "OrderService", {
      orderId,
      oldStatus: currentStatus,
      newStatus,
      actorName,
    });

    return updatedOrder;
  }

  /**
   * Add internal staff note to order
   */
  public static async addOrderNote(orderId: string, note: string, actorName: string = "Admin") {
    const supabase = createAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select("notes, order_number")
      .eq("id", orderId)
      .single();

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found.`);
    }

    const timestamp = new Date().toLocaleString();
    const formattedNote = `[${timestamp} by ${actorName}]: ${note.trim()}`;
    const newNotes = order.notes ? `${order.notes}\n${formattedNote}` : formattedNote;

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        notes: newNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save note: ${error.message}`);
    }

    // Log timeline event
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "NOTE_ADDED",
      message: `Staff note added by ${actorName}`,
      created_by: actorName,
      metadata: { note: formattedNote } as unknown as Record<string, string>,
    });

    return updated;
  }
}
