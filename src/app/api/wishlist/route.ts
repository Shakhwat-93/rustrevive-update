import { NextRequest } from "next/server";
import { WishlistService } from "@/lib/services/wishlist.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      throw new ValidationError("customerId is required", { field: "customerId" });
    }

    const items = await WishlistService.getCustomerWishlist(customerId);
    return successResponse(items);
  } catch (err: unknown) {
    return errorResponse(err, "WishlistGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, productId } = body;

    if (!customerId || !productId) {
      throw new ValidationError("customerId and productId are required.", {
        fields: ["customerId", "productId"],
      });
    }

    const result = await WishlistService.toggleWishlistItem(customerId, productId);
    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "WishlistPOST");
  }
}
