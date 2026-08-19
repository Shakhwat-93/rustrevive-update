import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/account/profile
 * Returns the authenticated customer's profile.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountProfile:GET");
    }

    const db = createAdminClient();
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    return successResponse({
      id: user.id,
      email: user.email,
      email_confirmed: !!user.email_confirmed_at,
      providers: user.identities?.map((i) => i.provider) ?? [],
      profile: profile ?? null,
    });
  } catch (err: unknown) {
    logger.error("Failed to fetch account profile", err as Error, "AccountProfile:GET");
    return errorResponse(err, "AccountProfile:GET");
  }
}

/**
 * PATCH /api/account/profile
 * Update the authenticated customer's profile.
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse({ message: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, "AccountProfile:PATCH");
    }

    const body = await req.json();

    const allowed = {
      ...(typeof body.first_name === "string" ? { first_name: body.first_name.trim().slice(0, 100) } : {}),
      ...(typeof body.last_name === "string" ? { last_name: body.last_name.trim().slice(0, 100) } : {}),
      ...(typeof body.display_name === "string" ? { display_name: body.display_name.trim().slice(0, 150) } : {}),
      ...(typeof body.phone === "string" ? { phone: body.phone.trim().slice(0, 50) } : {}),
    };

    const db = createAdminClient();
    const { data, error } = await db
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? null,
        ...allowed,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (err: unknown) {
    logger.error("Failed to update account profile", err as Error, "AccountProfile:PATCH");
    return errorResponse(err, "AccountProfile:PATCH");
  }
}
