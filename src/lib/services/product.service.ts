import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging/logger";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import type { ProductStatus } from "@/types/database.types";

export interface ProductVariantInput {
  title: string;
  sku: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  option_1_name?: string;
  option_1_value?: string;
  option_2_name?: string;
  option_2_value?: string;
  option_3_name?: string;
  option_3_value?: string;
  weight?: number;
  initial_quantity?: number;
}

export interface CreateProductInput {
  title: string;
  slug?: string;
  description?: string;
  short_description?: string;
  status?: ProductStatus;
  product_type?: string;
  brand?: string;
  category_id?: string | null;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  has_variants?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  media_ids?: string[];
  variants?: ProductVariantInput[];
  initial_inventory?: number;
}

export interface ProductQueryFilters {
  status?: ProductStatus | "ALL";
  category_id?: string;
  search?: string;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export class ProductService {
  /**
   * List products with server-side pagination, search, and status filtering
   */
  public static async getProducts(filters: ProductQueryFilters = {}) {
    const supabase = createAdminClient();
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let query = supabase
      .from("products")
      .select(`
        *,
        categories(id, name, slug),
        product_media(media_id, is_primary, sort_order, media(public_url, alt_text)),
        inventory(id, quantity, reserved_quantity, low_stock_threshold)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to query products from Supabase", error, "ProductService");
      throw new Error(`Product query error: ${error.message}`);
    }

    return {
      products: data || [],
      total: count || 0,
    };
  }

  /**
   * Get single product by Slug for Public Storefront
   */
  public static async getProductBySlug(slug: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(id, name, slug),
        product_variants(*),
        product_media(media_id, is_primary, sort_order, media(public_url, alt_text, width, height)),
        inventory(quantity, reserved_quantity, low_stock_threshold)
      `)
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Get single product by ID for Admin Editing
   */
  public static async getProductById(id: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(id, name, slug),
        product_variants(*),
        product_media(media_id, is_primary, sort_order, media(id, public_url, original_filename, alt_text)),
        inventory(id, variant_id, quantity, reserved_quantity, low_stock_threshold)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    return data;
  }

  /**
   * Create product atomically with variants, inventory, and media links
   */
  public static async createProduct(input: CreateProductInput) {
    const supabase = createAdminClient();

    let baseSlug = (
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    ).trim();

    if (!baseSlug) {
      baseSlug = `product-${Date.now().toString(36)}`;
    }

    // Ensure unique slug automatically (appends -1, -2, etc. if title/slug already exists)
    let slug = baseSlug;
    let slugCounter = 1;

    while (true) {
      const { data: existingSlugRow } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existingSlugRow) {
        break; // Unique slug confirmed
      }

      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    // 1. Verify unique SKU
    const { data: existingSku } = await supabase
      .from("products")
      .select("id")
      .eq("sku", input.sku)
      .maybeSingle();

    if (existingSku) {
      throw new ValidationError(`Product SKU '${input.sku}' already exists. Please choose a different SKU.`, { field: "sku" });
    }

    // 2. Insert main Product row
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert({
        title: input.title,
        slug,
        description: input.description || null,
        short_description: input.short_description || null,
        status: input.status || "DRAFT",
        product_type: input.product_type || "Physical",
        brand: input.brand || "Rust & Revive",
        category_id: input.category_id || null,
        base_price: input.base_price,
        compare_at_price: input.compare_at_price || null,
        cost_price: input.cost_price || null,
        sku: input.sku,
        barcode: input.barcode || null,
        has_variants: input.has_variants || false,
        is_featured: input.is_featured || false,
        is_active: input.is_active !== undefined ? input.is_active : true,
        sort_order: input.sort_order || 0,
        tags: input.tags || [],
        seo_title: input.seo_title || input.title,
        seo_description: input.seo_description || input.short_description || null,
      })
      .select()
      .single();

    if (prodErr || !product) {
      logger.error("Failed to insert product record", prodErr, "ProductService");
      throw new Error(`Product creation failed: ${prodErr?.message}`);
    }

    const createdProd = product as { id: string; sku: string };

    // 3. Attach Media Links if provided
    if (input.media_ids && input.media_ids.length > 0) {
      const mediaRows = input.media_ids.map((mediaId, idx) => ({
        product_id: createdProd.id,
        media_id: mediaId,
        sort_order: idx,
        is_primary: idx === 0,
      }));
      await supabase.from("product_media").insert(mediaRows);
    }

    // 4. Create Product Variants and Inventory Rows
    if (input.has_variants && input.variants && input.variants.length > 0) {
      for (const variant of input.variants) {
        const { data: varRow, error: varErr } = await supabase
          .from("product_variants")
          .insert({
            product_id: createdProd.id,
            title: variant.title,
            sku: variant.sku,
            barcode: variant.barcode || null,
            price: variant.price,
            compare_at_price: variant.compare_at_price || null,
            cost_price: variant.cost_price || null,
            option_1_name: variant.option_1_name || null,
            option_1_value: variant.option_1_value || null,
            option_2_name: variant.option_2_name || null,
            option_2_value: variant.option_2_value || null,
            weight: variant.weight || null,
          })
          .select()
          .single();

        if (varRow && !varErr) {
          const v = varRow as { id: string };
          await supabase.from("inventory").insert({
            product_id: createdProd.id,
            variant_id: v.id,
            quantity: variant.initial_quantity || 0,
            reserved_quantity: 0,
            low_stock_threshold: 3,
          });
        }
      }
    } else {
      // Single product inventory
      await supabase.from("inventory").insert({
        product_id: createdProd.id,
        variant_id: null,
        quantity: input.initial_inventory || 0,
        reserved_quantity: 0,
        low_stock_threshold: 5,
      });
    }

    logger.info("Product created successfully", "ProductService", { id: createdProd.id, sku: createdProd.sku });
    return product;
  }

  /**
   * Update product attributes
   */
  public static async updateProduct(id: string, input: Partial<CreateProductInput>) {
    const supabase = createAdminClient();

    // Strip non-table properties
    const { media_ids: _media_ids, variants: _variants, initial_inventory: _initial_inventory, ...productFields } = input;

    const { data: product, error } = await supabase
      .from("products")
      .update({
        ...productFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    return product;
  }

  /**
   * Bulk Status / Archive Action
   */
  public static async bulkUpdateStatus(ids: string[], status: ProductStatus) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids);

    if (error) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }

    return { updatedCount: ids.length, status };
  }
}
