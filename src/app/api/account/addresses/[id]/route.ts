import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/account/addresses/[id]
 * Update one of the authenticated customer's addresses.
 */
export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountAddresses:PATCH");
    }

    const db = createAdminClient();
    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return errorResponse({ message: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, "AccountAddresses:PATCH");
    }

    const body = await req.json();
    const updatePayload = {
      ...(body.full_name !== undefined ? { full_name: String(body.full_name).trim().slice(0, 150) } : {}),
      ...(body.phone !== undefined ? { phone: String(body.phone).trim().slice(0, 50) } : {}),
      ...(body.address_line_1 !== undefined ? { address_line_1: String(body.address_line_1).trim().slice(0, 255) } : {}),
      ...(body.address_line_2 !== undefined ? { address_line_2: body.address_line_2 ? String(body.address_line_2).trim() : null } : {}),
      ...(body.city !== undefined ? { city: String(body.city).trim().slice(0, 100) } : {}),
      ...(body.area !== undefined ? { area: body.area ? String(body.area).trim() : null } : {}),
      ...(body.postal_code !== undefined ? { postal_code: body.postal_code ? String(body.postal_code).trim() : null } : {}),
      ...(body.is_default !== undefined ? { is_default: !!body.is_default } : {}),
    };

    const { data, error } = await db
      .from("customer_addresses")
      .update(updatePayload)
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (err: unknown) {
    logger.error("Failed to update address", err as Error, "AccountAddresses:PATCH");
    return errorResponse(err, "AccountAddresses:PATCH");
  }
}

/**
 * DELETE /api/account/addresses/[id]
 */
export async function DELETE(_req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountAddresses:DELETE");
    }

    const db = createAdminClient();
    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return errorResponse({ message: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, "AccountAddresses:DELETE");
    }

    const { error } = await db
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);

    if (error) throw error;

    logger.info("Customer deleted address", "AccountAddresses:DELETE", { addressId: id, userId: user.id });
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    logger.error("Failed to delete address", err as Error, "AccountAddresses:DELETE");
    return errorResponse(err, "AccountAddresses:DELETE");
  }
}
