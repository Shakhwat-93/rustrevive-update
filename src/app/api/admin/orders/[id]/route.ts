import { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import type { OrderStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/orders/[id] - Fetch single order details with snapshots and timeline
 */
export async function GET(_request: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const order = await OrderService.getOrderById(id);
    return successResponse(order);
  } catch (error: unknown) {
    logger.error("GET /api/admin/orders/[id] error", error, "AdminOrderDetailAPI");
    return errorResponse(error, "GET /api/admin/orders/[id]");
  }
}

/**
 * PATCH /api/admin/orders/[id] - Mutate order status (governed by state machine) or add staff note
 */
export async function PATCH(request: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { action, status, reason, note, actorName = "Admin Staff" } = body;

    if (action === "update_status" && status) {
      const updated = await OrderService.updateOrderStatus(id, status as OrderStatus, actorName, reason);
      return successResponse(updated);
    }

    if (action === "add_note" && note) {
      const updated = await OrderService.addOrderNote(id, note, actorName);
      return successResponse(updated);
    }

    return errorResponse(new Error("Invalid order action requested"), "PATCH /api/admin/orders/[id]");
  } catch (error: unknown) {
    logger.error("PATCH /api/admin/orders/[id] error", error, "AdminOrderDetailAPI");
    return errorResponse(error, "PATCH /api/admin/orders/[id]");
  }
}
