import { NextRequest } from "next/server";
import { PaymentService } from "@/lib/payments/payment.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const { provider } = await props.params;
    const rawBody = await req.text();

    let parsedBody: Record<string, unknown> = {};
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      // urlencoded body support
      const searchParams = new URLSearchParams(rawBody);
      parsedBody = Object.fromEntries(searchParams.entries());
    }

    const transactionId = (parsedBody["tran_id"] || parsedBody["paymentID"] || parsedBody["transaction_id"]) as string;

    if (!transactionId) {
      throw new ValidationError("Transaction ID not present in webhook.", { provider });
    }

    const result = await PaymentService.verifyAndProcessPayment(transactionId, provider, parsedBody);

    logger.info(`Payment webhook processed for ${provider}`, "PaymentWebhook", {
      transactionId,
      verified: result.verified,
      isPaid: result.isPaid,
    });

    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "PaymentWebhookPOST");
  }
}
