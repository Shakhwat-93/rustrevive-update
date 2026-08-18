import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getServerEnv } from "@/config/env";

/**
 * Creates a privileged administrative Supabase client using the Service Role Key.
 *
 * CRITICAL SECURITY NOTICE:
 * - This client BYPASSES all PostgreSQL Row Level Security (RLS) policies.
 * - Must ONLY be used in secure server-side workflows (e.g. Background Jobs, Admin Actions, Order Fulfillment).
 * - NEVER import or expose to Client Components. Protected by 'server-only'.
 */
export function createAdminClient() {
  const env = getServerEnv();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
