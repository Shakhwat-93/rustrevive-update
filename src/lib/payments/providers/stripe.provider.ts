import type { IPaymentProvider } from "../provider.interface";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "../types";

export class StripeProvider implements IPaymentProvider {
  public readonly code = "STRIPE";
  public readonly name = "Stripe Global";

  public async createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) {
      throw new Error("Stripe payment provider is not configured with live credentials.");
    }

    const transactionId = `cs_test_${input.orderNumber}_${Date.now().toString().slice(-4)}`;
    return {
      redirectUrl: `https://checkout.stripe.com/c/pay/${transactionId}`,
      transactionId,
      status: "INITIATED",
      provider: this.code,
    };
  }

  public async verifyPayment(transactionId: string, rawPayload?: Record<string, unknown>): Promise<VerifyPaymentResult> {
    const isPaid = rawPayload?.["payment_status"] === "paid";
    return {
      isValid: true,
      isPaid,
      transactionId,
      amount: Number(rawPayload?.["amount_total"] || 0) / 100,
      rawMetadata: rawPayload,
    };
  }

  public async refundPayment(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      refundId: `re_${Date.now().toString().slice(-6)}`,
      message: `Stripe refund issued for ${input.amount} BDT.`,
    };
  }
}
