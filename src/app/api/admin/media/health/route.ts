import { MediaDiagnosticsService } from "@/lib/media/media-diagnostics";
import { successResponse, errorResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await MediaDiagnosticsService.runDiagnostics();
    return successResponse(report);
  } catch (error) {
    return errorResponse(error, "GET /api/admin/media/health");
  }
}
