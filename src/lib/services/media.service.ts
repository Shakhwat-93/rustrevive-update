import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import { ValidationError } from "@/lib/errors/app-error";

export interface MediaRecord {
  id: string;
  storage_provider: string;
  bucket: string;
  object_key: string;
  public_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterMediaInput {
  object_key: string;
  public_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  created_by?: string;
}

export class MediaService {
  /**
   * List all media assets from the database with pagination & search
   */
  public static async listMedia(options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<{ media: MediaRecord[]; total: number }> {
    const supabase = createAdminClient();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let query = supabase
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.search) {
      query = query.ilike("original_filename", `%${options.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to list media records from Supabase", error, "MediaService");
      throw new Error(`Media fetch error: ${error.message}`);
    }

    return {
      media: (data as MediaRecord[]) || [],
      total: count || 0,
    };
  }

  /**
   * Register a newly uploaded Cloudflare R2 media item in Supabase
   */
  public static async registerMedia(input: RegisterMediaInput): Promise<MediaRecord> {
    const supabase = createAdminClient();

    const insertPayload = {
      storage_provider: "R2",
      bucket: "rustandrevive",
      object_key: input.object_key,
      public_url: input.public_url,
      original_filename: input.original_filename,
      mime_type: input.mime_type,
      file_size: input.file_size,
      width: input.width || null,
      height: input.height || null,
      alt_text: input.alt_text || null,
      created_by: input.created_by || "Admin",
    };

    const { data, error } = await supabase
      .from("media")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      logger.error("Failed to insert media metadata into Supabase", error, "MediaService", { input });
      throw new Error(`Media registration failed: ${error?.message}`);
    }

    const rec = data as MediaRecord;
    logger.info("Media registered successfully", "MediaService", { id: rec.id, key: input.object_key });
    return rec;
  }

  /**
   * Check if a media item is in use by products, categories, collections, or homepage CMS
   */
  public static async checkMediaUsage(mediaId: string): Promise<{ inUse: boolean; references: string[] }> {
    const supabase = createAdminClient();
    const references: string[] = [];

    // 1. Check Product Media
    const { data: prodMedia } = await supabase
      .from("product_media")
      .select("product_id, products(title)")
      .eq("media_id", mediaId)
      .limit(5);

    if (prodMedia && prodMedia.length > 0) {
      for (const item of prodMedia) {
        const title = item.products?.title || item.product_id;
        references.push(`Product: ${title}`);
      }
    }

    // 2. Check Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("name")
      .eq("image_url", mediaId)
      .limit(5);

    if (categories && categories.length > 0) {
      for (const cat of categories) {
        const catItem = cat as { name?: string };
        references.push(`Category: ${catItem.name || "Unknown"}`);
      }
    }

    // 3. Check Collections
    const { data: collections } = await supabase
      .from("collections")
      .select("name")
      .eq("image_url", mediaId)
      .limit(5);

    if (collections && collections.length > 0) {
      for (const col of collections) {
        const colItem = col as { name?: string };
        references.push(`Collection: ${colItem.name || "Unknown"}`);
      }
    }

    return {
      inUse: references.length > 0,
      references,
    };
  }

  /**
   * Safe Delete: Verifies references before deleting from Cloudflare R2 and Supabase
   */
  public static async deleteMedia(mediaId: string): Promise<{ success: boolean }> {
    const supabase = createAdminClient();

    // Check references first
    const { inUse, references } = await this.checkMediaUsage(mediaId);
    if (inUse) {
      throw new ValidationError(
        `Cannot delete media. It is currently referenced by: ${references.join(", ")}`,
        { references }
      );
    }

    // Fetch media record to get object_key
    const { data: media, error: fetchErr } = await supabase
      .from("media")
      .select("object_key")
      .eq("id", mediaId)
      .single();

    if (fetchErr || !media) {
      throw new Error(`Media not found: ${mediaId}`);
    }

    // Delete from Supabase
    const { error: deleteErr } = await supabase
      .from("media")
      .delete()
      .eq("id", mediaId);

    if (deleteErr) {
      throw new Error(`Failed to delete media record: ${deleteErr.message}`);
    }

    const objKey = (media as { object_key: string }).object_key;
    logger.info("Media deleted successfully", "MediaService", { id: mediaId, key: objKey });
    return { success: true };
  }
}
