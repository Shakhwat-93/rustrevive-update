import { NextRequest } from "next/server";
import { DiscountService } from "@/lib/services/discount.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const discounts = await DiscountService.listDiscounts();
    return successResponse(discounts);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountsGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, type, value, minimum_order_amount, maximum_discount_amount, usage_limit, per_customer_limit, starts_at, ends_at } = body;

    if (!code || !name || !type || value === undefined) {
      throw new ValidationError("Missing required coupon fields.", { fields: ["code", "name", "type", "value"] });
    }

    const discount = await DiscountService.createDiscount({
      code,
      name,
      type,
      value: Number(value),
      minimum_order_amount: Number(minimum_order_amount) || 0,
      maximum_discount_amount: maximum_discount_amount ? Number(maximum_discount_amount) : undefined,
      usage_limit: usage_limit ? Number(usage_limit) : undefined,
      per_customer_limit: per_customer_limit ? Number(per_customer_limit) : 1,
      starts_at,
      ends_at,
    });

    return successResponse(discount, 201);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountsPOST");
  }
}
