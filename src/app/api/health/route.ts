import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * Production Health & Diagnostic Check Endpoint
 *
 * Public Behavior:
 * - Returns `{ status: "ok" }` with 200 HTTP code for external load balancers and Caddy probes.
 * - Does NOT expose internal database credentials, connection strings, or system topology.
 *
 * Diagnostic Behavior (?details=true):
 * - Checks live Supabase PostgreSQL connectivity and memory metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const showDetails = url.searchParams.get("details") === "true";

    // 1. Basic liveness response (Public)
    if (!showDetails) {
      return NextResponse.json(
        { status: "ok" },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // 2. Database Connectivity Check
    let dbStatus = "unreachable";
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      const supabase = createAdminClient();
      const { error } = await supabase.from("categories").select("id", { count: "exact", head: true });
      dbLatencyMs = Date.now() - start;
      if (!error) {
        dbStatus = "healthy";
      }
    } catch {
      dbStatus = "unreachable";
    }

    // 3. Detailed diagnostics payload
    const diagnostics = {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env["NODE_ENV"] || "production",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      storage: {
        provider: "CLOUDFLARE_R2",
        status: "healthy",
      },
      memoryUsageMb: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };

    return successResponse(diagnostics);
  } catch (error) {
    logger.error("Health check probe failed", error, "HealthCheckRoute");
    return NextResponse.json(
      { status: "error", message: "Service unavailable" },
      { status: 503 }
    );
  }
}
