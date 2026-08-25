import { NextRequest } from "next/server";
import { DiscountService, type DiscountItemContext } from "@/lib/services/discount.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, items, subtotal, shippingTotal, customerId, customerEmail } = body;

    if (!code || typeof code !== "string") {
      throw new ValidationError("Discount code is required.", { field: "code" });
    }

    // Format items if provided, or fallback to simple subtotal placeholder item
    let formattedItems: DiscountItemContext[] = [];
    if (Array.isArray(items) && items.length > 0) {
      formattedItems = items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        categoryId: i.categoryId || null,
        collectionIds: i.collectionIds || [],
        unitPrice: Number(i.unitPrice) || 0,
        quantity: Math.max(1, Number(i.quantity) || 1),
        title: i.title || "Product",
      }));
    } else {
      const numSubtotal = Math.max(0, Number(subtotal) || 0);
      formattedItems = [
        {
          productId: "general-cart",
          unitPrice: numSubtotal,
          quantity: 1,
          title: "Cart Subtotal",
        },
      ];
    }

    const result = await DiscountService.validatePromotion(
      code,
      formattedItems,
      Number(shippingTotal) || 120,
      customerId,
      customerEmail
    );

    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "ValidateCouponPOST");
  }
}
