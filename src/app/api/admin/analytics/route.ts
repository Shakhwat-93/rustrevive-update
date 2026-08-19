import { NextRequest } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    let days = 30;
    if (range === "today") days = 1;
    else if (range === "7d") days = 7;
    else if (range === "90d") days = 90;

    const metrics = await AnalyticsService.getDashboardMetrics(days);
    return successResponse(metrics);
  } catch (err: unknown) {
    return errorResponse(err, "AdminAnalyticsGET");
  }
}
