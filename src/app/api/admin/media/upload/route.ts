import { NextRequest } from "next/server";
import { getStorageService } from "@/lib/storage/storage.service";
import { MediaService } from "@/lib/services/media.service";
import { generateStorageKey, sanitizeFilename } from "@/lib/storage/key-generator";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError, StorageError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { convertToWebP } from "@/lib/media/image-processor";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/tiff",
  "image/bmp",
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB max upload limit

/**
 * POST /api/admin/media/upload
 * 1. Validates file MIME type and size.
 * 2. Automatically converts and optimizes image to WebP format.
 * 3. Uploads directly to Cloudflare R2 bucket.
 * 4. Confirms R2 upload before recording media in Supabase PostgreSQL.
 * 5. Returns canonical media URL.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customAlt = (formData.get("alt_text") as string) || "";

    if (!file) {
      throw new ValidationError("No file provided for upload");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(`File size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    }

    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      throw new ValidationError(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF, TIFF, BMP`);
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const webpFilename = `${sanitizeFilename(baseName)}.webp`;

    // 1. Automatically Convert to High-Quality Optimized WebP
    const { buffer: webpBuffer, mimeType, width, height, fileSize } =
      await convertToWebP(rawBuffer, { quality: 85, maxWidth: 2560 });

    // 2. Generate unique immutable storage key
    const storageKey = generateStorageKey("products", webpFilename);

    // 3. Upload strictly to Cloudflare R2 bucket
    const storage = getStorageService();
    const storedAsset = await storage.uploadBuffer(webpBuffer, storageKey, mimeType);

    if (!storedAsset || !storedAsset.storageKey) {
      throw new StorageError("Cloudflare R2 upload did not return a valid asset confirmation");
    }

    // 4. Register confirmed media in Supabase PostgreSQL
    const mediaRecord = await MediaService.registerMedia({
      object_key: storedAsset.storageKey,
      public_url: storedAsset.publicUrl,
      original_filename: webpFilename,
      mime_type: mimeType,
      file_size: fileSize,
      width,
      height,
      alt_text: customAlt || baseName,
      created_by: "Admin",
    });

    logger.info("Product media processed and uploaded to Cloudflare R2", "AdminMediaUpload", {
      id: mediaRecord.id,
      storageKey: mediaRecord.object_key,
      publicUrl: mediaRecord.public_url,
      originalSize: rawBuffer.length,
      webpSize: fileSize,
    });

    return successResponse(mediaRecord, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/media/upload failed", error as Error, "AdminMediaUpload");
    return errorResponse(error, "POST /api/admin/media/upload");
  }
}
