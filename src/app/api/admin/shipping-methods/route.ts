import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

const shippingMethodSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be positive"),
  estimated_days: z.string().min(1, "Estimated days required"),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

/**
 * GET /api/admin/shipping-methods
 * Fetch all shipping methods for admin management
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return successResponse(data || []);
  } catch (err: unknown) {
    return errorResponse(err, "AdminShippingMethods:GET");
  }
}

/**
 * POST /api/admin/shipping-methods
 * Create new shipping method
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = shippingMethodSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        estimated_days: parsed.data.estimated_days,
        is_active: parsed.data.is_active,
        sort_order: parsed.data.sort_order,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info("Admin created shipping method", "AdminShippingMethods:POST", { id: data.id });
    return successResponse(data, 201);
  } catch (err: unknown) {
    return errorResponse(err, "AdminShippingMethods:POST");
  }
}
