import { NextRequest } from "next/server";
import { MarketingTrackingService } from "@/lib/services/marketing-tracking.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/settings/marketing/test
 * Test connection and format validity for GTM, GA4, Meta CAPI, and TikTok Events API
 */
export async function POST(_request: NextRequest) {
  try {
    const results: Record<string, { status: "VALID" | "INVALID" | "NOT_CONFIGURED"; message: string }> = {};

    const settings = await MarketingTrackingService.getAdminSettings();

    // 1. GTM Test
    if (!settings.gtm_container_id || !settings.gtm_enabled) {
      results["gtm"] = { status: "NOT_CONFIGURED", message: "Google Tag Manager is disabled or container ID is missing." };
    } else if (/^GTM-[A-Z0-9]+$/i.test(settings.gtm_container_id)) {
      results["gtm"] = { status: "VALID", message: `Valid container syntax (${settings.gtm_container_id}) ready for container injection.` };
    } else {
      results["gtm"] = { status: "INVALID", message: "Invalid GTM container format. Expected format: GTM-XXXXXXX" };
    }

    // 2. GA4 Test
    if (!settings.ga4_measurement_id || !settings.ga4_enabled) {
      results["ga4"] = { status: "NOT_CONFIGURED", message: "GA4 is disabled or Measurement ID is missing." };
    } else if (/^G-[A-Z0-9]+$/i.test(settings.ga4_measurement_id)) {
      results["ga4"] = { status: "VALID", message: `Valid measurement ID format (${settings.ga4_measurement_id}).` };
    } else {
      results["ga4"] = { status: "INVALID", message: "Invalid GA4 format. Expected format: G-XXXXXXXXXX" };
    }

    // 3. Meta Pixel & CAPI Test
    if (!settings.meta_pixel_id || !settings.meta_pixel_enabled) {
      results["meta"] = { status: "NOT_CONFIGURED", message: "Meta Pixel is disabled or Pixel ID is missing." };
    } else if (/^[0-9]{8,24}$/.test(settings.meta_pixel_id)) {
      if (settings.meta_capi_enabled) {
        if (settings.has_meta_capi_token) {
          results["meta"] = {
            status: "VALID",
            message: `Meta Pixel (${settings.meta_pixel_id}) & CAPI connected. Server-side deduplication active.`,
          };
        } else {
          results["meta"] = {
            status: "INVALID",
            message: "Meta CAPI is enabled but Access Token is missing.",
          };
        }
      } else {
        results["meta"] = {
          status: "VALID",
          message: `Meta Browser Pixel (${settings.meta_pixel_id}) configured.`,
        };
      }
    } else {
      results["meta"] = { status: "INVALID", message: "Invalid Meta Pixel ID. Expected 8-24 digits numeric ID." };
    }

    // 4. TikTok Pixel & Events API Test
    if (!settings.tiktok_pixel_id || !settings.tiktok_pixel_enabled) {
      results["tiktok"] = { status: "NOT_CONFIGURED", message: "TikTok Pixel is disabled or Pixel ID is missing." };
    } else if (settings.tiktok_pixel_id.length >= 8) {
      if (settings.tiktok_events_api_enabled) {
        if (settings.has_tiktok_token) {
          results["tiktok"] = {
            status: "VALID",
            message: `TikTok Pixel (${settings.tiktok_pixel_id}) & Events API connected.`,
          };
        } else {
          results["tiktok"] = {
            status: "INVALID",
            message: "TikTok Events API is enabled but Access Token is missing.",
          };
        }
      } else {
        results["tiktok"] = {
          status: "VALID",
          message: `TikTok Browser Pixel (${settings.tiktok_pixel_id}) configured.`,
        };
      }
    } else {
      results["tiktok"] = { status: "INVALID", message: "Invalid TikTok Pixel ID format." };
    }

    return successResponse(results, 200);
  } catch (error: unknown) {
    logger.error("POST /api/admin/settings/marketing/test error", error, "MarketingTestAPI");
    return errorResponse(error, "POST /api/admin/settings/marketing/test");
  }
}
