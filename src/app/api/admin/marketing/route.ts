import { NextRequest } from "next/server";
import { MarketingService } from "@/lib/services/marketing.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const campaigns = await MarketingService.listCampaigns();
    const segments = await MarketingService.listCustomerSegments();
    return successResponse({ campaigns, segments });
  } catch (err: unknown) {
    return errorResponse(err, "AdminMarketingGET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, status, target_type, target_id, starts_at, ends_at, budget } = body;

    if (!name || !type) {
      throw new ValidationError("name and type are required.", { fields: ["name", "type"] });
    }

    const campaign = await MarketingService.createCampaign({
      name,
      type,
      status,
      target_type,
      target_id,
      starts_at,
      ends_at,
      budget: Number(budget) || 0,
    });

    return successResponse(campaign, 201);
  } catch (err: unknown) {
    return errorResponse(err, "AdminMarketingPOST");
  }
}
