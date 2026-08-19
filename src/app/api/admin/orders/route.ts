import { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders - High performance admin order list with filters & server search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status") || "ALL";
    const status: OrderStatus | "ALL" = rawStatus as OrderStatus | "ALL";
    const payment_status = (searchParams.get("payment_status") || "ALL") as PaymentStatus | "ALL";
    const fulfillment_status = (searchParams.get("fulfillment_status") || "ALL") as FulfillmentStatus | "ALL";
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await OrderService.listOrders({
      status,
      payment_status,
      fulfillment_status,
      search,
      limit,
      offset,
    });

    return successResponse(result);
  } catch (error: unknown) {
    logger.error("GET /api/admin/orders error", error, "AdminOrdersAPI");
    return errorResponse(error, "GET /api/admin/orders");
  }
}
