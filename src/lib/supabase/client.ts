import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getClientEnv } from "@/config/env";

/**
 * Creates a browser-side Supabase client using public credentials.
 * Bounded strictly by PostgreSQL Row Level Security (RLS).
 */
export function createClient() {
  const env = getClientEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
