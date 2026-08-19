import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging/logger";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
}

export class CategoryService {
  /**
   * List active categories for public storefront
   */
  public static async getActiveCategories(): Promise<Category[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to fetch public categories", error, "CategoryService");
      return [];
    }

    return (data as Category[]) || [];
  }

  /**
   * List all categories for admin management
   */
  public static async listAllCategories(): Promise<Category[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to list admin categories", error, "CategoryService");
      throw new Error(`Category fetch error: ${error.message}`);
    }

    return (data as Category[]) || [];
  }

  /**
   * Create category with unique slug generation
   */
  public static async createCategory(input: CreateCategoryInput): Promise<Category> {
    const supabase = createAdminClient();

    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      throw new ValidationError(`Category slug '${slug}' already exists.`, { field: "slug" });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: input.name,
        slug,
        description: input.description || null,
        image_url: input.image_url || null,
        parent_id: input.parent_id || null,
        sort_order: input.sort_order || 0,
        is_active: input.is_active !== undefined ? input.is_active : true,
        seo_title: input.seo_title || input.name,
        seo_description: input.seo_description || input.description || null,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error("Failed to create category", error, "CategoryService", { input });
      throw new Error(`Category creation failed: ${error?.message}`);
    }

    return data as Category;
  }

  /**
   * Update category
   */
  public static async updateCategory(id: string, input: Partial<CreateCategoryInput>): Promise<Category> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("categories")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError(`Category with ID ${id} not found.`);
    }

    return data as Category;
  }
}
