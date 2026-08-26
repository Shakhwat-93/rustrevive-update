"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Percent,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { KPICard } from "@/components/admin/ui/kpi-card";

interface SalesReportData {
  dateRange: {
    preset: string;
    startDate: string;
    endDate: string;
    interval: "hour" | "day" | "week" | "month";
  };
  summary: {
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
  };
  timeSeries: Array<{
    label: string;
    timestamp: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  topProducts: Array<{
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
  }>;
  topRevenueProducts: Array<{
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
  }>;
  topVariants: Array<{
    productId: string;
    variantId: string | null;
    productTitle: string;
    variantTitle: string | null;
    sku: string;
    quantitySold: number;
    revenue: number;
  }>;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    ordersCount: number;
    unitsSold: number;
    revenue: number;
    percentageOfTotal: number;
  }>;
  orderStatuses: Array<{
    status: string;
    label: string;
    ordersCount: number;
    unitsSold: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    label: string;
    ordersCount: number;
    revenue: number;
    percentage: number;
  }>;
  topCustomers: Array<{
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
  }>;
  transactions: {
    items: Array<{
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
      orderStatus: string;
      paymentStatus: string;
      paymentMethod: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  availableFilters: {
    categories: Array<{ id: string; name: string }>;
    statuses: string[];
    paymentMethods: string[];
  };
}

export default function SalesReportPage() {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [preset, setPreset] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Chart Metric Selection
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders" | "quantity">("revenue");

  // Top Products Tab
  const [topProductTab, setTopProductTab] = useState<"units" | "revenue" | "variants">("units");

  // Fetch Report Data
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (preset !== "custom") {
        params.set("preset", preset);
      } else {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }

      if (selectedCategory !== "ALL") params.set("categoryId", selectedCategory);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedPayment !== "ALL") params.set("paymentMethod", selectedPayment);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/admin/sales-report?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
    }
  }, [preset, startDate, endDate, selectedCategory, selectedStatus, selectedPayment, searchQuery, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Handle Export Download
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (preset !== "custom") {
      params.set("preset", preset);
    } else {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    if (selectedCategory !== "ALL") params.set("categoryId", selectedCategory);
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (selectedPayment !== "ALL") params.set("paymentMethod", selectedPayment);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    params.set("format", "csv");

    window.open(`/api/admin/sales-report/export?${params.toString()}`, "_blank");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSortColumn = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setPreset("30d");
    setStartDate("");
    setEndDate("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedPayment("ALL");
    setSearchQuery("");
    setPage(1);
    setSortBy("date");
    setSortOrder("desc");
  };

  // Chart Max Calculation
  const chartMax = useMemo(() => {
    if (!data?.timeSeries || data.timeSeries.length === 0) return 100;
    const values = data.timeSeries.map((t) => t[chartMetric]);
    const maxVal = Math.max(...values, 10);
    return Math.ceil(maxVal * 1.15);
  }, [data?.timeSeries, chartMetric]);

  return (
    <AdminPageLayout
      title="Sales Report & Commercial Intelligence"
      subtitle="Complete database-driven analysis of revenue, items sold, top categories, and customers."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Print PDF */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadReport}
            className="p-2 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <Link
            href="/admin/analytics"
            className="px-3.5 py-1.5 text-xs font-mono font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Overview & Funnel
          </Link>
          <Link
            href="/admin/analytics/sales"
            className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#141312] text-white rounded-lg shadow-2xs"
          >
            Sales Report
          </Link>
        </div>

        {/* 1. Date Range & Multi-Dimensional Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "this_week", label: "This Week" },
                { key: "7d", label: "Last 7D" },
                { key: "this_month", label: "This Month" },
                { key: "30d", label: "Last 30D" },
                { key: "this_year", label: "This Year" },
                { key: "custom", label: "Custom Range" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setPreset(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                    preset === tab.key
                      ? "bg-[#141312] text-white shadow-2xs font-semibold"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 text-xs font-mono text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Custom Date Pickers (if custom selected) */}
          {preset === "custom" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-3 text-xs font-mono animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:border-[#9e472a]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:border-[#9e472a]"
                />
              </div>
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-4 py-1.5 bg-[#9e472a] text-white font-semibold rounded-md hover:bg-[#853c23] transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Filter Dropdowns & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs font-mono">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#9e472a]"
              >
                <option value="ALL">All Categories</option>
                {data?.availableFilters.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Order Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#9e472a]"
              >
                <option value="ALL">All Statuses</option>
                {data?.availableFilters.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Payment Method</label>
              <select
                value={selectedPayment}
                onChange={(e) => {
                  setSelectedPayment(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#9e472a]"
              >
                <option value="ALL">All Methods</option>
                {data?.availableFilters.paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m === "CASH_ON_DELIVERY" ? "Cash on Delivery" : m.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Order #, product, customer..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Sales Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Gross Revenue"
            value={`৳${(data?.summary.grossRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            subtitle="Pre-discount product value"
          />
          <KPICard
            title="Net Sales"
            value={`৳${(data?.summary.netSales || 0).toLocaleString()}`}
            icon={TrendingUp}
            subtitle={`${data?.summary.validOrders || 0} realized orders`}
          />
          <KPICard
            title="Items Sold"
            value={(data?.summary.itemsSold || 0).toString()}
            icon={Package}
            subtitle="Total units dispatched"
          />
          <KPICard
            title="Average Order Value"
            value={`৳${(data?.summary.averageOrderValue || 0).toLocaleString()}`}
            icon={ShoppingBag}
            subtitle="Per realized transaction"
          />

          <KPICard
            title="Discounts Given"
            value={`৳${(data?.summary.totalDiscount || 0).toLocaleString()}`}
            icon={Percent}
            subtitle="Promotions & coupons"
          />
          <KPICard
            title="Total Orders"
            value={(data?.summary.totalOrders || 0).toString()}
            icon={Layers}
            subtitle="All logged orders"
          />
          <KPICard
            title="Cancelled Orders"
            value={(data?.summary.cancelledOrdersCount || 0).toString()}
            icon={XCircle}
            subtitle={`৳${(data?.summary.cancelledOrdersValue || 0).toLocaleString()} uncollected`}
          />
          <KPICard
            title="Returned Orders"
            value={(data?.summary.returnedOrdersCount || 0).toString()}
            icon={RotateCcw}
            subtitle={`৳${(data?.summary.returnedOrdersValue || 0).toLocaleString()} returned`}
          />
        </div>

        {/* 3. Sales Overview Interactive Performance Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Sales Performance Trend
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Timeline visualization for {data?.dateRange.preset?.replace(/_/g, " ")} ({data?.dateRange.interval} intervals)
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              {[
                { key: "revenue", label: "Revenue (৳)" },
                { key: "orders", label: "Orders" },
                { key: "quantity", label: "Units Sold" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setChartMetric(m.key as any)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                    chartMetric === m.key
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="pt-4">
            {(!data?.timeSeries || data.timeSeries.length === 0) ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                No data available for this timeframe.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-56 flex items-end space-x-1.5 sm:space-x-2 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
                  {data.timeSeries.map((point, idx) => {
                    const value = point[chartMetric];
                    const heightPercent = chartMax > 0 ? Math.min(100, Math.max(4, (value / chartMax) * 100)) : 4;

                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                          <p className="font-semibold">{point.label}</p>
                          <p>
                            {chartMetric === "revenue"
                              ? `৳${point.revenue.toLocaleString()}`
                              : chartMetric === "orders"
                              ? `${point.orders} Orders`
                              : `${point.quantity} Units`}
                          </p>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            value > 0
                              ? chartMetric === "revenue"
                                ? "bg-[#9e472a] hover:bg-[#853c23]"
                                : chartMetric === "orders"
                                ? "bg-slate-800 hover:bg-slate-900"
                                : "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-slate-100"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 px-2 overflow-x-auto">
                  {data.timeSeries.map((p, idx) => {
                    // Show every nth label to avoid crowding
                    const step = Math.ceil(data.timeSeries.length / 8);
                    const shouldShow = idx % step === 0 || idx === data.timeSeries.length - 1;
                    return (
                      <span key={idx} className={shouldShow ? "block" : "hidden sm:block opacity-0"}>
                        {shouldShow ? p.label : "."}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Top Selling Products & Variants Rankings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Top Product Performance Rankings
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Inspect which handcrafted garments drive the highest volume and revenue
              </p>
            </div>

            {/* Tab selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              {[
                { key: "units", label: "By Units Sold" },
                { key: "revenue", label: "By Net Revenue" },
                { key: "variants", label: "By Variant (Qty)" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTopProductTab(t.key as any)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                    topProductTab === t.key
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            {topProductTab === "variants" ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-4">Product Title</th>
                    <th className="py-2.5 px-4">Variant</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-right">Quantity Sold</th>
                    <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(!data?.topVariants || data.topVariants.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No variant sales in this period.</td>
                    </tr>
                  ) : (
                    data.topVariants.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{v.productTitle}</td>
                        <td className="py-2.5 px-4 text-slate-600">{v.variantTitle || "Standard"}</td>
                        <td className="py-2.5 px-4 text-slate-500">{v.sku}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#9e472a]">{v.quantitySold} units</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">৳{v.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Orders</th>
                    <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                    <th className="py-2.5 px-4 text-right">Discount</th>
                    <th className="py-2.5 px-4 text-right">Net Revenue</th>
                    <th className="py-2.5 px-4 text-right">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {((topProductTab === "units" ? data?.topProducts : data?.topRevenueProducts) || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">No product sales in this period.</td>
                    </tr>
                  ) : (
                    (topProductTab === "units" ? data?.topProducts : data?.topRevenueProducts)?.map((p, idx) => (
                      <tr key={p.productId || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            {p.imageUrl ? (
                              <div className="w-6 h-8 bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0 rounded-xs">
                                <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="30px" />
                              </div>
                            ) : (
                              <div className="w-6 h-8 bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 shrink-0">
                                R&R
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                              <p className="text-[10px] text-slate-400">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{p.categoryName}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#9e472a]">{p.unitsSold}</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{p.ordersCount}</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">৳{p.grossRevenue.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700">
                          {p.discount > 0 ? `-৳${p.discount.toLocaleString()}` : "৳0"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">৳{p.netRevenue.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">৳{p.avgSellingPrice.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 5. Category Breakdown & Order Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Category Sales Performance
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(!data?.categories || data.categories.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">No category sales found.</td>
                    </tr>
                  ) : (
                    data.categories.map((c) => (
                      <tr key={c.categoryId} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.categoryName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{c.unitsSold}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">৳{c.revenue.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-block px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {c.percentageOfTotal}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Status & Payment Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Order Status Distribution
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Orders</th>
                      <th className="py-2 px-3 text-right">Units</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(!data?.orderStatuses || data.orderStatuses.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">No orders in window.</td>
                      </tr>
                    ) : (
                      data.orderStatuses.map((s) => (
                        <tr key={s.status} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900">{s.label}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">{s.ordersCount}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{s.unitsSold}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">৳{s.revenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider mb-2">
                Payment Methods
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(data?.paymentMethods || []).map((pm) => (
                  <div key={pm.method} className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs">
                    <p className="text-slate-500 text-[10px] uppercase">{pm.label}</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">৳{pm.revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pm.ordersCount} transactions</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Customer Sales Performance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-mono">
            Customer Sales & Patronage Performance
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4 text-right">Orders</th>
                  <th className="py-2.5 px-4 text-right">Items Purchased</th>
                  <th className="py-2.5 px-4 text-right">Total Spent</th>
                  <th className="py-2.5 px-4 text-right">AOV</th>
                  <th className="py-2.5 px-4 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(!data?.topCustomers || data.topCustomers.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">No customer records found.</td>
                  </tr>
                ) : (
                  data.topCustomers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{c.customerName}</span>
                          {c.isRegistered && (
                            <span className="px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px]">
                              Registered
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{c.customerPhone}</td>
                      <td className="py-2.5 px-4 text-right text-slate-700">{c.ordersCount}</td>
                      <td className="py-2.5 px-4 text-right text-slate-700">{c.itemsPurchased}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">৳{c.totalSpent.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">৳{c.averageOrderValue.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(c.lastOrderAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Detailed Sales Transaction Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Detailed Sales Ledger
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Itemized transaction records matching selected filters ({data?.transactions.total || 0} line items)
              </p>
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                  <th
                    onClick={() => handleSortColumn("date")}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900"
                  >
                    Date {sortBy === "date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="py-3 px-4 font-semibold">Order Ref</th>
                  <th
                    onClick={() => handleSortColumn("customer")}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900"
                  >
                    Customer {sortBy === "customer" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSortColumn("product")}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900"
                  >
                    Product & Variant {sortBy === "product" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th
                    onClick={() => handleSortColumn("quantity")}
                    className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900"
                  >
                    Qty {sortBy === "quantity" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Discount</th>
                  <th
                    onClick={() => handleSortColumn("revenue")}
                    className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900"
                  >
                    Net Sales {sortBy === "revenue" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                      <span>Loading sales transactions...</span>
                    </td>
                  </tr>
                ) : (!data?.transactions.items || data.transactions.items.length === 0) ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <Package className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="font-semibold text-slate-700">No Sales Records Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try expanding your date range or clearing specific product/category filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.transactions.items.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(t.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <Link href={`/admin/orders/${t.orderId}`} className="hover:text-[#9e472a] hover:underline">
                          {t.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 line-clamp-1">{t.customerName}</p>
                        <p className="text-[10px] text-slate-400">{t.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 line-clamp-1">{t.productTitle}</p>
                        {t.variantTitle && <p className="text-[10px] text-slate-500">{t.variantTitle}</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.categoryName}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{t.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-600">৳{t.unitPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {t.discountAmount > 0 ? `-৳${t.discountAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#9e472a]">
                        ৳{t.netSales.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                            t.orderStatus === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.orderStatus === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {t.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data && data.transactions.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-500">
              <span>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.transactions.total)} of {data.transactions.total} records
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-semibold text-slate-800">
                  {page} / {data.transactions.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.transactions.totalPages}
                  onClick={() => setPage((p) => Math.min(data.transactions.totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
