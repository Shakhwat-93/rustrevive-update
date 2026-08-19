import { NextRequest } from "next/server";
import { OrderService, type PlaceOrderInput } from "@/lib/services/order.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/place-order - Atomic Order Placement Endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body: PlaceOrderInput = await request.json();
    const order = await OrderService.createOrder(body);
    return successResponse(order, 201);
  } catch (error: unknown) {
    logger.error("POST /api/checkout/place-order error", error, "PlaceOrderAPI");
    return errorResponse(error, "POST /api/checkout/place-order");
  }
}
