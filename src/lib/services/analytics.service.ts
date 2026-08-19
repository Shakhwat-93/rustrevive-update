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
   * Record lightweight analytics event in Supabase PostgreSQL
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
   * Aggregate 100% database-driven analytics for Admin Dashboard & Commercial Intelligence
   */
  public static async getDashboardMetrics(days: number = 30) {
    const supabase = createAdminClient();
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 1. Query Orders in time window
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, grand_total, status, payment_status, payment_method, created_at, customer_id, customer_name, customer_email, customer_phone")
      .gte("created_at", dateThreshold)
      .order("created_at", { ascending: false });

    const allOrders = orders || [];
    const validOrders = allOrders.filter((o) => o.status !== "CANCELLED");
    const totalRevenue = validOrders.reduce((acc, o) => acc + (o.grand_total || 0), 0);
    const orderCount = validOrders.length;
    const aov = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    // 2. Query Total Registered Patrons & Active Customers
    const { count: totalPatrons } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const activeCustomerIds = new Set(validOrders.map((o) => o.customer_id).filter(Boolean));
    const uniqueCustomers = activeCustomerIds.size || totalPatrons || 0;

    // 3. Query Real Analytics Events for Conversion Funnel (Zero Synthetic Multipliers)
    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type")
      .gte("created_at", dateThreshold);

    const eventList = events || [];
    const productViews = eventList.filter((e) => e.event_type === "PRODUCT_VIEW").length;
    const addToCarts = eventList.filter((e) => e.event_type === "ADD_TO_CART").length;
    const checkouts = eventList.filter((e) => e.event_type === "BEGIN_CHECKOUT").length;
    const purchases = orderCount;

    const conversionRate = productViews > 0 ? Number(((purchases / productViews) * 100).toFixed(1)) : 0;

    // 4. Query Top Products Sold in time window
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
      const method = o.payment_method || "COD";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    }

    // 6. Real Low Stock Items (quantity <= 3 or quantity <= low_stock_threshold)
    const { data: lowStockData } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity,
        low_stock_threshold,
        sku,
        product_variants (
          title,
          sku
        ),
        products (
          title,
          sku
        )
      `)
      .lte("quantity", 3)
      .order("quantity", { ascending: true })
      .limit(6);

    interface LowStockDbRow {
      id: string;
      quantity: number;
      sku: string;
      product_variants?: { title?: string; sku?: string } | null;
      products?: { title?: string; sku?: string } | null;
    }

    const lowStockItems = ((lowStockData as unknown as LowStockDbRow[]) || []).map((item) => ({
      id: item.id,
      sku: item.sku || item.product_variants?.sku || item.products?.sku || "N/A",
      name: item.product_variants?.title || item.products?.title || "Item",
      remaining: item.quantity,
      status: item.quantity === 0 ? "out_of_stock" : "low_stock",
    }));

    // 7. Recent 5 Orders
    const recentOrders = allOrders.slice(0, 5).map((o) => {
      return {
        id: o.order_number,
        rawId: o.id,
        customer: o.customer_name || o.customer_email || "Customer",
        date: new Date(o.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        payment: (o.payment_status || "PENDING").toLowerCase(),
        status: (o.status || "PENDING").toLowerCase(),
        total: `৳${(o.grand_total || 0).toLocaleString("en-US")}`,
      };
    });

    return {
      summary: {
        totalRevenue,
        orderCount,
        aov,
        uniqueCustomers,
        totalPatrons: totalPatrons || 0,
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
      lowStockItems,
      recentOrders,
    };
  }
}
