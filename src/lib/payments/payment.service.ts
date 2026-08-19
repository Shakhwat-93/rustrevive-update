import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentFactory } from "./payment-factory";
import { NotificationService } from "@/lib/services/notification.service";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { PaymentStatus } from "@/types/database.types";

export interface InitiatePaymentInput {
  orderId: string;
  paymentMethod: string; // 'COD' | 'SSL_COMMERZ' | 'BKASH' | 'NAGAD' | 'STRIPE'
  successUrl: string;
  cancelUrl: string;
}

export class PaymentService {
  /**
   * Initiate payment with provider and log initial transaction
   */
  public static async initiatePayment(input: InitiatePaymentInput) {
    const supabase = createAdminClient();

    // 1. Fetch Order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", input.orderId)
      .single();

    if (orderErr || !order) {
      throw new NotFoundError(`Order ${input.orderId} not found.`);
    }

    const provider = PaymentFactory.getProvider(input.paymentMethod);
    const session = await provider.createPaymentSession({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.grand_total,
      currency: order.currency,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    // 2. Persist Payment Transaction Record
    const { data: tx, error: txErr } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order.id,
        provider: provider.code,
        provider_transaction_id: session.transactionId,
        amount: order.grand_total,
        currency: order.currency,
        status: session.status,
        payment_method: input.paymentMethod,
        gateway_response_metadata: (session.rawMetadata || {}) as unknown as Record<string, string>,
      })
      .select()
      .single();

    if (txErr || !tx) {
      logger.error("Failed to insert payment transaction", txErr, "PaymentService");
      throw new Error(`Failed to create transaction: ${txErr?.message}`);
    }

    logger.info("Payment session initiated", "PaymentService", {
      orderNumber: order.order_number,
      provider: provider.code,
      transactionId: session.transactionId,
    });

    return {
      session,
      transaction: tx,
    };
  }

  /**
   * Server-side verify payment from callback/webhook
   */
  public static async verifyAndProcessPayment(
    transactionId: string,
    providerCode: string,
    rawPayload: Record<string, unknown>
  ) {
    const supabase = createAdminClient();
    const provider = PaymentFactory.getProvider(providerCode);

    // 1. Check existing transaction
    const { data: tx, error: txErr } = await supabase
      .from("payment_transactions")
      .select("*, orders(*)")
      .eq("provider_transaction_id", transactionId)
      .maybeSingle();

    if (txErr || !tx) {
      throw new NotFoundError(`Transaction ${transactionId} not found.`);
    }

    if (tx.status === "PAID") {
      return { verified: true, alreadyProcessed: true, transaction: tx };
    }

    // 2. Verify with gateway
    const verification = await provider.verifyPayment(transactionId, rawPayload);
    const newStatus: PaymentStatus = verification.isPaid ? "PAID" : "FAILED";

    // 3. Update Transaction Record
    const { data: updatedTx } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        gateway_response_metadata: (verification.rawMetadata || {}) as unknown as Record<string, string>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tx.id)
      .select()
      .single();

    const parentOrder = tx.orders as unknown as {
      id: string;
      order_number: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      grand_total: number;
    };

    if (verification.isPaid && parentOrder) {
      // 4. Update Order Status
      await supabase
        .from("orders")
        .update({
          payment_status: "PAID",
          status: "CONFIRMED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", parentOrder.id);

      // 5. Log Timeline Event
      await supabase.from("order_events").insert({
        order_id: parentOrder.id,
        event_type: "PAYMENT_RECEIVED",
        message: `Online payment of ৳${verification.amount.toLocaleString()} received via ${provider.name}`,
        created_by: `${provider.name} Gateway`,
      });

      // 6. Notify Customer & Admin
      await NotificationService.sendOrderNotification({
        type: "PAYMENT_CONFIRMED",
        title: `Payment Verified: ${parentOrder.order_number}`,
        message: `Payment of ৳${verification.amount.toLocaleString()} was successfully verified for order ${parentOrder.order_number}.`,
        orderNumber: parentOrder.order_number,
        orderId: parentOrder.id,
        customerName: parentOrder.customer_name,
        customerPhone: parentOrder.customer_phone,
        customerEmail: parentOrder.customer_email,
        grandTotal: verification.amount,
      });
    }

    return {
      verified: verification.isValid,
      isPaid: verification.isPaid,
      transaction: updatedTx,
    };
  }

  /**
   * Process and log customer refund
   */
  public static async processRefund(
    orderId: string,
    amount: number,
    reason: string,
    actorName: string = "Admin"
  ) {
    const supabase = createAdminClient();

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!tx) {
      throw new NotFoundError(`No payment transaction found for order ${orderId}.`);
    }

    const provider = PaymentFactory.getProvider(tx.provider);
    const refundRes = await provider.refundPayment({
      transactionId: tx.provider_transaction_id || tx.id,
      orderId,
      amount,
      reason,
      actorName,
    });

    if (!refundRes.success) {
      throw new ValidationError(`Refund failed: ${refundRes.message}`);
    }

    // Insert refund record
    const { data: refundRow } = await supabase
      .from("refunds")
      .insert({
        payment_transaction_id: tx.id,
        order_id: orderId,
        amount,
        reason,
        status: "COMPLETED",
        provider_refund_id: refundRes.refundId || null,
        created_by: actorName,
      })
      .select()
      .single();

    // Update order status
    await supabase
      .from("orders")
      .update({
        payment_status: "REFUNDED",
        status: "REFUNDED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Timeline event
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "REFUND_ISSUED",
      message: `Refund of ৳${amount.toLocaleString()} completed by ${actorName}. Reason: ${reason}`,
      created_by: actorName,
    });

    return refundRow;
  }
}
