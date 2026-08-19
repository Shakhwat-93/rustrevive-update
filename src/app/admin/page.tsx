"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  Calendar,
  RefreshCw,
  Package,
  ShoppingBag,
} from "lucide-react";
import { KPICard } from "@/components/admin/ui/kpi-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";

interface DashboardMetrics {
  summary: {
    totalRevenue: number;
    orderCount: number;
    aov: number;
    uniqueCustomers: number;
    totalPatrons: number;
    conversionRate: number;
  };
  topProducts: {
    title: string;
    units: number;
    revenue: number;
  }[];
  lowStockItems: {
    id: string;
    sku: string;
    name: string;
    remaining: number;
    status: string;
  }[];
  recentOrders: {
    id: string;
    rawId: string;
    customer: string;
    date: string;
    payment: string;
    status: string;
    total: string;
  }[];
}

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const json = await res.json();
      if (json?.data) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = metrics?.summary || {
    totalRevenue: 0,
    orderCount: 0,
    aov: 0,
    uniqueCustomers: 0,
    totalPatrons: 0,
    conversionRate: 0,
  };

  const recentOrders = metrics?.recentOrders || [];
  const lowStockItems = metrics?.lowStockItems || [];
  const topProducts = metrics?.topProducts || [];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Commerce Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time store performance, customer orders, and inventory velocity.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Live Date Filter */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs overflow-x-auto max-w-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5 shrink-0" />
            {[
              { label: "Today", value: "today" },
              { label: "7 Days", value: "7d" },
              { label: "30 Days", value: "30d" },
              { label: "90 Days", value: "90d" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDateRange(tab.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  dateRange === tab.value
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AdminButton
            variant="ghost"
            icon={RefreshCw}
            size="sm"
            isLoading={loading}
            onClick={loadDashboard}
          >
            Refresh
          </AdminButton>

          <AdminButton
            href="/admin/products/new"
            variant="primary"
            icon={Plus}
            size="sm"
          >
            Add Product
          </AdminButton>
        </div>
      </div>

      {/* 4 Real-Data KPI Cards (2 columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <KPICard
          title="Total Revenue"
          value={`৳${summary.totalRevenue.toLocaleString("en-US")}`}
          subtitle={`Realized in last ${dateRange}`}
          icon={DollarSign}
        />
        <KPICard
          title="Total Orders"
          value={`${summary.orderCount} orders`}
          subtitle={`Orders in last ${dateRange}`}
          icon={ShoppingCart}
        />
        <KPICard
          title="Avg Order Value"
          value={`৳${summary.aov.toLocaleString("en-US")}`}
          subtitle="Revenue / valid orders"
          icon={TrendingUp}
        />
        <KPICard
          title="Active Patrons"
          value={`${summary.uniqueCustomers} customers`}
          subtitle={`${summary.totalPatrons} registered accounts`}
          icon={Users}
        />
      </div>

      {/* Two Column Section: Recent Orders + Low Stock & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left 8 Cols: Recent Real Orders */}
        <div className="lg:col-span-8">
          <AdminCard
            title="Recent Orders"
            subtitle="Latest orders from database requiring fulfillment"
            noPadding
            action={
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-[#9e472a] hover:underline flex items-center"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            }
          >
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={4} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-medium text-slate-600">No orders recorded in this period</p>
                <p className="text-[11px] text-slate-400">
                  New customer orders will appear here automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View (hidden on mobile < md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Order</th>
                        <th className="py-2.5 px-4">Customer</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Payment</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr
                          key={order.rawId}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            <Link href={`/admin/orders/${order.rawId}`} className="hover:underline">
                              #{order.id}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{order.customer}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{order.date}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.status} size="sm" />
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.payment} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                            {order.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View (visible on mobile < md) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.rawId}
                      href={`/admin/orders/${order.rawId}`}
                      className="block p-3 space-y-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{order.id}
                        </span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">{order.customer}</span>
                        <span className="font-mono font-bold text-slate-900">{order.total}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                        <span>{order.date}</span>
                        <StatusBadge status={order.payment} size="sm" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </AdminCard>
        </div>

        {/* Right 4 Cols: Low Stock Alerts & Top Products */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Real Low Stock Inventory */}
          <AdminCard
            title="Low Stock Inventory"
            action={
              lowStockItems.length > 0 ? (
                <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {lowStockItems.length} low stock
                </span>
              ) : null
            }
            noPadding
          >
            {loading ? (
              <div className="p-3">
                <TableSkeleton rows={3} />
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Package className="w-6 h-6 mx-auto text-slate-300 stroke-1 mb-1" />
                <p className="font-medium text-slate-600">All stock levels healthy</p>
                <p className="text-[11px] text-slate-400">No items below low-stock threshold.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {item.remaining} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          {/* Real Top Selling Products */}
          <AdminCard title="Top Velocity Products" noPadding>
            {loading ? (
              <div className="p-3">
                <TableSkeleton rows={3} />
              </div>
            ) : topProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <TrendingUp className="w-6 h-6 mx-auto text-slate-300 stroke-1 mb-1" />
                <p className="font-medium text-slate-600">No sales recorded yet</p>
                <p className="text-[11px] text-slate-400">Top selling items will calculate from completed orders.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topProducts.map((prod) => (
                  <div
                    key={prod.title}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {prod.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {prod.units} {prod.units === 1 ? "unit" : "units"} sold
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-900 shrink-0">
                      ৳{prod.revenue.toLocaleString("en-US")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
