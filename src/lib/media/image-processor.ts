import sharp from "sharp";
import { logger } from "@/lib/logging/logger";

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: "image/webp";
  extension: "webp";
  width?: number;
  height?: number;
  fileSize: number;
}

/**
 * Automatically converts any incoming image (PNG, JPEG, TIFF, BMP, WebP, etc.)
 * into an optimized high-performance WebP image with 85% quality and auto-rotation.
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  options: { quality?: number; maxWidth?: number } = {}
): Promise<ProcessedImageResult> {
  try {
    const quality = options.quality || 85;
    let transformer = sharp(inputBuffer).rotate(); // auto-rotate based on EXIF orientation

    const metadata = await transformer.metadata();

    // Optionally resize if image width exceeds max standard (e.g. 2400px for high-res zoom)
    if (options.maxWidth && metadata.width && metadata.width > options.maxWidth) {
      transformer = transformer.resize({
        width: options.maxWidth,
        withoutEnlargement: true,
      });
    }

    // Convert to WebP format with progressive encoding & effort 4
    const webpBuffer = await transformer
      .webp({
        quality,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    // Re-read processed dimensions
    const processedMetadata = await sharp(webpBuffer).metadata();

    return {
      buffer: webpBuffer,
      mimeType: "image/webp",
      extension: "webp",
      width: processedMetadata.width || metadata.width,
      height: processedMetadata.height || metadata.height,
      fileSize: webpBuffer.length,
    };
  } catch (error) {
    logger.error("Failed to process and convert image to WebP", error, "ImageProcessor");
    throw new Error(
      `Image conversion failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
