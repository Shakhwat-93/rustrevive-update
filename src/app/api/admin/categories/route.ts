import { NextRequest } from "next/server";
import { CategoryService } from "@/lib/services/category.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/categories - List all categories for admin product creation
 */
export async function GET() {
  try {
    const categories = await CategoryService.listAllCategories();
    return successResponse(categories);
  } catch (error: unknown) {
    logger.error("GET /api/admin/categories error", error, "AdminCategoriesAPI");
    return errorResponse(error, "GET /api/admin/categories");
  }
}

/**
 * POST /api/admin/categories - Create new category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await CategoryService.createCategory(body);
    return successResponse(category, 201);
  } catch (error: unknown) {
    logger.error("POST /api/admin/categories error", error, "AdminCategoriesAPI");
    return errorResponse(error, "POST /api/admin/categories");
  }
}
