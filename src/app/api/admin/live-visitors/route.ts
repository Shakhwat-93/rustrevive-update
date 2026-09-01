import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const ACTIVE_WINDOW_SECONDS = 90;

/**
 * GET /api/admin/live-visitors
 * Admin-only endpoint. Returns currently active visitor sessions.
 * Used for:
 * - Initial page load fetch
 * - Reconnect reconciliation after realtime disconnect
 */
export async function GET(_req: Request) {
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();

    const { data, error } = await supabase
      .from("live_visitors")
      .select(`
        id,
        visitor_id,
        session_id,
        tab_id,
        current_path,
        page_title,
        page_type,
        product_id,
        category_id,
        device_type,
        browser,
        os,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        started_at,
        last_seen_at,
        is_active,
        products:product_id ( id, title, slug ),
        categories:category_id ( id, name, slug )
      `)
      .gte("last_seen_at", cutoff)
      .order("last_seen_at", { ascending: false });

    if (error) throw error;

    return successResponse(data ?? []);
  } catch (err) {
    return errorResponse(err, "AdminLiveVisitorsGET");
  }
}
