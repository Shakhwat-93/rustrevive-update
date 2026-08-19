import { NextRequest } from "next/server";
import { ProductService, type CreateProductInput } from "@/lib/services/product.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import type { ProductStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/products - List products with filters & pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status") || "ALL";
    const status: ProductStatus | "ALL" =
      rawStatus === "ACTIVE" || rawStatus === "DRAFT" || rawStatus === "ARCHIVED"
        ? rawStatus
        : "ALL";

    const category_id = searchParams.get("category_id") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await ProductService.getProducts({
      status,
      category_id,
      search,
      limit,
      offset,
    });

    return successResponse(result);
  } catch (error: unknown) {
    logger.error("GET /api/admin/products error", error, "AdminProductsAPI");
    return errorResponse(error, "GET /api/admin/products");
  }
}

/**
 * POST /api/admin/products - Create product atomically
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProductInput = await request.json();
    const product = await ProductService.createProduct(body);
    return successResponse(product, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/products error", error, "AdminProductsAPI");
    return errorResponse(error, "POST /api/admin/products");
  }
}
