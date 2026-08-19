import { NextRequest } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const notifications = await NotificationService.listNotifications({ limit, unreadOnly });
    return successResponse(notifications);
  } catch (err: unknown) {
    return errorResponse(err, "AdminNotificationsGET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      throw new ValidationError("notificationId is required", { field: "notificationId" });
    }

    await NotificationService.markAsRead(notificationId);
    return successResponse({ marked: true });
  } catch (err: unknown) {
    return errorResponse(err, "AdminNotificationsPATCH");
  }
}
