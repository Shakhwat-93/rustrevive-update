import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStorageService } from "@/lib/storage/storage.service";
import { R2StorageProvider } from "@/lib/storage/r2-storage.provider";
import { logger } from "@/lib/logging/logger";

export interface MediaHealthReport {
  totalMediaCount: number;
  totalProductsCount: number;
  productsWithoutMedia: Array<{ id: string; title: string; slug: string }>;
  verifiedR2ObjectsCount: number;
  missingR2ObjectsCount: number;
  brokenMedia: Array<{ id: string; objectKey: string; error?: string }>;
  healthy: boolean;
}

export class MediaDiagnosticsService {
  public static async runDiagnostics(): Promise<MediaHealthReport> {
    const supabase = createAdminClient();
    const storage = getStorageService() as R2StorageProvider;

    // 1. Fetch products and media
    const { data: products } = await supabase
      .from("products")
      .select("id, title, slug, product_media(id, media_id, is_primary)");

    const { data: mediaRecords } = await supabase
      .from("media")
      .select("id, object_key, public_url, mime_type, file_size");

    const prods = products || [];
    const media = mediaRecords || [];

    const productsWithoutMedia = prods
      .filter((p) => !p.product_media || p.product_media.length === 0)
      .map((p) => ({ id: p.id, title: p.title, slug: p.slug }));

    let verifiedCount = 0;
    const brokenMedia: Array<{ id: string; objectKey: string; error?: string }> = [];

    // 2. Validate R2 Objects existence
    for (const m of media) {
      try {
        const meta = await storage.getObjectMetadata(m.object_key);
        if (meta.exists) {
          verifiedCount++;
        } else {
          brokenMedia.push({ id: m.id, objectKey: m.object_key, error: "Object not found in R2" });
        }
      } catch (err) {
        brokenMedia.push({
          id: m.id,
          objectKey: m.object_key,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const report: MediaHealthReport = {
      totalMediaCount: media.length,
      totalProductsCount: prods.length,
      productsWithoutMedia,
      verifiedR2ObjectsCount: verifiedCount,
      missingR2ObjectsCount: brokenMedia.length,
      brokenMedia,
      healthy: brokenMedia.length === 0,
    };

    logger.info("Executed Media Diagnostics", "MediaDiagnosticsService", {
      total: report.totalMediaCount,
      verified: report.verifiedR2ObjectsCount,
      broken: report.missingR2ObjectsCount,
    });

    return report;
  }
}
