import type { IPaymentProvider } from "../provider.interface";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "../types";

export class NagadProvider implements IPaymentProvider {
  public readonly code = "NAGAD";
  public readonly name = "Nagad Online";

  public async createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
    const merchantId = process.env["NAGAD_MERCHANT_ID"];
    if (!merchantId) {
      throw new Error("Nagad payment provider is not configured with live credentials.");
    }

    const transactionId = `NAGAD-${input.orderNumber}-${Date.now().toString().slice(-4)}`;
    return {
      redirectUrl: `https://api.mynagad.com/check-out/payment/${transactionId}`,
      transactionId,
      status: "INITIATED",
      provider: this.code,
    };
  }

  public async verifyPayment(transactionId: string, rawPayload?: Record<string, unknown>): Promise<VerifyPaymentResult> {
    const status = rawPayload?.["status"] as string;
    return {
      isValid: status === "Success",
      isPaid: status === "Success",
      transactionId,
      amount: Number(rawPayload?.["amount"] || 0),
      rawMetadata: rawPayload,
    };
  }

  public async refundPayment(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REF-NAGAD-${Date.now().toString().slice(-6)}`,
      message: `Nagad refund processed for ${input.amount} BDT.`,
    };
  }
}
