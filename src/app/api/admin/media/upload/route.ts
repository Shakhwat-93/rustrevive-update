import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getStorageService } from "@/lib/storage/storage.service";
import { MediaService } from "@/lib/services/media.service";
import { generateStorageKey, sanitizeFilename } from "@/lib/storage/key-generator";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { convertToWebP } from "@/lib/media/image-processor";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/media/upload
 * 1. Accepts ANY image format (PNG, JPEG, TIFF, BMP, WebP, etc.).
 * 2. Automatically converts and optimizes the image to WebP format.
 * 3. Uploads to Cloudflare R2 (with resilient local storage fallback).
 * 4. Records the media in Supabase PostgreSQL `media` table.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customAlt = (formData.get("alt_text") as string) || "";

    if (!file) {
      throw new ValidationError("No file provided for upload");
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const webpFilename = `${sanitizeFilename(baseName)}.webp`;

    // 1. Automatically Convert to High-Quality Optimized WebP
    const { buffer: webpBuffer, mimeType, width, height, fileSize } =
      await convertToWebP(rawBuffer, { quality: 85, maxWidth: 2560 });

    // 2. Generate unique storage key
    const storageKey = generateStorageKey("products", webpFilename);

    let publicUrl = "";
    let storageProvider = "R2";

    // 3. Attempt upload to Cloudflare R2
    try {
      const storage = getStorageService();
      const storedAsset = await storage.uploadBuffer(webpBuffer, storageKey, mimeType);
      publicUrl = storedAsset.publicUrl;
      storageProvider = "R2";
    } catch (r2Error) {
      logger.warn(
        "Cloudflare R2 upload unavailable or failed, falling back to resilient local storage",
        "AdminMediaUpload",
        { key: storageKey, error: r2Error instanceof Error ? r2Error.message : String(r2Error) }
      );

      // Local storage fallback: public/uploads/{storageKey}
      const localFilePath = path.join(process.cwd(), "public", "uploads", storageKey);
      const localDir = path.dirname(localFilePath);

      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(localFilePath, webpBuffer);

      publicUrl = `/uploads/${storageKey}`;
      storageProvider = "LOCAL";
    }

    // 4. Register media in Supabase PostgreSQL
    const mediaRecord = await MediaService.registerMedia({
      object_key: storageKey,
      public_url: publicUrl,
      original_filename: webpFilename,
      mime_type: mimeType,
      file_size: fileSize,
      width,
      height,
      alt_text: customAlt || baseName,
      created_by: "Admin",
    });

    logger.info("Product media processed and uploaded successfully as WebP", "AdminMediaUpload", {
      id: mediaRecord.id,
      url: mediaRecord.public_url,
      provider: storageProvider,
      originalSize: rawBuffer.length,
      webpSize: fileSize,
    });

    return successResponse(mediaRecord, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/media/upload failed", error as Error, "AdminMediaUpload");
    return errorResponse(error, "POST /api/admin/media/upload");
  }
}
