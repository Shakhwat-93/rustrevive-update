import { NextRequest } from "next/server";
import { IncompleteCheckoutService } from "@/lib/services/incomplete-checkout.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/incomplete-checkouts
 * Fetch paginated incomplete / abandoned checkouts with KPI summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await IncompleteCheckoutService.getIncompleteCheckouts({
      status,
      search,
      page,
      limit,
      startDate,
      endDate,
    });

    return successResponse(data, 200);
  } catch (error: unknown) {
    logger.error("GET /api/admin/incomplete-checkouts error", error, "AdminIncompleteCheckoutsAPI");
    return errorResponse(error, "GET /api/admin/incomplete-checkouts");
  }
}

/**
 * DELETE /api/admin/incomplete-checkouts?id=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Incomplete checkout ID is required", { field: "id" });
    }

    const result = await IncompleteCheckoutService.deleteIncompleteCheckout(id);
    return successResponse(result, 200);
  } catch (error: unknown) {
    logger.error("DELETE /api/admin/incomplete-checkouts error", error, "AdminIncompleteCheckoutsAPI");
    return errorResponse(error, "DELETE /api/admin/incomplete-checkouts");
  }
}
