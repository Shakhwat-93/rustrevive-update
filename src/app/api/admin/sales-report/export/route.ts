import { NextRequest, NextResponse } from "next/server";
import { SalesReportService } from "@/lib/services/sales-report.service";
import { errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sales-report/export
 * Downloads CSV or XML spreadsheet based on current filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const format = (searchParams.get("format") || "csv") as "csv" | "json";
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

    const exportResult = await SalesReportService.exportSalesReport(
      {
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
      },
      format
    );

    if (format === "csv" && typeof exportResult === "object" && "content" in exportResult) {
      return new NextResponse(exportResult.content, {
        status: 200,
        headers: {
          "Content-Type": exportResult.contentType,
          "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        },
      });
    }

    return NextResponse.json(exportResult, { status: 200 });
  } catch (error: unknown) {
    logger.error("GET /api/admin/sales-report/export error", error, "AdminSalesReportExportAPI");
    return errorResponse(error, "GET /api/admin/sales-report/export");
  }
}
