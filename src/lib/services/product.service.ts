import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  size_chart?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encodeSizeChart(description?: string | null, sizeChart?: any): string | null {
  let cleanDesc = description || "";
  cleanDesc = cleanDesc.replace(/<!-- SIZE_CHART_JSON:[\s\S]*?-->/g, "").trim();
  if (sizeChart && sizeChart.mode && sizeChart.mode !== "none") {
    cleanDesc = `${cleanDesc}\n<!-- SIZE_CHART_JSON: ${JSON.stringify(sizeChart)} -->`;
  }
  return cleanDesc || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSizeChart(description?: string | null): { cleanDescription: string | null; sizeChart: any | null } {
  if (!description) return { cleanDescription: null, sizeChart: null };
  const match = description.match(/<!-- SIZE_CHART_JSON:\s*([\s\S]*?)\s*-->/);
  if (match && match[1]) {
    try {
      const sizeChart = JSON.parse(match[1]);
      const cleanDescription = description.replace(/<!-- SIZE_CHART_JSON:[\s\S]*?-->/g, "").trim();
      return { cleanDescription: cleanDescription || null, sizeChart };
    } catch {
      // ignore parse error
    }
  }
  return { cleanDescription: description, sizeChart: null };
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
   * List active products for public storefront with complete media, variants, inventory, and categories
   */
  public static async getStorefrontProducts(filters: {
    category_id?: string;
    search?: string;
    is_featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const supabase = createAdminClient();
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    let query = supabase
      .from("products")
      .select(`
        id,
        title,
        short_description,
        slug,
        base_price,
        compare_at_price,
        category_id,
        sku,
        status,
        is_featured,
        is_active,
        sort_order,
        created_at,
        categories (
          id,
          name,
          slug
        ),
        product_media (
          is_primary,
          sort_order,
          media (
            public_url,
            alt_text
          )
        ),
        product_variants (
          id,
          title,
          sku,
          price,
          compare_at_price,
          is_active,
          inventory (
            id,
            quantity,
            reserved_quantity
          )
        ),
        inventory (
          id,
          quantity,
          reserved_quantity
        ),
        product_reviews (
          id,
          rating,
          status
        )
      `)
      .eq("is_active", true)
      .eq("status", "ACTIVE")
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to query storefront products", error, "ProductService");
      throw new Error(`Storefront products query error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * List active categories for public storefront navigation and filters
   */
  public static async getStorefrontCategories() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Failed to query storefront categories", error, "ProductService");
      return [];
    }

    return data || [];
  }

  /**
   * Get single product by Slug for Public Storefront
   */
  public static async getProductBySlug(slug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(id, name, slug),
        product_variants(*, inventory(id, quantity, reserved_quantity, low_stock_threshold)),
        product_media(media_id, is_primary, sort_order, media(public_url, alt_text, width, height)),
        inventory(id, quantity, reserved_quantity, low_stock_threshold)
      `)
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const { cleanDescription, sizeChart } = extractSizeChart(data.description);
    return {
      ...data,
      description: cleanDescription,
      size_chart: sizeChart,
    };
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

    const { cleanDescription, sizeChart } = extractSizeChart(data.description);
    return {
      ...data,
      description: cleanDescription,
      size_chart: sizeChart,
    };
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
    const finalDescription = encodeSizeChart(input.description, input.size_chart);

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert({
        title: input.title,
        slug,
        description: finalDescription,
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
   * Update product attributes, variants, inventory, and media
   */
  public static async updateProduct(id: string, input: Partial<CreateProductInput>) {
    const supabase = createAdminClient();

    // Strip non-table properties
    const { media_ids: _media_ids, variants, initial_inventory, size_chart, ...productFields } = input;

    let finalDescription = productFields.description;
    if (size_chart !== undefined || productFields.description !== undefined) {
      finalDescription = encodeSizeChart(productFields.description, size_chart) ?? undefined;
    }

    const { data: product, error } = await supabase
      .from("products")
      .update({
        ...productFields,
        ...(finalDescription !== undefined ? { description: finalDescription } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    // Sync Variants and Inventory if provided
    if (input.has_variants && variants && variants.length > 0) {
      for (const variant of variants) {
        // Find if variant already exists
        const { data: existingVar } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", id)
          .eq("sku", variant.sku)
          .maybeSingle();

        if (existingVar) {
          // Update existing variant
          await supabase
            .from("product_variants")
            .update({
              title: variant.title,
              price: variant.price,
              compare_at_price: variant.compare_at_price || null,
              cost_price: variant.cost_price || null,
              weight: variant.weight || null,
              is_active: true,
            })
            .eq("id", existingVar.id);

          // Update existing inventory
          if (variant.initial_quantity !== undefined) {
            await supabase
              .from("inventory")
              .update({ quantity: variant.initial_quantity })
              .eq("product_id", id)
              .eq("variant_id", existingVar.id);
          }
        } else {
          // Insert new variant
          const { data: newVar } = await supabase
            .from("product_variants")
            .insert({
              product_id: id,
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
              option_3_name: variant.option_3_name || null,
              option_3_value: variant.option_3_value || null,
              weight: variant.weight || null,
            })
            .select()
            .single();

          if (newVar) {
            await supabase.from("inventory").insert({
              product_id: id,
              variant_id: (newVar as { id: string }).id,
              quantity: variant.initial_quantity || 0,
              reserved_quantity: 0,
              low_stock_threshold: 3,
            });
          }
        }
      }
    } else if (initial_inventory !== undefined) {
      // Sync single product inventory
      const { data: invRow } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", id)
        .is("variant_id", null)
        .maybeSingle();

      if (invRow) {
        await supabase
          .from("inventory")
          .update({ quantity: initial_inventory })
          .eq("id", invRow.id);
      } else {
        await supabase.from("inventory").insert({
          product_id: id,
          variant_id: null,
          quantity: initial_inventory,
          reserved_quantity: 0,
          low_stock_threshold: 5,
        });
      }
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
