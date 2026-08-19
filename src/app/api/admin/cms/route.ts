import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { CMSService } from "@/lib/cms/cms.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { getCurrentAdminUser } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();
    requirePermission(user, "content:view");

    const config = await CMSService.getPublishedHomepageConfig();
    return successResponse(config);
  } catch (error) {
    return errorResponse(error, "GET /api/admin/cms");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();
    const body = await request.json();
    const { action, config } = body;

    if (action === "publish") {
      requirePermission(user, "content:publish");
      const published = await CMSService.publishHomepage(config);
      revalidatePath("/");
      return successResponse(published, 200);
    }

    requirePermission(user, "content:edit");
    const updatedDraft = await CMSService.saveDraft(config);
    return successResponse(updatedDraft, 200);
  } catch (error) {
    return errorResponse(error, "POST /api/admin/cms");
  }
}
