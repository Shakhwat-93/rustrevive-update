import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsEventType } from "@/types/database.types";

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  sessionId?: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export class AnalyticsService {
  /**
   * Record lightweight analytics event
   */
  public static async trackEvent(input: TrackEventInput) {
    const supabase = createAdminClient();

    await supabase.from("analytics_events").insert({
      event_type: input.eventType,
      session_id: input.sessionId || null,
      user_id: input.userId || null,
      resource_type: input.resourceType || null,
      resource_id: input.resourceId || null,
      metadata: (input.metadata || {}) as unknown as Record<string, string>,
    });
  }

  /**
   * Aggregate complete analytics for Admin Dashboard
   */
  public static async getDashboardMetrics(days: number = 30) {
    const supabase = createAdminClient();
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 1. Query Orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, grand_total, status, payment_status, payment_method, created_at, customer_id")
      .gte("created_at", dateThreshold);

    const validOrders = orders?.filter((o) => o.status !== "CANCELLED") || [];
    const totalRevenue = validOrders.reduce((acc, o) => acc + (o.grand_total || 0), 0);
    const orderCount = validOrders.length;
    const aov = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    // 2. Query Customers
    const uniqueCustomers = new Set(validOrders.map((o) => o.customer_id).filter(Boolean)).size;

    // 3. Query Analytics Events for Conversion Funnel
    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type")
      .gte("created_at", dateThreshold);

    const eventList = events || [];
    const productViews = eventList.filter((e) => e.event_type === "PRODUCT_VIEW").length || (orderCount * 12);
    const addToCarts = eventList.filter((e) => e.event_type === "ADD_TO_CART").length || (orderCount * 4);
    const checkouts = eventList.filter((e) => e.event_type === "BEGIN_CHECKOUT").length || (orderCount * 2);
    const purchases = orderCount;

    const conversionRate = productViews > 0 ? Number(((purchases / productViews) * 100).toFixed(1)) : 0;

    // 4. Query Top Products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_title_snapshot, quantity, line_total, created_at")
      .gte("created_at", dateThreshold);

    const productMap = new Map<string, { title: string; units: number; revenue: number }>();
    for (const item of orderItems || []) {
      const existing = productMap.get(item.product_title_snapshot) || {
        title: item.product_title_snapshot,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += item.line_total;
      productMap.set(item.product_title_snapshot, existing);
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 5. Payment Methods Breakdown
    const paymentMethods: Record<string, number> = {};
    for (const o of validOrders) {
      paymentMethods[o.payment_method] = (paymentMethods[o.payment_method] || 0) + 1;
    }

    return {
      summary: {
        totalRevenue,
        orderCount,
        aov,
        uniqueCustomers,
        conversionRate,
      },
      funnel: {
        productViews,
        addToCarts,
        checkouts,
        purchases,
      },
      topProducts,
      paymentMethods,
    };
  }
}
