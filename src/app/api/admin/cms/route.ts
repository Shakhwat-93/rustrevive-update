import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { CMSService } from "@/lib/cms/cms.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { getCurrentAdminUser } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();
    requirePermission(user, "content:view");

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "draft";

    const config =
      mode === "published"
        ? await CMSService.getPublishedHomepageConfig()
        : await CMSService.getDraftHomepageConfig();

    return successResponse(config);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();
    const body = await request.json();
    const { action, config } = body;

    if (action === "publish") {
      requirePermission(user, "content:publish");
      if (config) {
        await CMSService.saveDraft(config);
      }
      const published = await CMSService.publishDraft();
      // On-demand Next.js ISR cache revalidation
      revalidatePath("/");
      return successResponse(published, 200);
    }

    requirePermission(user, "content:edit");
    const updatedDraft = await CMSService.saveDraft(config);
    return successResponse(updatedDraft, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
