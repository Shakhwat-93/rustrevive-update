import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import type { OrderStatus, PaymentStatus } from "@/types/database.types";

export interface SalesReportFilterParams {
  preset?: string;
  startDate?: string;
  endDate?: string;
  productId?: string;
  categoryId?: string;
  variantId?: string;
  customerId?: string;
  status?: OrderStatus | "ALL" | string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "date" | "revenue" | "quantity" | "orders" | "customer" | "product";
  sortOrder?: "asc" | "desc";
}

export interface SalesSummaryKPI {
  grossRevenue: number;
  netSales: number;
  totalOrders: number;
  validOrders: number;
  itemsSold: number;
  averageOrderValue: number;
  totalDiscount: number;
  totalShipping: number;
  cancelledOrdersCount: number;
  cancelledOrdersValue: number;
  returnedOrdersCount: number;
  returnedOrdersValue: number;
}

export interface TimeSeriesDataPoint {
  label: string;
  timestamp: string;
  revenue: number;
  orders: number;
  quantity: number;
}

export interface TopProductItem {
  productId: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  categoryName: string;
  unitsSold: number;
  ordersCount: number;
  grossRevenue: number;
  discount: number;
  netRevenue: number;
  avgSellingPrice: number;
}

export interface TopVariantItem {
  productId: string;
  variantId: string | null;
  productTitle: string;
  variantTitle: string | null;
  sku: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySalesItem {
  categoryId: string;
  categoryName: string;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  percentageOfTotal: number;
}

export interface OrderStatusSummaryItem {
  status: OrderStatus;
  label: string;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  percentage: number;
}

export interface PaymentMethodSummaryItem {
  method: string;
  label: string;
  ordersCount: number;
  revenue: number;
  percentage: number;
}

export interface CustomerSalesItem {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  isRegistered: boolean;
  ordersCount: number;
  itemsPurchased: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string;
}

export interface DetailedSaleTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  productId: string | null;
  productTitle: string;
  variantId: string | null;
  variantTitle: string | null;
  sku: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  netSales: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
}

export class SalesReportService {
  /**
   * Resolve ISO date boundaries from preset or custom parameters
   */
  public static resolveDateRange(params: { preset?: string; startDate?: string; endDate?: string }): {
    start: Date;
    end: Date;
    interval: "hour" | "day" | "week" | "month";
  } {
    const now = new Date();
    const preset = params.preset || "30d";

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const interval = diffDays <= 2 ? "hour" : diffDays <= 60 ? "day" : "month";
      return { start, end, interval };
    }

    switch (preset) {
      case "today": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "hour" };
      }
      case "yesterday": {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "hour" };
      }
      case "this_week": {
        const start = new Date(now);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
      case "last_week": {
        const start = new Date(now);
        const day = start.getDay();
        const diff = start.getDate() - day - 6;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
      case "7d": {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
      case "this_month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
      case "last_month": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
      case "this_year": {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "month" };
      }
      case "30d":
      default: {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end, interval: "day" };
      }
    }
  }

  /**
   * Main Comprehensive Sales Report Query Engine
   */
  public static async getSalesReport(params: SalesReportFilterParams = {}) {
    const supabase = createAdminClient();
    const { start, end, interval } = this.resolveDateRange(params);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    // 1. Fetch Categories for lookup map
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name, slug");
    const categoryMap = new Map<string, string>();
    (categoriesData || []).forEach((c) => categoryMap.set(c.id, c.name));

    // 2. Fetch Products with media and categories
    const { data: productsData } = await supabase
      .from("products")
      .select(`
        id,
        title,
        sku,
        category_id,
        product_media (
          is_primary,
          media (public_url)
        )
      `);

    const productMap = new Map<string, { title: string; sku: string; categoryId: string | null; imageUrl: string | null }>();
    (productsData || []).forEach((p: any) => {
      const mediaList = Array.isArray(p.product_media) ? p.product_media : [];
      const primaryMedia =
        mediaList.find((m: any) => m.is_primary)?.media?.public_url ||
        mediaList[0]?.media?.public_url ||
        null;

      productMap.set(p.id, {
        title: p.title,
        sku: p.sku,
        categoryId: p.category_id,
        imageUrl: primaryMedia,
      });
    });

    // 3. Fetch Orders in Window with Items
    let ordersQuery = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_id,
        status,
        payment_status,
        payment_method,
        subtotal,
        discount_total,
        shipping_total,
        grand_total,
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        order_items (
          id,
          order_id,
          product_id,
          variant_id,
          product_title_snapshot,
          variant_title_snapshot,
          sku_snapshot,
          image_url_snapshot,
          unit_price,
          quantity,
          line_total
        )
      `)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false });

    // Optional Status Filter
    if (params.status && params.status !== "ALL") {
      ordersQuery = ordersQuery.eq("status", params.status as OrderStatus);
    }

    // Optional Payment Method Filter
    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      ordersQuery = ordersQuery.eq("payment_method", params.paymentMethod);
    }

    // Optional Customer Filter
    if (params.customerId) {
      ordersQuery = ordersQuery.eq("customer_id", params.customerId);
    }

    const { data: rawOrders, error: ordersErr } = await ordersQuery;
    if (ordersErr) {
      logger.error("Failed to query orders for sales report", ordersErr, "SalesReportService");
      throw ordersErr;
    }

    const allOrders = rawOrders || [];

    // Filter by Product / Category / Variant / Search in-memory if specified
    const filteredOrders = allOrders.filter((order) => {
      const items = Array.isArray(order.order_items) ? order.order_items : [];

      if (params.productId) {
        if (!items.some((i) => i.product_id === params.productId)) return false;
      }

      if (params.variantId) {
        if (!items.some((i) => i.variant_id === params.variantId)) return false;
      }

      if (params.categoryId) {
        const hasCategory = items.some((i) => {
          if (!i.product_id) return false;
          const pInfo = productMap.get(i.product_id);
          return pInfo?.categoryId === params.categoryId;
        });
        if (!hasCategory) return false;
      }

      if (params.search && params.search.trim()) {
        const s = params.search.trim().toLowerCase();
        const matchOrder =
          order.order_number.toLowerCase().includes(s) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(s)) ||
          (order.customer_phone && order.customer_phone.toLowerCase().includes(s)) ||
          (order.customer_email && order.customer_email.toLowerCase().includes(s));

        const matchItem = items.some(
          (i) =>
            i.product_title_snapshot.toLowerCase().includes(s) ||
            (i.variant_title_snapshot && i.variant_title_snapshot.toLowerCase().includes(s)) ||
            (i.sku_snapshot && i.sku_snapshot.toLowerCase().includes(s))
        );

        if (!matchOrder && !matchItem) return false;
      }

      return true;
    });

    // 4. Compute High-Level KPI Summaries
    let grossRevenue = 0;
    let netSales = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    let itemsSold = 0;
    let validOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let cancelledOrdersValue = 0;
    let returnedOrdersCount = 0;
    let returnedOrdersValue = 0;

    for (const o of filteredOrders) {
      const items = Array.isArray(o.order_items) ? o.order_items : [];
      const orderItemsTotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
      const orderQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (o.status === "CANCELLED") {
        cancelledOrdersCount += 1;
        cancelledOrdersValue += Number(o.grand_total || 0);
        continue;
      }

      if (o.status === "RETURNED" || o.status === "REFUNDED") {
        returnedOrdersCount += 1;
        returnedOrdersValue += Number(o.grand_total || 0);
        continue;
      }

      // Active / Realized Order
      validOrdersCount += 1;
      grossRevenue += orderItemsTotal || Number(o.subtotal || 0);
      totalDiscount += Number(o.discount_total || 0);
      totalShipping += Number(o.shipping_total || 0);
      netSales += Number(o.grand_total || 0);
      itemsSold += orderQty;
    }

    const averageOrderValue = validOrdersCount > 0 ? Math.round(netSales / validOrdersCount) : 0;

    const summaryKPI: SalesSummaryKPI = {
      grossRevenue,
      netSales,
      totalOrders: filteredOrders.length,
      validOrders: validOrdersCount,
      itemsSold,
      averageOrderValue,
      totalDiscount,
      totalShipping,
      cancelledOrdersCount,
      cancelledOrdersValue,
      returnedOrdersCount,
      returnedOrdersValue,
    };

    // 5. Generate Time-Series Sales Overview
    const timeSeriesMap = new Map<string, { label: string; timestamp: string; revenue: number; orders: number; quantity: number }>();

    // Pre-populate time slots
    if (interval === "hour") {
      for (let h = 0; h < 24; h++) {
        const key = `${h.toString().padStart(2, "0")}:00`;
        timeSeriesMap.set(key, { label: key, timestamp: key, revenue: 0, orders: 0, quantity: 0 });
      }
    } else if (interval === "day") {
      const curr = new Date(start);
      while (curr <= end) {
        const key = curr.toISOString().split("T")[0]!;
        const label = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        timeSeriesMap.set(key, { label, timestamp: key, revenue: 0, orders: 0, quantity: 0 });
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      // Month
      const curr = new Date(start);
      while (curr <= end) {
        const key = `${curr.getFullYear()}-${(curr.getMonth() + 1).toString().padStart(2, "0")}`;
        const label = curr.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        timeSeriesMap.set(key, { label, timestamp: key, revenue: 0, orders: 0, quantity: 0 });
        curr.setMonth(curr.getMonth() + 1);
      }
    }

    for (const o of filteredOrders) {
      if (o.status === "CANCELLED" || o.status === "RETURNED" || o.status === "REFUNDED") continue;

      const d = new Date(o.created_at);
      let key = "";
      if (interval === "hour") {
        key = `${d.getHours().toString().padStart(2, "0")}:00`;
      } else if (interval === "day") {
        key = d.toISOString().split("T")[0]!;
      } else {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      }

      const point = timeSeriesMap.get(key);
      if (point) {
        const items = Array.isArray(o.order_items) ? o.order_items : [];
        const qty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
        point.revenue += Number(o.grand_total || 0);
        point.orders += 1;
        point.quantity += qty;
      }
    }

    const timeSeriesData: TimeSeriesDataPoint[] = Array.from(timeSeriesMap.values());

    // 6. Top Selling Products & Product Revenue Aggregations
    const productStatsMap = new Map<string, {
      productId: string;
      title: string;
      sku: string;
      imageUrl: string | null;
      categoryName: string;
      unitsSold: number;
      ordersSet: Set<string>;
      grossRevenue: number;
      discount: number;
    }>();

    const variantStatsMap = new Map<string, {
      productId: string;
      variantId: string | null;
      productTitle: string;
      variantTitle: string | null;
      sku: string;
      quantitySold: number;
      revenue: number;
    }>();

    const categoryStatsMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      ordersSet: Set<string>;
      unitsSold: number;
      revenue: number;
    }>();

    const customerStatsMap = new Map<string, {
      customerId: string | null;
      customerName: string;
      customerPhone: string;
      customerEmail: string | null;
      isRegistered: boolean;
      ordersCount: number;
      itemsPurchased: number;
      totalSpent: number;
      lastOrderAt: string;
    }>();

    const orderStatusStatsMap = new Map<OrderStatus, { status: OrderStatus; ordersCount: number; unitsSold: number; revenue: number }>();
    const paymentMethodStatsMap = new Map<string, { method: string; ordersCount: number; revenue: number }>();

    // Detailed Flat Sales Transactions List
    const detailedTransactions: DetailedSaleTransaction[] = [];

    for (const o of filteredOrders) {
      const items = Array.isArray(o.order_items) ? o.order_items : [];
      const isCancelledOrRefunded = o.status === "CANCELLED" || o.status === "RETURNED" || o.status === "REFUNDED";

      // Order Status breakdown
      const st = orderStatusStatsMap.get(o.status) || { status: o.status, ordersCount: 0, unitsSold: 0, revenue: 0 };
      st.ordersCount += 1;
      st.revenue += Number(o.grand_total || 0);
      st.unitsSold += items.reduce((s, i) => s + (i.quantity || 0), 0);
      orderStatusStatsMap.set(o.status, st);

      // Payment method breakdown
      const pmKey = o.payment_method || "CASH_ON_DELIVERY";
      const pm = paymentMethodStatsMap.get(pmKey) || { method: pmKey, ordersCount: 0, revenue: 0 };
      pm.ordersCount += 1;
      if (!isCancelledOrRefunded) {
        pm.revenue += Number(o.grand_total || 0);
      }
      paymentMethodStatsMap.set(pmKey, pm);

      // Customer stats
      const customerKey = o.customer_phone || o.customer_email || o.customer_name || o.id;
      const cStat = customerStatsMap.get(customerKey) || {
        customerId: o.customer_id,
        customerName: o.customer_name || "Guest Customer",
        customerPhone: o.customer_phone || "N/A",
        customerEmail: o.customer_email || null,
        isRegistered: Boolean(o.customer_id),
        ordersCount: 0,
        itemsPurchased: 0,
        totalSpent: 0,
        lastOrderAt: o.created_at,
      };
      cStat.ordersCount += 1;
      if (!isCancelledOrRefunded) {
        cStat.totalSpent += Number(o.grand_total || 0);
        cStat.itemsPurchased += items.reduce((s, i) => s + (i.quantity || 0), 0);
      }
      if (new Date(o.created_at) > new Date(cStat.lastOrderAt)) {
        cStat.lastOrderAt = o.created_at;
      }
      customerStatsMap.set(customerKey, cStat);

      // Item Level Aggregations
      for (const item of items) {
        const pInfo = item.product_id ? productMap.get(item.product_id) : null;
        const categoryName = pInfo?.categoryId ? (categoryMap.get(pInfo.categoryId) || "Uncategorized") : "Uncategorized";
        const categoryId = pInfo?.categoryId || "uncategorized";
        const imageUrl = item.image_url_snapshot || pInfo?.imageUrl || null;

        // Populate detailed flat transaction
        const itemLineTotal = Number(item.line_total || 0);
        const orderDiscount = Number(o.discount_total || 0);
        const itemDiscountShare = o.subtotal > 0 ? (itemLineTotal / o.subtotal) * orderDiscount : 0;
        const itemNetSales = Math.max(0, itemLineTotal - itemDiscountShare);

        detailedTransactions.push({
          id: item.id,
          orderId: o.id,
          orderNumber: o.order_number,
          orderDate: o.created_at,
          customerId: o.customer_id,
          customerName: o.customer_name || "Guest",
          customerPhone: o.customer_phone,
          customerEmail: o.customer_email,
          productId: item.product_id,
          productTitle: item.product_title_snapshot,
          variantId: item.variant_id,
          variantTitle: item.variant_title_snapshot,
          sku: item.sku_snapshot || pInfo?.sku || "N/A",
          categoryName,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          discountAmount: Math.round(itemDiscountShare),
          subtotal: itemLineTotal,
          netSales: Math.round(itemNetSales),
          orderStatus: o.status,
          paymentStatus: o.payment_status,
          paymentMethod: o.payment_method || "COD",
        });

        if (isCancelledOrRefunded) continue;

        // Product stats
        const prodKey = item.product_id || item.product_title_snapshot;
        const pStat = productStatsMap.get(prodKey) || {
          productId: item.product_id || prodKey,
          title: item.product_title_snapshot,
          sku: item.sku_snapshot || pInfo?.sku || "N/A",
          imageUrl,
          categoryName,
          unitsSold: 0,
          ordersSet: new Set<string>(),
          grossRevenue: 0,
          discount: 0,
        };
        pStat.unitsSold += item.quantity;
        pStat.ordersSet.add(o.id);
        pStat.grossRevenue += itemLineTotal;
        pStat.discount += itemDiscountShare;
        productStatsMap.set(prodKey, pStat);

        // Variant stats
        const varKey = `${item.product_id || item.product_title_snapshot}__${item.variant_id || "default"}`;
        const vStat = variantStatsMap.get(varKey) || {
          productId: item.product_id || "",
          variantId: item.variant_id,
          productTitle: item.product_title_snapshot,
          variantTitle: item.variant_title_snapshot,
          sku: item.sku_snapshot || pInfo?.sku || "N/A",
          quantitySold: 0,
          revenue: 0,
        };
        vStat.quantitySold += item.quantity;
        vStat.revenue += itemLineTotal;
        variantStatsMap.set(varKey, vStat);

        // Category stats
        const catStat = categoryStatsMap.get(categoryId) || {
          categoryId,
          categoryName,
          ordersSet: new Set<string>(),
          unitsSold: 0,
          revenue: 0,
        };
        catStat.unitsSold += item.quantity;
        catStat.ordersSet.add(o.id);
        catStat.revenue += itemLineTotal;
        categoryStatsMap.set(categoryId, catStat);
      }
    }

    // Format Top Products list
    const topProducts: TopProductItem[] = Array.from(productStatsMap.values()).map((p) => {
      const netRevenue = Math.max(0, p.grossRevenue - p.discount);
      return {
        productId: p.productId,
        title: p.title,
        sku: p.sku,
        imageUrl: p.imageUrl,
        categoryName: p.categoryName,
        unitsSold: p.unitsSold,
        ordersCount: p.ordersSet.size,
        grossRevenue: Math.round(p.grossRevenue),
        discount: Math.round(p.discount),
        netRevenue: Math.round(netRevenue),
        avgSellingPrice: p.unitsSold > 0 ? Math.round(netRevenue / p.unitsSold) : 0,
      };
    });

    // Format Top Variants by Quantity
    const topVariants: TopVariantItem[] = Array.from(variantStatsMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 15);

    // Format Category Sales Performance
    const categoryTotalRevenue = Array.from(categoryStatsMap.values()).reduce((sum, c) => sum + c.revenue, 0);
    const categoryReport: CategorySalesItem[] = Array.from(categoryStatsMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        ordersCount: c.ordersSet.size,
        unitsSold: c.unitsSold,
        revenue: Math.round(c.revenue),
        percentageOfTotal: categoryTotalRevenue > 0 ? Number(((c.revenue / categoryTotalRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Format Order Status Report
    const orderStatusTotal = filteredOrders.length;
    const orderStatusReport: OrderStatusSummaryItem[] = Array.from(orderStatusStatsMap.values()).map((s) => ({
      status: s.status,
      label: s.status.replace(/_/g, " "),
      ordersCount: s.ordersCount,
      unitsSold: s.unitsSold,
      revenue: Math.round(s.revenue),
      percentage: orderStatusTotal > 0 ? Number(((s.ordersCount / orderStatusTotal) * 100).toFixed(1)) : 0,
    }));

    // Format Payment Method Report
    const paymentMethodReport: PaymentMethodSummaryItem[] = Array.from(paymentMethodStatsMap.values()).map((p) => ({
      method: p.method,
      label: p.method === "CASH_ON_DELIVERY" ? "Cash on Delivery" : p.method.replace(/_/g, " "),
      ordersCount: p.ordersCount,
      revenue: Math.round(p.revenue),
      percentage: orderStatusTotal > 0 ? Number(((p.ordersCount / orderStatusTotal) * 100).toFixed(1)) : 0,
    }));

    // Format Customer Performance
    const customerReport: CustomerSalesItem[] = Array.from(customerStatsMap.values())
      .map((c) => ({
        customerId: c.customerId,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        customerEmail: c.customerEmail,
        isRegistered: c.isRegistered,
        ordersCount: c.ordersCount,
        itemsPurchased: c.itemsPurchased,
        totalSpent: Math.round(c.totalSpent),
        averageOrderValue: c.ordersCount > 0 ? Math.round(c.totalSpent / c.ordersCount) : 0,
        lastOrderAt: c.lastOrderAt,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 50);

    // Sorting & Pagination for Detailed Transactions Table
    const sortBy = params.sortBy || "date";
    const sortOrder = params.sortOrder || "desc";

    detailedTransactions.sort((a, b) => {
      let valA: any = a.orderDate;
      let valB: any = b.orderDate;

      if (sortBy === "revenue") {
        valA = a.netSales;
        valB = b.netSales;
      } else if (sortBy === "quantity") {
        valA = a.quantity;
        valB = b.quantity;
      } else if (sortBy === "customer") {
        valA = a.customerName.toLowerCase();
        valB = b.customerName.toLowerCase();
      } else if (sortBy === "product") {
        valA = a.productTitle.toLowerCase();
        valB = b.productTitle.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 25));
    const totalTransactions = detailedTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const paginatedTransactions = detailedTransactions.slice((page - 1) * limit, page * limit);

    return {
      dateRange: {
        preset: params.preset || "30d",
        startDate: startIso,
        endDate: endIso,
        interval,
      },
      summary: summaryKPI,
      timeSeries: timeSeriesData,
      topProducts: topProducts.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 20),
      topRevenueProducts: [...topProducts].sort((a, b) => b.netRevenue - a.netRevenue).slice(0, 20),
      topVariants,
      categories: categoryReport,
      orderStatuses: orderStatusReport,
      paymentMethods: paymentMethodReport,
      topCustomers: customerReport,
      transactions: {
        items: paginatedTransactions,
        total: totalTransactions,
        page,
        limit,
        totalPages,
      },
      availableFilters: {
        categories: (categoriesData || []).map((c) => ({ id: c.id, name: c.name })),
        statuses: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "READY_TO_SHIP",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
          "RETURN_REQUESTED",
          "RETURNED",
          "REFUNDED",
        ],
        paymentMethods: Array.from(paymentMethodStatsMap.keys()),
      },
    };
  }

  /**
   * Export Full Sales Report Data (CSV or Spreadsheet JSON)
   */
  public static async exportSalesReport(params: SalesReportFilterParams, format: "csv" | "json" = "csv") {
    const report = await this.getSalesReport({ ...params, page: 1, limit: 10000 });
    const transactions = report.transactions.items;

    if (format === "csv") {
      const headers = [
        "Order Reference",
        "Date",
        "Customer Name",
        "Customer Phone",
        "Customer Email",
        "Product",
        "SKU",
        "Variant",
        "Category",
        "Quantity",
        "Unit Price (BDT)",
        "Subtotal (BDT)",
        "Discount (BDT)",
        "Net Sales (BDT)",
        "Order Status",
        "Payment Method",
      ];

      const rows = transactions.map((t) => [
        `"${t.orderNumber}"`,
        `"${new Date(t.orderDate).toLocaleString()}"`,
        `"${t.customerName.replace(/"/g, '""')}"`,
        `"${t.customerPhone || ""}"`,
        `"${t.customerEmail || ""}"`,
        `"${t.productTitle.replace(/"/g, '""')}"`,
        `"${t.sku}"`,
        `"${(t.variantTitle || "").replace(/"/g, '""')}"`,
        `"${t.categoryName.replace(/"/g, '""')}"`,
        t.quantity,
        t.unitPrice,
        t.subtotal,
        t.discountAmount,
        t.netSales,
        `"${t.orderStatus}"`,
        `"${t.paymentMethod}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      return {
        filename: `sales_report_${new Date().toISOString().split("T")[0]}.csv`,
        contentType: "text/csv; charset=utf-8",
        content: "\uFEFF" + csvContent, // UTF-8 BOM for Excel Bengali/symbol support
      };
    }

    return report;
  }
}
