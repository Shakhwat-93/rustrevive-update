import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export type AdminNotificationType =
  | "NEW_ORDER"
  | "ORDER_CANCELLED"
  | "ORDER_RETURNED"
  | "PAYMENT_RECEIVED"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "NEW_REVIEW"
  | "CUSTOMER_MESSAGE"
  | "SYSTEM_ALERT";

export interface CreateNotificationInput {
  type: AdminNotificationType;
  title: string;
  message: string;
  resourceType?: "orders" | "products" | "reviews" | "inventory" | "customers" | "system";
  resourceId?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  grandTotal?: number;
  itemCount?: number;
  metadata?: Record<string, unknown>;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface SavePushSubscriptionInput {
  endpoint: string;
  keys: PushSubscriptionKeys;
  adminId?: string | null;
  userAgent?: string | null;
}

// Configure VAPID details if keys are present
const VAPID_PUBLIC_KEY = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"] || "BElNrhuquR0FZXojpE3Ae5B6YnuYHk8aINQZbdpC7G6UoAg4wdAAIzgxoXFbscSmN0ffqh3XAZWlOSN4xs_K1qI";
const VAPID_PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"] || "jyRpLdkkxjNG1Z4qcfEhLQgo166THevGn4WDEICcuyY";
const VAPID_SUBJECT = process.env["VAPID_SUBJECT"] || "mailto:admin@rustrevive.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    logger.warn("Failed to initialize web-push VAPID details", "NotificationService", { error: err });
  }
}

export class NotificationService {
  /**
   * Helper: Resolve destination URL for notification type & resource
   */
  public static getTargetUrl(type: string, resourceType?: string | null, resourceId?: string | null): string {
    if (resourceType === "orders" && resourceId) {
      return `/admin/orders/${resourceId}`;
    }
    if (resourceType === "reviews") {
      return `/admin/reviews`;
    }
    if (resourceType === "products" || resourceType === "inventory") {
      return `/admin/inventory`;
    }
    if (resourceType === "customers") {
      return `/admin/customers`;
    }

    switch (type) {
      case "NEW_ORDER":
      case "ORDER_CANCELLED":
      case "ORDER_RETURNED":
      case "PAYMENT_RECEIVED":
        return resourceId ? `/admin/orders/${resourceId}` : `/admin/orders`;
      case "LOW_STOCK":
      case "OUT_OF_STOCK":
        return `/admin/inventory`;
      case "NEW_REVIEW":
        return `/admin/reviews`;
      case "CUSTOMER_MESSAGE":
        return `/admin/customers`;
      default:
        return `/admin/notifications`;
    }
  }

  /**
   * Compatibility wrapper for transactional order notifications
   */
  public static async sendOrderNotification(payload: {
    type: string;
    title: string;
    message: string;
    orderNumber?: string;
    orderId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string | null;
    grandTotal?: number;
    trackingNumber?: string | null;
    courierName?: string | null;
  }) {
    return this.createNotification({
      type: payload.type as AdminNotificationType,
      title: payload.title,
      message: payload.message,
      resourceType: "orders",
      resourceId: payload.orderId,
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      grandTotal: payload.grandTotal,
    });
  }

  /**
   * Server-side authoritative notification creation with duplicate prevention
   */
  public static async createNotification(input: CreateNotificationInput) {
    const supabase = createAdminClient();

    try {
      // 1. Idempotency Check: Prevent duplicate notifications within short interval (5 mins)
      if (input.resourceType && input.resourceId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("notifications")
          .select("id, created_at")
          .eq("type", input.type)
          .eq("resource_type", input.resourceType)
          .eq("resource_id", input.resourceId)
          .gte("created_at", fiveMinutesAgo)
          .limit(1);

        if (existing && existing.length > 0) {
          logger.info(
            `Duplicate notification suppressed for ${input.type} (${input.resourceType}:${input.resourceId})`,
            "NotificationService"
          );
          return { success: true, notificationId: existing[0]?.id, suppressed: true };
        }
      }

      // 2. Insert In-App Notification into Supabase
      const { data: inserted, error: insertError } = await supabase
        .from("notifications")
        .insert({
          channel: "IN_APP",
          type: input.type,
          title: input.title,
          message: input.message,
          resource_type: input.resourceType || "orders",
          resource_id: input.resourceId || input.orderId || null,
          is_read: false,
        })
        .select()
        .single();

      if (insertError || !inserted) {
        logger.error("Failed to insert notification into database", insertError, "NotificationService");
        return { success: false, error: insertError?.message };
      }

      logger.info(
        `Admin notification created: [${input.type}] ${input.title}`,
        "NotificationService",
        { id: inserted.id, type: input.type, resourceId: input.resourceId }
      );

      // 3. Dispatch Web Push Notification asynchronously in background (Non-blocking)
      const targetUrl = this.getTargetUrl(input.type, input.resourceType, input.resourceId || input.orderId);
      this.dispatchWebPushToAdmins({
        title: input.type === "NEW_ORDER" ? "🛍 New Order Received" : input.title,
        body: input.message,
        url: targetUrl,
        tag: `rr-notif-${inserted.id}`,
        type: input.type,
        resourceId: input.resourceId || input.orderId,
      }).catch((pushErr) => {
        logger.warn("Web Push dispatch encountered an error", "NotificationService", { error: pushErr });
      });

      return { success: true, notification: inserted };
    } catch (err: unknown) {
      logger.error("Unexpected error in createNotification", err, "NotificationService");
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Dispatch Web Push notifications to all active admin devices
   */
  public static async dispatchWebPushToAdmins(payload: {
    title: string;
    body: string;
    url: string;
    tag: string;
    type: string;
    resourceId?: string | null;
  }) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      logger.warn("VAPID keys not configured, skipping web push", "NotificationService");
      return { sent: 0, failed: 0 };
    }

    const supabase = createAdminClient();

    // Fetch active push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("admin_push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("is_active", true);

    if (error || !subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.tag,
      data: {
        url: payload.url,
        type: payload.type,
        resourceId: payload.resourceId,
      },
    });

    let sent = 0;
    let failed = 0;
    const staleSubscriptionIds: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, pushPayload, {
            TTL: 86400, // 24 hours
            urgency: payload.type === "NEW_ORDER" ? "high" : "normal",
          });
          sent++;
        } catch (err: any) {
          failed++;
          // Prune dead subscriptions (404 Not Found or 410 Gone)
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleSubscriptionIds.push(sub.id);
          }
        }
      })
    );

    // Clean up stale subscriptions from DB
    if (staleSubscriptionIds.length > 0) {
      await supabase
        .from("admin_push_subscriptions")
        .update({ is_active: false })
        .in("id", staleSubscriptionIds);
      logger.info(
        `Pruned ${staleSubscriptionIds.length} expired push subscriptions`,
        "NotificationService"
      );
    }

    logger.info(`Web push dispatched: ${sent} sent, ${failed} failed`, "NotificationService");
    return { sent, failed };
  }

  /**
   * Save or reactivate an Admin Push Subscription
   */
  public static async savePushSubscription(input: SavePushSubscriptionInput) {
    if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
      throw new Error("Invalid push subscription payload.");
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("admin_push_subscriptions")
      .upsert(
        {
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          admin_id: input.adminId || null,
          user_agent: input.userAgent || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      )
      .select()
      .single();

    if (error) {
      logger.error("Failed to save push subscription", error, "NotificationService");
      throw new Error(`Failed to save subscription: ${error.message}`);
    }

    logger.info("Admin Web Push subscription registered", "NotificationService", {
      id: data.id,
      endpoint: input.endpoint.slice(0, 35) + "...",
    });

    return data;
  }

  /**
   * Deactivate a Push Subscription
   */
  public static async removePushSubscription(endpoint: string) {
    const supabase = createAdminClient();
    await supabase
      .from("admin_push_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("endpoint", endpoint);
    return { success: true };
  }

  /**
   * List notifications for Admin with counts, filters, and pagination
   */
  public static async listNotifications(options: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
    search?: string;
  } = {}) {
    const supabase = createAdminClient();
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = Math.max(0, options.offset || 0);

    // 1. Fetch unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    // 2. Fetch category counts
    const { count: ordersCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .in("type", ["NEW_ORDER", "ORDER_CANCELLED", "ORDER_RETURNED", "PAYMENT_RECEIVED"]);

    const { count: inventoryCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .in("type", ["LOW_STOCK", "OUT_OF_STOCK"]);

    const { count: reviewsCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "NEW_REVIEW");

    const { count: totalCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true });

    // 3. Query list
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (options.type && options.type !== "ALL") {
      if (options.type === "ORDERS") {
        query = query.in("type", ["NEW_ORDER", "ORDER_CANCELLED", "ORDER_RETURNED", "PAYMENT_RECEIVED"]);
      } else if (options.type === "INVENTORY") {
        query = query.in("type", ["LOW_STOCK", "OUT_OF_STOCK"]);
      } else if (options.type === "REVIEWS") {
        query = query.eq("type", "NEW_REVIEW");
      } else {
        query = query.eq("type", options.type);
      }
    }

    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      query = query.or(`title.ilike.%${term}%,message.ilike.%${term}%`);
    }

    const { data: notifications, count: filteredTotal, error } = await query;

    if (error) {
      logger.error("Failed to query notifications", error, "NotificationService");
      return {
        notifications: [],
        unreadCount: unreadCount || 0,
        totalCount: totalCount || 0,
        filteredTotal: 0,
        counts: {
          all: totalCount || 0,
          orders: ordersCount || 0,
          inventory: inventoryCount || 0,
          reviews: reviewsCount || 0,
          unread: unreadCount || 0,
        },
      };
    }

    return {
      notifications: (notifications || []).map((n) => ({
        ...n,
        targetUrl: this.getTargetUrl(n.type, n.resource_type, n.resource_id),
      })),
      unreadCount: unreadCount || 0,
      totalCount: totalCount || 0,
      filteredTotal: filteredTotal || 0,
      counts: {
        all: totalCount || 0,
        orders: ordersCount || 0,
        inventory: inventoryCount || 0,
        reviews: reviewsCount || 0,
        unread: unreadCount || 0,
      },
    };
  }

  /**
   * Mark single notification as read
   */
  public static async markAsRead(notificationId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      logger.error(`Failed to mark notification ${notificationId} as read`, error, "NotificationService");
      throw new Error(`Failed to mark read: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead() {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      logger.error("Failed to mark all notifications as read", error, "NotificationService");
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }

    logger.info("All notifications marked as read", "NotificationService");
    return { success: true };
  }

  /**
   * Permanently delete a notification
   */
  public static async deleteNotification(notificationId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      logger.error(`Failed to delete notification ${notificationId}`, error, "NotificationService");
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { success: true, deletedId: notificationId };
  }
}
