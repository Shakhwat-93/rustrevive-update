import { NextRequest } from "next/server";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import type { DeliveryStatus } from "@/types/database.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "ALL") as DeliveryStatus | "ALL";
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await FulfillmentService.listFulfillments({
      status,
      search,
      limit,
      offset,
    });

    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "AdminFulfillmentGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, courierCode, instructions, actorName } = body;

    if (!orderId) {
      throw new ValidationError("orderId is required", { field: "orderId" });
    }

    const fulfillment = await FulfillmentService.createShipmentForOrder({
      orderId,
      courierCode: courierCode || "CUSTOM",
      instructions,
      actorName: actorName || "Admin Staff",
    });

    return successResponse(fulfillment, 201);
  } catch (err: unknown) {
    return errorResponse(err, "AdminFulfillmentPOST");
  }
}
