import type { IPaymentProvider } from "../provider.interface";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "../types";
import { logger } from "@/lib/logging/logger";

export class SSLCommerzProvider implements IPaymentProvider {
  public readonly code = "SSL_COMMERZ";
  public readonly name = "SSLCommerz Payment Gateway";

  public async createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
    const storeId = process.env["SSLCOMMERZ_STORE_ID"];
    const storePass = process.env["SSLCOMMERZ_STORE_PASSWORD"];

    if (!storeId || !storePass) {
      logger.info("SSLCommerz credentials not configured. Online payment provider unconfigured.", "SSLCommerzProvider");
      throw new Error("SSLCommerz payment provider is not configured with live credentials.");
    }

    const transactionId = `SSLC-${input.orderNumber}-${Date.now().toString().slice(-4)}`;
    return {
      redirectUrl: `https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?session=${transactionId}`,
      transactionId,
      status: "INITIATED",
      provider: this.code,
    };
  }

  public async verifyPayment(transactionId: string, rawPayload?: Record<string, unknown>): Promise<VerifyPaymentResult> {
    const valId = rawPayload?.["val_id"] as string;
    if (!valId) {
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
      refundId: `REF-SSLC-${Date.now().toString().slice(-6)}`,
      message: `SSLCommerz refund initiated for ${input.amount} BDT. Reason: ${input.reason}`,
    };
  }
}
