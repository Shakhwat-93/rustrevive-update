import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const actionFilter = searchParams.get("action");

    const supabase = createAdminClient();

    let query = supabase
      .from("audit_logs")
      .select("id, actor_id, actor_name, action, resource, resource_id, changes, created_at, ip_address")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (actionFilter && actionFilter !== "ALL") {
      query = query.eq("action", actionFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedLogs = (data || []).map((log) => {
      let details = "";
      if (log.changes) {
        if (typeof log.changes === "string") {
          details = log.changes;
        } else if (typeof log.changes === "object") {
          details = JSON.stringify(log.changes);
        }
      } else {
        details = `${log.action} performed on ${log.resource} (${log.resource_id})`;
      }

      return {
        id: log.id,
        action: log.action,
        actorName: log.actor_name || "System Admin",
        resource: log.resource,
        resourceId: log.resource_id,
        details,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      };
    });

    return successResponse({ logs: formattedLogs, totalCount: formattedLogs.length });
  } catch (err: unknown) {
    return errorResponse(err, "AdminAuditLogsGET");
  }
}
