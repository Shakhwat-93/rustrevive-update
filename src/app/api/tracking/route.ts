import { NextRequest } from "next/server";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body || {};

    if (!orderNumber?.trim() && !phone?.trim()) {
      throw new ValidationError("Please provide either your Order Reference or Phone Number to track your order.", {
        fields: ["orderNumber", "phone"],
      });
    }

    const trackingData = await FulfillmentService.getTracking({
      orderNumber: orderNumber?.trim() || undefined,
      phone: phone?.trim() || undefined,
    });

    return successResponse(trackingData);
  } catch (err: unknown) {
    return errorResponse(err, "PublicTrackingPOST");
  }
}
