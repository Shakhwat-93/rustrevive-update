import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

/**
 * POST /api/account/logout
 * Secure server-side session invalidation.
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    logger.info("Customer signed out", "AccountLogout:POST");
    return successResponse({ signed_out: true });
  } catch (err: unknown) {
    logger.error("Logout error", err as Error, "AccountLogout:POST");
    return errorResponse(err, "AccountLogout:POST");
  }
}
