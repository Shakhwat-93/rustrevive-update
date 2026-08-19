"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import type { OrderStatus, PaymentStatus } from "@/types/database.types";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: string;
  payment_method: string;
  grand_total: number;
  created_at: string;
  order_items: { id: string; product_title_snapshot: string; quantity: number }[];
}

const STATUS_TABS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (data?.data) {
        setOrders(data.data.orders || []);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: ColumnDef<OrderRow>[] = [
    {
      key: "order_number",
      header: "Order Reference",
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/orders/${row.id}`}
            className="font-mono text-xs font-semibold text-slate-900 hover:text-amber-700 transition-colors"
          >
            {row.order_number}
          </Link>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800">{row.customer_name}</span>
          <span className="text-[11px] font-mono text-slate-500">{row.customer_phone}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Order Status",
      cell: (row: OrderRow) => <StatusBadge status={row.status} />,
    },
    {
      key: "payment_status",
      header: "Payment",
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <span
            className={`text-[11px] font-mono font-medium ${
              row.payment_status === "COD_COLLECTED"
                ? "text-emerald-700"
                : row.payment_status === "COD_PENDING"
                ? "text-amber-700"
                : "text-slate-600"
            }`}
          >
            {row.payment_status === "COD_PENDING" ? "COD (Pending)" : row.payment_status}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {row.payment_method === "CASH_ON_DELIVERY" ? "Cash On Delivery" : row.payment_method}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (row: OrderRow) => {
        const count = row.order_items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
        return (
          <span className="text-xs font-mono text-slate-700">
            {count} {count === 1 ? "item" : "items"}
          </span>
        );
      },
    },
    {
      key: "grand_total",
      header: "Total (BDT)",
      cell: (row: OrderRow) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          ৳{row.grand_total.toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      cell: (row: OrderRow) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded inline-flex items-center space-x-1 text-xs font-mono transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </Link>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Orders Management"
      subtitle="Manage live customer orders, COD payments, stock allocation, and dispatch lifecycles."
      actions={
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchOrders}
        >
          Refresh Orders
        </AdminButton>
      }
    >
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-md space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order # (RR-100001), customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono border border-slate-200 rounded focus:border-slate-800 outline-none transition-colors"
            />
          </div>
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
            Showing {orders.length} of {totalCount} orders
          </span>
        </div>
      </div>

      {/* Main Table */}
      {orders.length === 0 && !loading ? (
        <AdminEmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            search
              ? "No orders match your search criteria. Try a different query."
              : "No customer orders have been recorded in this status."
          }
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setActiveTab("ALL");
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
        />
      )}
    </AdminPageLayout>
  );
}
