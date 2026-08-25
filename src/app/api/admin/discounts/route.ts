import { NextRequest } from "next/server";
import { DiscountService, type PromotionRuleConfig } from "@/lib/services/discount.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || undefined;

    const status = (["ALL", "ACTIVE", "SCHEDULED", "EXPIRED", "DISABLED", "DRAFT"].includes(rawStatus)
      ? rawStatus
      : "ALL") as "ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "DRAFT";

    const discounts = await DiscountService.listDiscounts({ status, search });
    return successResponse(discounts);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountsGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, rules } = body;

    if (!code || !name) {
      throw new ValidationError("Discount title and code are required.", { fields: ["code", "name"] });
    }

    const ruleConfig: PromotionRuleConfig = rules || {
      promotionType: "AMOUNT_OFF_ORDER",
      method: "CODE",
      valueType: "PERCENTAGE",
      value: Number(body.value) || 10,
      appliesTo: "ALL_PRODUCTS",
      minimumRequirementType: body.minimum_order_amount ? "MINIMUM_PURCHASE_AMOUNT" : "NONE",
      minimumPurchaseAmount: Number(body.minimum_order_amount) || 0,
      customerEligibility: "ALL_CUSTOMERS",
      usageLimit: body.usage_limit ? Number(body.usage_limit) : null,
      perCustomerLimit: body.per_customer_limit ? Number(body.per_customer_limit) : 1,
      startsAt: body.starts_at || null,
      endsAt: body.ends_at || null,
      combinations: {
        canCombineWithProductDiscounts: false,
        canCombineWithOrderDiscounts: false,
        canCombineWithShippingDiscounts: false,
      },
    };

    const discount = await DiscountService.createDiscount({
      code,
      name,
      rules: ruleConfig,
    });

    return successResponse(discount, 201);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountsPOST");
  }
}
