import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/account/addresses
 * Returns addresses belonging to the authenticated customer.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountAddresses:GET");
    }

    const db = createAdminClient();
    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) return successResponse([]);

    const { data: addresses, error } = await db
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false });

    if (error) throw error;

    return successResponse(addresses || []);
  } catch (err: unknown) {
    logger.error("Failed to fetch addresses", err as Error, "AccountAddresses:GET");
    return errorResponse(err, "AccountAddresses:GET");
  }
}

/**
 * POST /api/account/addresses
 * Create a new address for the authenticated customer.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountAddresses:POST");
    }

    const body = await req.json();
    const db = createAdminClient();

    // Get the customer record — server determines customer_id, never trust client
    let { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      // Create customer record linked to this auth user
      const { data: newCustomer, error: createError } = await db
        .from("customers")
        .insert({
          auth_user_id: user.id,
          name: String(body.full_name || user.email || "Customer"),
          phone: String(body.phone || ""),
          email: user.email ?? null,
        })
        .select("id")
        .single();

      if (createError) throw createError;
      customer = newCustomer;
    }

    if (!customer) {
      throw new Error("Could not initialize customer account");
    }

    const { data: address, error } = await db
      .from("customer_addresses")
      .insert({
        customer_id: customer.id,
        full_name: String(body.full_name || "").trim().slice(0, 150),
        phone: String(body.phone || "").trim().slice(0, 50),
        address_line_1: String(body.address_line_1 || "").trim().slice(0, 255),
        address_line_2: body.address_line_2 ? String(body.address_line_2).trim().slice(0, 255) : null,
        city: String(body.city || "").trim().slice(0, 100),
        area: body.area ? String(body.area).trim().slice(0, 100) : null,
        postal_code: body.postal_code ? String(body.postal_code).trim().slice(0, 30) : null,
        country: "Bangladesh",
        is_default: !!body.is_default,
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(address, 201);
  } catch (err: unknown) {
    logger.error("Failed to create address", err as Error, "AccountAddresses:POST");
    return errorResponse(err, "AccountAddresses:POST");
  }
}
