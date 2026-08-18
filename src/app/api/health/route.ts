import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * Production Health Check Endpoint
 *
 * Public Behavior:
 * - Returns `{ status: "ok" }` with 200 HTTP code for external load balancers and Caddy probes.
 * - Does NOT expose internal database credentials, connection strings, or system topology.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const showDetails = url.searchParams.get("details") === "true";

    // Basic liveness response
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

    // Detailed diagnostic check (Internal use only)
    const diagnostics = {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env["NODE_ENV"] || "development",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
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
