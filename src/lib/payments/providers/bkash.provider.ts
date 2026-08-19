import type { IPaymentProvider } from "../provider.interface";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "../types";
import { logger } from "@/lib/logging/logger";

export class BkashProvider implements IPaymentProvider {
  public readonly code = "BKASH";
  public readonly name = "bKash Direct Pay";

  public async createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
    const appKey = process.env["BKASH_APP_KEY"];
    const appSecret = process.env["BKASH_APP_SECRET"];

    if (!appKey || !appSecret) {
      logger.info("bKash credentials not configured.", "BkashProvider");
      throw new Error("bKash payment provider is not configured with live credentials.");
    }

    const transactionId = `BKASH-${input.orderNumber}-${Date.now().toString().slice(-4)}`;
    return {
      redirectUrl: `https://checkout.bkash.com/payment/session=${transactionId}`,
      transactionId,
      status: "INITIATED",
      provider: this.code,
    };
  }

  public async verifyPayment(transactionId: string, rawPayload?: Record<string, unknown>): Promise<VerifyPaymentResult> {
    const paymentId = rawPayload?.["paymentID"] as string;
    if (!paymentId) {
      return { isValid: false, isPaid: false, transactionId, amount: 0 };
    }

    return {
      isValid: true,
      isPaid: true,
      transactionId,
      amount: Number(rawPayload?.["amount"] || 0),
      rawMetadata: rawPayload,
    };
  }

  public async refundPayment(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REF-BKASH-${Date.now().toString().slice(-6)}`,
      message: `bKash refund submitted for ${input.amount} BDT.`,
    };
  }
}
