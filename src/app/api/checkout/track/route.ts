import { NextRequest } from "next/server";
import { IncompleteCheckoutService, type TrackCheckoutInput } from "@/lib/services/incomplete-checkout.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/track
 * Debounced progress heartbeat & incomplete checkout persistence
 */
export async function POST(request: NextRequest) {
  try {
    const body: TrackCheckoutInput = await request.json();
    const result = await IncompleteCheckoutService.trackProgress(body);
    return successResponse(result, 200);
  } catch (error: unknown) {
    logger.error("POST /api/checkout/track error", error, "CheckoutTrackAPI");
    return errorResponse(error, "POST /api/checkout/track");
  }
}
