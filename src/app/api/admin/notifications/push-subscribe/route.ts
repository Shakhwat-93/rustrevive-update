import { NextRequest } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userAgent, adminId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      throw new ValidationError("Valid PushSubscription with endpoint, p256dh, and auth is required.", {
        field: "subscription",
      });
    }

    const saved = await NotificationService.savePushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent || req.headers.get("user-agent"),
      adminId,
    });

    return successResponse({
      success: true,
      message: "Push subscription active.",
      subscriptionId: saved.id,
    });
  } catch (err: unknown) {
    return errorResponse(err, "AdminPushSubscribePOST");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      throw new ValidationError("Endpoint is required to remove push subscription.", { field: "endpoint" });
    }

    await NotificationService.removePushSubscription(endpoint);
    return successResponse({ success: true, message: "Push subscription deactivated." });
  } catch (err: unknown) {
    return errorResponse(err, "AdminPushSubscribeDELETE");
  }
}
