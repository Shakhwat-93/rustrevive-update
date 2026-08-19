import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging/logger";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
  product_ids?: string[];
}

export class CollectionService {
  /**
   * List active collections for storefront
   */
  public static async getActiveCollections(): Promise<Collection[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to fetch public collections", error, "CollectionService");
      return [];
    }

    return (data as Collection[]) || [];
  }

  /**
   * List all collections for admin
   */
  public static async listAllCollections(): Promise<Collection[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to list admin collections", error, "CollectionService");
      throw new Error(`Collection fetch error: ${error.message}`);
    }

    return (data as Collection[]) || [];
  }

  /**
   * Create collection and map initial products
   */
  public static async createCollection(input: CreateCollectionInput): Promise<Collection> {
    const supabase = createAdminClient();

    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name: input.name,
        slug,
        description: input.description || null,
        image_url: input.image_url || null,
        sort_order: input.sort_order || 0,
        is_active: input.is_active !== undefined ? input.is_active : true,
        seo_title: input.seo_title || input.name,
        seo_description: input.seo_description || input.description || null,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error("Failed to create collection", error, "CollectionService", { input });
      throw new Error(`Collection creation failed: ${error?.message}`);
    }

    const createdCol = data as Collection;

    // Insert product relationships if provided
    if (input.product_ids && input.product_ids.length > 0) {
      const links = input.product_ids.map((prodId, idx) => ({
        collection_id: createdCol.id,
        product_id: prodId,
        sort_order: idx,
      }));
      await supabase.from("collection_products").insert(links);
    }

    return createdCol;
  }
}
