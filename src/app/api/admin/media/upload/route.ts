import { NextRequest } from "next/server";
import { getStorageService } from "@/lib/storage/storage.service";
import { MediaService } from "@/lib/services/media.service";
import { generateStorageKey } from "@/lib/storage/key-generator";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/media/upload
 * Handles direct file upload (multipart/form-data) from Admin, uploads to R2, and registers in DB.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customAlt = (formData.get("alt_text") as string) || "";

    if (!file) {
      throw new ValidationError("No file provided for upload");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const contentType = file.type || "image/webp";
    const fileSize = file.size;

    // Generate unique storage key in products namespace
    const storageKey = generateStorageKey("products", originalName);

    const storage = getStorageService();
    const storedAsset = await storage.uploadBuffer(buffer, storageKey, contentType);

    // Register in database
    const mediaRecord = await MediaService.registerMedia({
      object_key: storedAsset.storageKey,
      public_url: storedAsset.publicUrl,
      original_filename: originalName,
      mime_type: contentType,
      file_size: fileSize,
      alt_text: customAlt || originalName.replace(/\.[^/.]+$/, ""),
      created_by: "Admin",
    });

    logger.info("Admin uploaded product media successfully", "AdminMediaUpload", {
      id: mediaRecord.id,
      url: mediaRecord.public_url,
    });

    return successResponse(mediaRecord, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/media/upload failed", error as Error, "AdminMediaUpload");
    return errorResponse(error, "POST /api/admin/media/upload");
  }
}
