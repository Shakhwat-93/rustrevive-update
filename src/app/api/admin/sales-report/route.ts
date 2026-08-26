import { NextRequest } from "next/server";
import { SalesReportService } from "@/lib/services/sales-report.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sales-report
 * Multi-dimensional sales report analytics API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const preset = searchParams.get("preset") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const variantId = searchParams.get("variantId") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const status = searchParams.get("status") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const sortBy = (searchParams.get("sortBy") as any) || "date";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const report = await SalesReportService.getSalesReport({
      preset,
      startDate,
      endDate,
      categoryId,
      productId,
      variantId,
      customerId,
      status,
      paymentMethod,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return successResponse(report, 200);
  } catch (error: unknown) {
    logger.error("GET /api/admin/sales-report error", error, "AdminSalesReportAPI");
    return errorResponse(error, "GET /api/admin/sales-report");
  }
}
