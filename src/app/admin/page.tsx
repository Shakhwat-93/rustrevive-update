"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  LayoutTemplate,
  Calendar,
  Package,
} from "lucide-react";
import { KPICard } from "@/components/admin/ui/kpi-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminButton } from "@/components/admin/ui/admin-button";

const RECENT_ORDERS = [
  { id: "RR-1025", customer: "Tanvir Ahmed", date: "Aug 18, 2026", payment: "paid", status: "fulfilled", total: "৳17,520" },
  { id: "RR-1024", customer: "Nafis Fuad", date: "Aug 18, 2026", payment: "pending", status: "unfulfilled", total: "৳4,560" },
  { id: "RR-1023", customer: "Zarin Tasnim", date: "Aug 17, 2026", payment: "paid", status: "fulfilled", total: "৳22,200" },
  { id: "RR-1022", customer: "Farhan Kabir", date: "Aug 16, 2026", payment: "paid", status: "unfulfilled", total: "৳6,960" },
  { id: "RR-1021", customer: "Raisa Mehnaz", date: "Aug 15, 2026", payment: "paid", status: "fulfilled", total: "৳15,120" },
];

const LOW_STOCK_ITEMS = [
  { sku: "RR-JKT-003-L", name: "Vintage Aviator Jacket (Size L)", remaining: 2, status: "low_stock" },
  { sku: "RR-PNT-001-M", name: "Wide Leg Sweatpants (Size M)", remaining: 3, status: "low_stock" },
  { sku: "RR-TEE-004-XL", name: "280GSM Heavy Boxy Tee (Size XL)", remaining: 1, status: "low_stock" },
  { sku: "RR-BLT-005-32", name: "Vegetable Tanned Belt (Size 32)", remaining: 4, status: "low_stock" },
];

const TOP_PRODUCTS = [
  { name: "Wide Leg Pleated Sweatpants", category: "Pants & Denim", units: 24, revenue: "৳167,040" },
  { name: "FB Sister Baggy Raw Denim", category: "Pants & Denim", units: 18, revenue: "৳189,120" },
  { name: "Vintage Washed Aviator Jacket", category: "Jackets", units: 5, revenue: "৳105,200" },
  { name: "280GSM Boxy Cut Tee", category: "T-Shirts", units: 32, revenue: "৳145,920" },
];

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");

  return (
    <div className="space-y-6">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Commerce Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor store performance, order fulfillment, and inventory levels.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Date Filter */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {[
              { label: "Today", value: "today" },
              { label: "7 Days", value: "7d" },
              { label: "30 Days", value: "30d" },
              { label: "Custom", value: "custom" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDateRange(tab.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  dateRange === tab.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AdminButton
            href="/admin/content/homepage"
            variant="secondary"
            icon={LayoutTemplate}
            size="md"
          >
            Edit Homepage
          </AdminButton>

          <AdminButton
            href="/admin/products/new"
            variant="primary"
            icon={Plus}
            size="md"
          >
            Add Product
          </AdminButton>
        </div>
      </div>

      {/* 4 Compact High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value="৳384,500"
          change="+14.2%"
          trend="up"
          subtitle="vs previous 7 days"
          icon={DollarSign}
        />
        <KPICard
          title="Total Orders"
          value="68"
          change="+8.4%"
          trend="up"
          subtitle="vs previous 7 days"
          icon={ShoppingCart}
        />
        <KPICard
          title="Average Order Value"
          value="৳5,654"
          change="+5.1%"
          trend="up"
          subtitle="vs previous 7 days"
          icon={TrendingUp}
        />
        <KPICard
          title="Active Customers"
          value="240"
          change="+18.0%"
          trend="up"
          subtitle="All districts"
          icon={Users}
        />
      </div>

      {/* Sales Overview Chart Section */}
      <AdminCard
        title="Sales & Orders Trajectory"
        subtitle="Performance across the selected date range"
        action={
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setChartMetric("revenue")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                chartMetric === "revenue"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Revenue (৳)
            </button>
            <button
              onClick={() => setChartMetric("orders")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                chartMetric === "orders"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Orders Count
            </button>
          </div>
        }
      >
        <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
          {[
            { day: "Mon", rev: 42, ord: 6 },
            { day: "Tue", rev: 58, ord: 9 },
            { day: "Wed", rev: 35, ord: 5 },
            { day: "Thu", rev: 72, ord: 12 },
            { day: "Fri", rev: 89, ord: 15 },
            { day: "Sat", rev: 110, ord: 18 },
            { day: "Sun", rev: 95, ord: 14 },
          ].map((bar) => {
            const heightPct = chartMetric === "revenue" ? (bar.rev / 110) * 100 : (bar.ord / 18) * 100;
            return (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {chartMetric === "revenue" ? `৳${bar.rev * 1000}` : `${bar.ord} orders`}
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[42px] bg-slate-800 hover:bg-[#9e472a] rounded-t transition-colors cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-500">{bar.day}</span>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* Two Column Section: Recent Orders + Low Stock & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Recent Orders */}
        <div className="lg:col-span-8">
          <AdminCard
            title="Recent Orders"
            subtitle="Latest orders requiring confirmation or dispatch"
            noPadding
            action={
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-[#9e472a] hover:underline flex items-center"
              >
                <span>View all orders</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
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
                  {RECENT_ORDERS.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {order.id}
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
          </AdminCard>
        </div>

        {/* Right 4 Cols: Low Stock Alerts & Top Products */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Inventory Warning */}
          <AdminCard
            title="Low Stock Inventory"
            action={
              <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                4 critical
              </span>
            }
          >
            <div className="space-y-3 divide-y divide-slate-100">
              {LOW_STOCK_ITEMS.map((item) => (
                <div key={item.sku} className="pt-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-slate-800 line-clamp-1">{item.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.remaining} left
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              <Link
                href="/admin/inventory"
                className="block text-center text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Manage Inventory Levels →
              </Link>
            </div>
          </AdminCard>

          {/* Top Products */}
          <AdminCard title="Top Performing Garments">
            <div className="space-y-3 divide-y divide-slate-100">
              {TOP_PRODUCTS.map((prod) => (
                <div key={prod.name} className="pt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-1">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{prod.units} units sold</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-semibold text-slate-800">
                    {prod.revenue}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
