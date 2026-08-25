import { NextRequest } from "next/server";
import { DiscountService } from "@/lib/services/discount.service";
import { successResponse, errorResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const discount = await DiscountService.getDiscountById(id);
    return successResponse(discount);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountDetailGET");
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { name, is_active, rules } = body;

    const updated = await DiscountService.updateDiscount(id, {
      name,
      is_active,
      rules,
    });

    return successResponse(updated);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountDetailPUT");
  }
}

export async function DELETE(_req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const updated = await DiscountService.toggleDiscountStatus(id, false);
    return successResponse(updated);
  } catch (err: unknown) {
    return errorResponse(err, "AdminDiscountDetailDELETE");
  }
}
