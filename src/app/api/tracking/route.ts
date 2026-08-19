import { NextRequest } from "next/server";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !phone) {
      throw new ValidationError("Order number and phone number are both required.", {
        fields: ["orderNumber", "phone"],
      });
    }

    const trackingData = await FulfillmentService.getTrackingByOrderNumberAndPhone(orderNumber, phone);
    return successResponse(trackingData);
  } catch (err: unknown) {
    return errorResponse(err, "PublicTrackingPOST");
  }
}
