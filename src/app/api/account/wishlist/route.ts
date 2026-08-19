import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WishlistService } from "@/lib/services/wishlist.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/account/wishlist
 * Returns wishlist items for the authenticated customer.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountWishlist:GET");
    }

    const db = createAdminClient();
    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return successResponse([]);
    }

    const items = await WishlistService.getCustomerWishlist(customer.id);
    return successResponse(items);
  } catch (err: unknown) {
    logger.error("Failed to fetch customer wishlist", err as Error, "AccountWishlist:GET");
    return errorResponse(err, "AccountWishlist:GET");
  }
}

/**
 * POST /api/account/wishlist
 * Toggle an item in the authenticated customer's wishlist.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountWishlist:POST");
    }

    const db = createAdminClient();
    let { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: createErr } = await db
        .from("customers")
        .insert({
          auth_user_id: user.id,
          name: user.email || "Customer",
          phone: "",
          email: user.email ?? null,
        })
        .select("id")
        .single();

      if (createErr) throw createErr;
      customer = newCustomer;
    }

    if (!customer) {
      throw new Error("Could not initialize customer account");
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      throw new ValidationError("productId is required", { field: "productId" });
    }

    const result = await WishlistService.toggleWishlistItem(customer.id, productId);
    return successResponse(result);
  } catch (err: unknown) {
    logger.error("Failed to toggle wishlist item", err as Error, "AccountWishlist:POST");
    return errorResponse(err, "AccountWishlist:POST");
  }
}
