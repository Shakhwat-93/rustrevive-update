import type { PaymentStatus } from "@/types/database.types";

export interface CreatePaymentSessionInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentSessionResult {
  redirectUrl?: string;
  transactionId: string;
  status: PaymentStatus;
  provider: string;
  rawMetadata?: Record<string, unknown>;
}

export interface VerifyPaymentResult {
  isValid: boolean;
  isPaid: boolean;
  transactionId: string;
  amount: number;
  rawMetadata?: Record<string, unknown>;
}

export interface RefundInput {
  transactionId: string;
  orderId: string;
  amount: number;
  reason: string;
  actorName?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  message: string;
}
