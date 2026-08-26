import { NextRequest } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const data = await NotificationService.listNotifications({
      limit,
      offset,
      type,
      unreadOnly,
      search,
    });

    return successResponse(data);
  } catch (err: unknown) {
    return errorResponse(err, "AdminNotificationsGET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "markAllAsRead") {
      await NotificationService.markAllAsRead();
      return successResponse({ success: true, message: "All notifications marked as read." });
    }

    const { notificationId } = body;
    if (!notificationId) {
      throw new ValidationError("notificationId is required for marking read.", { field: "notificationId" });
    }

    const updated = await NotificationService.markAsRead(notificationId);
    return successResponse({ success: true, notification: updated });
  } catch (err: unknown) {
    return errorResponse(err, "AdminNotificationsPATCH");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Notification ID query parameter 'id' is required for deletion.", { field: "id" });
    }

    const result = await NotificationService.deleteNotification(id);
    return successResponse(result);
  } catch (err: unknown) {
    return errorResponse(err, "AdminNotificationsDELETE");
  }
}
