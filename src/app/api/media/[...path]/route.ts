import { NextRequest, NextResponse } from "next/server";
import { getStorageService } from "@/lib/storage/storage.service";
import { R2StorageProvider } from "@/lib/storage/r2-storage.provider";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

interface MediaRouteProps {
  params: Promise<{ path: string[] }>;
}

/**
 * GET /api/media/[...path]
 * Streams media binaries directly from Cloudflare R2 with high-performance immutable caching headers.
 */
export async function GET(request: NextRequest, props: MediaRouteProps) {
  const { path } = await props.params;

  if (!path || path.length === 0) {
    return new NextResponse("Invalid media key", { status: 400 });
  }

  const objectKey = path.join("/");
  const ifNoneMatch = request.headers.get("if-none-match");

  try {
    const storage = getStorageService() as R2StorageProvider;
    const { buffer, contentType, etag, contentLength } = await storage.getObject(objectKey);

    // ETag HTTP 304 Not Modified optimization
    if (etag && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          ETag: etag,
        },
      });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/webp",
        "Content-Length": String(contentLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(etag ? { ETag: etag } : {}),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.warn(`Media request failed for object key: ${objectKey}`, "MediaEdgeRoute", {
      objectKey,
      error: error instanceof Error ? error.message : String(error),
    });

    return new NextResponse("Media asset not found in R2", { status: 404 });
  }
}
