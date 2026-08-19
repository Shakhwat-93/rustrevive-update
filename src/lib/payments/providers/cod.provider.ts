import type { IPaymentProvider } from "../provider.interface";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "../types";

export class CODProvider implements IPaymentProvider {
  public readonly code = "COD";
  public readonly name = "Cash on Delivery";

  public async createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult> {
    return {
      transactionId: `COD-${input.orderNumber}`,
      status: "COD_PENDING",
      provider: this.code,
      rawMetadata: {
        method: "CASH_ON_DELIVERY",
        amount: input.amount,
        currency: input.currency,
      },
    };
  }

  public async verifyPayment(transactionId: string): Promise<VerifyPaymentResult> {
    return {
      isValid: true,
      isPaid: false, // Remains unpaid until courier delivers
      transactionId,
      amount: 0,
      rawMetadata: { status: "COD_COLLECTION_PENDING" },
    };
  }

  public async refundPayment(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REF-COD-${Date.now().toString().slice(-6)}`,
      message: `Cash refund recorded for order ${input.orderId}. Reason: ${input.reason}`,
    };
  }
}
