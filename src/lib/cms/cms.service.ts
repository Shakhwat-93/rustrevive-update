import type { HomepageConfig } from "@/types/cms.types";
import type { Json } from "@/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logging/logger";
import { getDefaultHomepageConfig } from "@/lib/cms/cms.defaults";

export { getDefaultHomepageConfig };

export class CMSService {
  /**
   * Fetch currently published homepage configuration from Supabase PostgreSQL
   */
  public static async getPublishedHomepageConfig(): Promise<HomepageConfig> {
    try {
      const supabase = createPublicServerClient();
      const { data, error } = await supabase
        .from("homepage_cms")
        .select("config, version, status, last_published_at, updated_at")
        .eq("status", "PUBLISHED")
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return getDefaultHomepageConfig();
      }

      const row = data as unknown as { config?: HomepageConfig };
      if (!row.config) {
        return getDefaultHomepageConfig();
      }

      return row.config;
    } catch (err) {
      logger.error("Failed to load published homepage CMS from Supabase", err, "CMSService");
      return getDefaultHomepageConfig();
    }
  }

  /**
   * Save Homepage CMS Draft to Supabase
   */
  public static async saveDraft(config: HomepageConfig): Promise<HomepageConfig> {
    const supabase = createAdminClient();

    const updatedConfig: HomepageConfig = {
      ...config,
      status: "DRAFT",
      lastUpdatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("homepage_cms")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        version: config.version || 1,
        status: "DRAFT",
        config: updatedConfig as unknown as Json,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      logger.error("Failed to save homepage draft to Supabase", error, "CMSService");
      throw new Error(`Draft save failed: ${error.message}`);
    }

    return updatedConfig;
  }

  /**
   * Publish Homepage CMS: Saves to Supabase and triggers on-demand ISR revalidation
   */
  public static async publishHomepage(config: HomepageConfig): Promise<HomepageConfig> {
    const supabase = createAdminClient();

    const publishedConfig: HomepageConfig = {
      ...config,
      version: (config.version || 1) + 1,
      status: "PUBLISHED",
      lastPublishedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("homepage_cms")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        version: publishedConfig.version,
        status: "PUBLISHED",
        config: publishedConfig as unknown as Json,
        last_published_at: publishedConfig.lastPublishedAt,
        updated_at: publishedConfig.lastUpdatedAt,
      });

    if (error) {
      logger.error("Failed to publish homepage config to Supabase", error, "CMSService");
      throw new Error(`Publish failed: ${error.message}`);
    }

    // Trigger instant on-demand Next.js ISR revalidation
    try {
      revalidatePath("/");
      logger.info("Triggered on-demand ISR revalidation for homepage '/'", "CMSService");
    } catch (revalidateErr) {
      logger.warn("ISR revalidation warning", "CMSService", { revalidateErr });
    }

    return publishedConfig;
  }
}
