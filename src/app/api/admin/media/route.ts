import { NextRequest } from "next/server";
import { MediaService } from "@/lib/services/media.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/media - List all media assets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await MediaService.listMedia({ search, limit, offset });
    return successResponse(result);
  } catch (error: unknown) {
    logger.error("GET /api/admin/media error", error, "AdminMediaAPI");
    return errorResponse(error, "GET /api/admin/media");
  }
}

/**
 * POST /api/admin/media - Register newly uploaded R2 asset metadata in database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const media = await MediaService.registerMedia(body);
    return successResponse(media, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/media error", error, "AdminMediaAPI");
    return errorResponse(error, "POST /api/admin/media");
  }
}

/**
 * DELETE /api/admin/media - Safe delete media asset after checking references
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse(new Error("Missing media ID parameter"), "DELETE /api/admin/media");
    }

    const result = await MediaService.deleteMedia(id);
    return successResponse(result);
  } catch (error: unknown) {
    logger.error("DELETE /api/admin/media error", error, "AdminMediaAPI");
    return errorResponse(error, "DELETE /api/admin/media");
  }
}
