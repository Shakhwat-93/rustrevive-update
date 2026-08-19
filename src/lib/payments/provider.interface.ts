import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "./types";

export interface IPaymentProvider {
  readonly code: string;
  readonly name: string;

  /**
   * Create payment checkout session or intent
   */
  createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult>;

  /**
   * Server-side payment verification
   */
  verifyPayment(transactionId: string, rawPayload?: Record<string, unknown>): Promise<VerifyPaymentResult>;

  /**
   * Issue refund with provider
   */
  refundPayment(input: RefundInput): Promise<RefundResult>;
}
