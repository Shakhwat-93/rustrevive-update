import { MarketingTrackingService } from "@/lib/services/marketing-tracking.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/tracking/config
 * Public endpoint to fetch client-safe tracking IDs (GTM, GA4, Meta Pixel, TikTok Pixel).
 * Secrets (CAPI tokens) are strictly stripped out.
 */
export async function GET() {
  try {
    const config = await MarketingTrackingService.getPublicConfig();
    return successResponse(config, 200);
  } catch (error: unknown) {
    logger.error("GET /api/tracking/config error", error, "PublicTrackingConfigAPI");
    return errorResponse(error, "GET /api/tracking/config");
  }
}
