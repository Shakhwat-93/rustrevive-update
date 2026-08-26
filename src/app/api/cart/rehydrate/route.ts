import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

interface RehydrateItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface RehydratedCartItem {
  productId: string;
  variantId?: string | null;
  title: string;
  variantTitle?: string | null;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  quantity: number;
  requestedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  isOutOfStock: boolean;
  isQuantityAdjusted: boolean;
  categoryId?: string | null;
  statusMessage?: string | null;
}

/**
 * POST /api/cart/rehydrate
 * Authoritative server-side batch rehydration & inventory/price validation for persistent cart
 */
export async function POST(request: NextRequest) {
  try {
    const body: { items: RehydrateItemInput[] } = await request.json();
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    if (rawItems.length === 0) {
      return successResponse({ items: [], warnings: [] });
    }

    const supabase = createAdminClient();
    const productIds = Array.from(new Set(rawItems.map((i) => i.productId).filter(Boolean)));
    const variantIds = rawItems.map((i) => i.variantId).filter(Boolean) as string[];

    if (productIds.length === 0) {
      return successResponse({ items: [], warnings: [] });
    }

    // 1. Fetch products with media and base inventory
    const { data: rawProducts, error: prodErr } = await supabase
      .from("products")
      .select(`
        id,
        title,
        sku,
        base_price,
        compare_at_price,
        status,
        is_active,
        category_id,
        product_media(is_primary, media(public_url)),
        inventory(id, quantity, reserved_quantity)
      `)
      .in("id", productIds);

    if (prodErr) {
      logger.error("Failed to query products for cart rehydration", prodErr, "CartRehydrationAPI");
      throw prodErr;
    }

    // 2. Fetch variants if any
    let dbVariants: Array<{
      id: string;
      product_id: string;
      title: string;
      sku: string;
      price: number;
      is_active: boolean;
      inventory?: Array<{ id: string; quantity: number; reserved_quantity: number }>;
    }> = [];

    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select(`
          id,
          product_id,
          title,
          sku,
          price,
          is_active,
          inventory(id, quantity, reserved_quantity)
        `)
        .in("id", variantIds);

      if (variantsData) {
        dbVariants = variantsData as unknown as typeof dbVariants;
      }
    }

    const productMap = new Map<string, any>();
    (rawProducts || []).forEach((p: any) => productMap.set(p.id, p));

    const variantMap = new Map<string, any>();
    dbVariants.forEach((v: any) => variantMap.set(v.id, v));

    const rehydrated: RehydratedCartItem[] = [];
    const warnings: string[] = [];

    for (const item of rawItems) {
      const product = productMap.get(item.productId);

      // Product deleted or inactive
      if (!product || !product.is_active || product.status !== "ACTIVE") {
        warnings.push(`A previously saved product is no longer available.`);
        rehydrated.push({
          productId: item.productId,
          variantId: item.variantId || null,
          title: product?.title || "Unavailable Product",
          variantTitle: null,
          sku: product?.sku || "N/A",
          price: product?.base_price || 0,
          compareAtPrice: null,
          imageUrl: null,
          quantity: 0,
          requestedQuantity: item.quantity,
          availableStock: 0,
          isAvailable: false,
          isOutOfStock: true,
          isQuantityAdjusted: true,
          categoryId: null,
          statusMessage: "This product is no longer available.",
        });
        continue;
      }

      // Primary Image URL
      const mediaList = Array.isArray(product.product_media) ? product.product_media : [];
      const primaryMedia =
        mediaList.find((m: any) => m.is_primary)?.media?.public_url ||
        mediaList[0]?.media?.public_url ||
        null;

      // Handle Variant vs Base Product
      let finalPrice = Number(product.base_price) || 0;
      let compareAtPrice = product.compare_at_price ? Number(product.compare_at_price) : null;
      let sku = product.sku;
      let variantTitle: string | null = null;
      let availableStock = 0;
      let isVariantValid = true;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);

        if (!variant || variant.is_active === false) {
          isVariantValid = false;
          warnings.push(`Selected option for "${product.title}" is no longer available.`);
        } else {
          variantTitle = variant.title;
          sku = variant.sku || product.sku;
          finalPrice = Number(variant.price) || Number(product.base_price);

          const invList = Array.isArray(variant.inventory) ? variant.inventory : [];
          availableStock = invList.reduce(
            (acc: number, inv: any) =>
              acc + Math.max(0, (inv.quantity || 0) - (inv.reserved_quantity || 0)),
            0
          );
        }
      } else {
        // Base Product Stock
        const invList = Array.isArray(product.inventory) ? product.inventory : [];
        availableStock = invList.reduce(
          (acc: number, inv: any) =>
            acc + Math.max(0, (inv.quantity || 0) - (inv.reserved_quantity || 0)),
          0
        );
      }

      const isOutOfStock = availableStock <= 0;
      const isAvailable = isVariantValid && !isOutOfStock;

      let effectiveQuantity = item.quantity;
      let isQuantityAdjusted = false;
      let statusMessage: string | null = null;

      if (!isVariantValid) {
        effectiveQuantity = 0;
        isQuantityAdjusted = true;
        statusMessage = "Selected option is no longer available.";
      } else if (isOutOfStock) {
        effectiveQuantity = 0;
        isQuantityAdjusted = true;
        statusMessage = "Out of stock.";
        warnings.push(
          `"${product.title}${variantTitle ? ` (${variantTitle})` : ""}" is currently out of stock.`
        );
      } else if (item.quantity > availableStock) {
        effectiveQuantity = availableStock;
        isQuantityAdjusted = true;
        statusMessage = `Quantity reduced to ${availableStock} (max available stock).`;
        warnings.push(
          `Quantity for "${product.title}" was adjusted from ${item.quantity} to ${availableStock} due to current stock limits.`
        );
      }

      rehydrated.push({
        productId: product.id,
        variantId: item.variantId || null,
        title: product.title,
        variantTitle,
        sku,
        price: finalPrice,
        compareAtPrice,
        imageUrl: primaryMedia,
        quantity: isAvailable ? effectiveQuantity : 0,
        requestedQuantity: item.quantity,
        availableStock,
        isAvailable,
        isOutOfStock,
        isQuantityAdjusted,
        categoryId: product.category_id,
        statusMessage,
      });
    }

    return successResponse({
      items: rehydrated,
      warnings,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("POST /api/cart/rehydrate error", error, "CartRehydrationAPI");
    return errorResponse(error, "POST /api/cart/rehydrate");
  }
}
