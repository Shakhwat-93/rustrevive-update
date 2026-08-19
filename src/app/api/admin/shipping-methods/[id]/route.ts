import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  estimated_days: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/shipping-methods/[id]
 * Update an existing shipping method
 */
export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Invalid update data");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .update({
        ...parsed.data,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logger.info("Admin updated shipping method", "AdminShippingMethods:PATCH", { id });
    return successResponse(data);
  } catch (err: unknown) {
    return errorResponse(err, "AdminShippingMethods:PATCH");
  }
}

/**
 * DELETE /api/admin/shipping-methods/[id]
 * Delete a shipping method
 */
export async function DELETE(_req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("shipping_methods").delete().eq("id", id);

    if (error) throw error;

    logger.info("Admin deleted shipping method", "AdminShippingMethods:DELETE", { id });
    return successResponse({ success: true });
  } catch (err: unknown) {
    return errorResponse(err, "AdminShippingMethods:DELETE");
  }
}
