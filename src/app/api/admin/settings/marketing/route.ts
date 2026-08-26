import { NextRequest } from "next/server";
import { MarketingTrackingService } from "@/lib/services/marketing-tracking.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings/marketing
 * Fetch full marketing settings for Admin Panel with masked tokens
 */
export async function GET() {
  try {
    const settings = await MarketingTrackingService.getAdminSettings();
    return successResponse(settings, 200);
  } catch (error: unknown) {
    logger.error("GET /api/admin/settings/marketing error", error, "AdminMarketingSettingsAPI");
    return errorResponse(error, "GET /api/admin/settings/marketing");
  }
}

/**
 * POST /api/admin/settings/marketing
 * Update marketing and tracking configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await MarketingTrackingService.updateSettings(body);
    return successResponse(updated, 200);
  } catch (error: unknown) {
    logger.error("POST /api/admin/settings/marketing error", error, "AdminMarketingSettingsAPI");
    return errorResponse(error, "POST /api/admin/settings/marketing");
  }
}
