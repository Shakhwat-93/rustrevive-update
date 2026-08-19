import { NextRequest } from "next/server";
import { DiscountService } from "@/lib/services/discount.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotal, customerId } = body;

    if (!code) {
      throw new ValidationError("Coupon code is required.", { field: "code" });
    }

    const result = await DiscountService.validateCoupon(code, Number(subtotal) || 0, customerId);
    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "ValidateCouponPOST");
  }
}
