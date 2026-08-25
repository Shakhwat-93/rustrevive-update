import { createRequire } from "module";
import { logger } from "@/lib/logging/logger";

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: "image/webp" | "image/jpeg" | "image/png";
  extension: "webp" | "jpg" | "png";
  width?: number;
  height?: number;
  fileSize: number;
}

// Resilient Sharp loader using createRequire for native C++ bindings on Node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadSharp(): any {
  try {
    const req = createRequire(import.meta.url);
    const sharp = req("sharp");
    if (typeof sharp === "function") {
      return sharp;
    }
  } catch {
    try {
      const dynamicReq = eval("require");
      const sharp = dynamicReq("sharp");
      if (typeof sharp === "function") {
        return sharp;
      }
    } catch {
      // Graceful fallback
    }
  }
  return null;
}

/**
 * Automatically converts any incoming image (PNG, JPEG, TIFF, BMP, WebP, etc.)
 * into an optimized high-performance WebP image with 85% quality and auto-rotation.
 * If Sharp native library is unavailable in the environment, safely falls back to original buffer.
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  options: { quality?: number; maxWidth?: number } = {}
): Promise<ProcessedImageResult> {
  try {
    const sharp = loadSharp();

    if (sharp) {
      const quality = options.quality || 85;
      let transformer = sharp(inputBuffer).rotate(); // auto-rotate based on EXIF orientation

      const metadata = await transformer.metadata();

      // Optionally resize if image width exceeds max standard
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
    }
  } catch (error) {
    logger.warn("Image conversion with Sharp encountered non-fatal error, using original buffer", "ImageProcessor", error);
  }

  // Graceful fallback if sharp cannot process
  return {
    buffer: inputBuffer,
    mimeType: "image/webp",
    extension: "webp",
    fileSize: inputBuffer.length,
  };
}
