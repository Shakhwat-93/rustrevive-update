import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export interface OrderNotificationPayload {
  type: string;
  title: string;
  message: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  grandTotal: number;
  trackingNumber?: string | null;
  courierName?: string | null;
}

export class NotificationService {
  /**
   * Broadcast / Log Notification to In-App database and dispatch across configured channels
   */
  public static async sendOrderNotification(payload: OrderNotificationPayload) {
    const supabase = createAdminClient();

    try {
      // 1. Record In-App Notification in Supabase for Admin & Operations
      await supabase.from("notifications").insert({
        channel: "IN_APP",
        type: payload.type,
        title: payload.title,
        message: payload.message,
        resource_type: "orders",
        resource_id: payload.orderId,
        is_read: false,
      });

      // 2. Mock / Transactional Dispatchers (Email, SMS, WhatsApp)
      // When live SMS/WhatsApp credentials are added, these fire directly
      logger.info(
        `[NOTIFICATION DISPATCHED] ${payload.type} -> Customer: ${payload.customerName} (${payload.customerPhone})`,
        "NotificationService",
        {
          orderNumber: payload.orderNumber,
          title: payload.title,
          trackingNumber: payload.trackingNumber,
        }
      );

      return { success: true };
    } catch (err) {
      logger.error("Failed to persist notification", err, "NotificationService");
      return { success: false };
    }
  }

  /**
   * Fetch recent notifications for Admin
   */
  public static async listNotifications(options: { limit?: number; unreadOnly?: boolean } = {}) {
    const supabase = createAdminClient();
    const limit = options.limit || 20;

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to fetch notifications", error, "NotificationService");
      return [];
    }

    return data || [];
  }

  /**
   * Mark notification as read
   */
  public static async markAsRead(notificationId: string) {
    const supabase = createAdminClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    return { success: true };
  }
}
