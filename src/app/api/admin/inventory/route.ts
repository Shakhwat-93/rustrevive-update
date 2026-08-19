import { NextRequest } from "next/server";
import { InventoryService, type AdjustStockInput } from "@/lib/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inventory - List inventory stock levels
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await InventoryService.getInventoryLevels({ search, limit, offset });
    return successResponse(result);
  } catch (error: unknown) {
    logger.error("GET /api/admin/inventory error", error, "AdminInventoryAPI");
    return errorResponse(error, "GET /api/admin/inventory");
  }
}

/**
 * POST /api/admin/inventory - Atomic stock adjustment
 */
export async function POST(request: NextRequest) {
  try {
    const body: AdjustStockInput = await request.json();
    const result = await InventoryService.adjustStock(body);
    return successResponse(result);
  } catch (error: unknown) {
    logger.error("POST /api/admin/inventory error", error, "AdminInventoryAPI");
    return errorResponse(error, "POST /api/admin/inventory");
  }
}
