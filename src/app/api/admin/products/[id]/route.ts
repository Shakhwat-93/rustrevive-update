import { NextRequest } from "next/server";
import { ProductService, type CreateProductInput } from "@/lib/services/product.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/products/[id] - Fetch single product
 */
export async function GET(_request: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const product = await ProductService.getProductById(id);
    return successResponse(product);
  } catch (error: unknown) {
    logger.error("GET /api/admin/products/[id] error", error, "AdminProductDetailAPI");
    return errorResponse(error, "GET /api/admin/products/[id]");
  }
}

/**
 * PUT /api/admin/products/[id] - Update product details & media
 */
export async function PUT(request: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const body: Partial<CreateProductInput> = await request.json();
    const updatedProduct = await ProductService.updateProduct(id, body);

    // If media_ids are provided, update product_media associations
    if (body.media_ids && Array.isArray(body.media_ids)) {
      const supabase = createAdminClient();
      await supabase.from("product_media").delete().eq("product_id", id);
      if (body.media_ids.length > 0) {
        const mediaRows = body.media_ids.map((mediaId, idx) => ({
          product_id: id,
          media_id: mediaId,
          sort_order: idx,
          is_primary: idx === 0,
        }));
        await supabase.from("product_media").insert(mediaRows);
      }
    }

    return successResponse(updatedProduct);
  } catch (error: unknown) {
    logger.error("PUT /api/admin/products/[id] error", error, "AdminProductDetailAPI");
    return errorResponse(error, "PUT /api/admin/products/[id]");
  }
}

/**
 * DELETE /api/admin/products/[id] - Archive product
 */
export async function DELETE(_request: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const result = await ProductService.bulkUpdateStatus([id], "ARCHIVED");
    return successResponse(result);
  } catch (error: unknown) {
    logger.error("DELETE /api/admin/products/[id] error", error, "AdminProductDetailAPI");
    return errorResponse(error, "DELETE /api/admin/products/[id]");
  }
}
