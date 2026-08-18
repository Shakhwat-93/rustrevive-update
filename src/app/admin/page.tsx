import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowRight,
  PackagePlus,
  LayoutTemplate,
  Plus,
} from "lucide-react";
import { KPICard } from "@/components/admin/ui/kpi-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";

const RECENT_ORDERS = [
  { id: "RR-1025", customer: "Tanvir Ahmed", items: 2, total: "৳17,520", payment: "paid", status: "fulfilled", time: "12 mins ago" },
  { id: "RR-1024", customer: "Nafis Fuad", items: 1, total: "৳4,560", payment: "paid", status: "unfulfilled", time: "45 mins ago" },
  { id: "RR-1023", customer: "Zarin Tasnim", items: 3, total: "৳22,200", payment: "paid", status: "fulfilled", time: "2 hours ago" },
  { id: "RR-1022", customer: "Farhan Kabir", items: 1, total: "৳6,960", payment: "pending", status: "unfulfilled", time: "4 hours ago" },
  { id: "RR-1021", customer: "Raisa Mehnaz", items: 2, total: "৳15,120", payment: "paid", status: "fulfilled", time: "Yesterday" },
];

const LOW_STOCK_ITEMS = [
  { sku: "RR-JKT-003-L", name: "Vintage Aviator Jacket (Size L)", remaining: 2, threshold: 5 },
  { sku: "RR-PNT-001-M", name: "Wide Leg Sweatpants (Size M)", remaining: 3, threshold: 10 },
  { sku: "RR-TEE-004-XL", name: "280GSM Heavy Boxy Tee (Size XL)", remaining: 1, threshold: 8 },
  { sku: "RR-BLT-005-32", name: "Vegetable Tanned Belt (Size 32)", remaining: 4, threshold: 6 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Commerce Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time store performance, inventory levels, and dispatch status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/content/homepage"
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#9e472a]" />
            <span>Edit Homepage CMS</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 4 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value="৳384,500"
          change="+14.2%"
          trend="up"
          subtitle="vs last 7 days"
          icon={DollarSign}
        />
        <KPICard
          title="Total Orders"
          value="68"
          change="+8.4%"
          trend="up"
          subtitle="vs last 7 days"
          icon={ShoppingCart}
        />
        <KPICard
          title="Average Order Value"
          value="৳5,654"
          change="+5.1%"
          trend="up"
          subtitle="vs last 7 days"
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

      {/* Two Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Recent Orders */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-[#9e472a] hover:underline flex items-center"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4">Fulfillment</th>
                  <th className="py-2.5 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{order.customer}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{order.total}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.payment} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {order.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Low Stock Alerts & Quick Tools */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-600 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Low Stock Alerts</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">4 items</span>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100">
              {LOW_STOCK_ITEMS.map((item) => (
                <div key={item.sku} className="pt-2 flex items-center justify-between text-xs">
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

            <Link
              href="/admin/inventory"
              className="block text-center text-xs font-medium text-slate-600 hover:text-slate-900 pt-2 border-t border-slate-100"
            >
              Manage Inventory →
            </Link>
          </div>

          {/* Direct Shortcuts */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operations Shortcuts
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/content/homepage"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutTemplate className="w-4 h-4 text-[#9e472a]" />
                  <span>Update Homepage Hero Slides</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <PackagePlus className="w-4 h-4 text-emerald-400" />
                  <span>Publish New Garment SKU</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
