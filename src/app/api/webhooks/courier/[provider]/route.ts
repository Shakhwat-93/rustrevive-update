import { NextRequest } from "next/server";
import { CourierFactory } from "@/lib/courier/courier-factory";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
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
      // urlencoded or plain text body fallback
      parsedBody = { raw: rawBody };
    }

    const headersRecord: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersRecord[key] = val;
    });

    const courier = CourierFactory.getProvider(provider);
    const normalized = await courier.handleWebhook({
      rawBody,
      headers: headersRecord,
      parsedBody,
    });

    if (!normalized.isValid || !normalized.trackingNumber) {
      logger.warn(`Invalid or unparseable webhook from ${provider}`, "CourierWebhook", { rawBody });
      throw new ValidationError("Webhook payload unparseable or rejected.", { provider });
    }

    if (normalized.normalizedStatus) {
      await FulfillmentService.updateFulfillmentStatus(
        normalized.trackingNumber,
        normalized.normalizedStatus,
        normalized.message,
        `${courier.name} Webhook`
      );
    }

    logger.info(`Webhook processed successfully for ${provider}`, "CourierWebhook", {
      trackingNumber: normalized.trackingNumber,
      status: normalized.normalizedStatus,
    });

    return successResponse({ processed: true, trackingNumber: normalized.trackingNumber });
  } catch (err: unknown) {
    return errorResponse(err, "CourierWebhookPOST");
  }
}
