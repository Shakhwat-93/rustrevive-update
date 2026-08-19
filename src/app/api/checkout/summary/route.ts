import { NextRequest } from "next/server";
import { CheckoutService, type CartItemInput } from "@/lib/services/checkout.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/summary - Pure server-side pricing & shipping calculator
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: CartItemInput[] = body.items || [];
    const shippingMethodId: string | undefined = body.shippingMethodId;

    const summary = await CheckoutService.calculateOrderSummary(items, shippingMethodId);
    return successResponse(summary);
  } catch (error: unknown) {
    logger.error("POST /api/checkout/summary error", error, "CheckoutSummaryAPI");
    return errorResponse(error, "POST /api/checkout/summary");
  }
}

/**
 * GET /api/checkout/summary - Fetch active shipping methods
 */
export async function GET() {
  try {
    const methods = await CheckoutService.getActiveShippingMethods();
    return successResponse(methods);
  } catch (error: unknown) {
    logger.error("GET /api/checkout/summary error", error, "CheckoutSummaryAPI");
    return errorResponse(error, "GET /api/checkout/summary");
  }
}
