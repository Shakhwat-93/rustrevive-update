import { NextRequest } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, sessionId, userId, resourceType, resourceId, metadata } = body;

    if (!eventType) {
      return successResponse({ tracked: false });
    }

    await AnalyticsService.trackEvent({
      eventType,
      sessionId,
      userId,
      resourceType,
      resourceId,
      metadata,
    });

    return successResponse({ tracked: true });
  } catch (err: unknown) {
    return errorResponse(err, "AnalyticsTrackPOST");
  }
}
