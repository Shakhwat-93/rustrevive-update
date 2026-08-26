import { NextRequest } from "next/server";
import { IncompleteCheckoutService } from "@/lib/services/incomplete-checkout.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { NotFoundError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/incomplete-checkouts/[id]
 * Fetch single incomplete checkout details with converted order snapshot
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const checkout = await IncompleteCheckoutService.getIncompleteCheckoutById(id);

    if (!checkout) {
      throw new NotFoundError(`Incomplete checkout record ${id} not found.`);
    }

    return successResponse(checkout, 200);
  } catch (error: unknown) {
    logger.error("GET /api/admin/incomplete-checkouts/[id] error", error, "AdminIncompleteCheckoutDetailAPI");
    return errorResponse(error, "GET /api/admin/incomplete-checkouts/[id]");
  }
}

/**
 * DELETE /api/admin/incomplete-checkouts/[id]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await IncompleteCheckoutService.deleteIncompleteCheckout(id);
    return successResponse(result, 200);
  } catch (error: unknown) {
    logger.error("DELETE /api/admin/incomplete-checkouts/[id] error", error, "AdminIncompleteCheckoutDetailAPI");
    return errorResponse(error, "DELETE /api/admin/incomplete-checkouts/[id]");
  }
}
