"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  RefreshCw,
  Eye,
  ChevronRight,
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

const STATUS_TABS: { label: string; value: string }[] = [
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
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);

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
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: ColumnDef<OrderRow>[] = [
    {
      key: "order_number",
      header: "Order Reference",
      sortable: true,
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/orders/${row.id}`}
            className="font-mono text-xs font-semibold text-slate-900 hover:text-[#9e472a] transition-colors"
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
      sortable: true,
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800">{row.customer_name}</span>
          <span className="text-[11px] font-mono text-slate-500">{row.customer_phone}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row: OrderRow) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "payment_status",
      header: "Payment",
      sortable: true,
      cell: (row: OrderRow) => (
        <div className="flex flex-col">
          <span
            className={`text-[11px] font-mono font-medium ${
              row.payment_status === "COD_COLLECTED" || row.payment_status === "PAID"
                ? "text-emerald-700 font-semibold"
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
      sortable: true,
      className: "text-right",
      cell: (row: OrderRow) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          ৳{row.grand_total.toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
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

  // Mobile Order Card Render
  const renderMobileOrderCard = (
    row: OrderRow,
    isSelected: boolean,
    toggleSelect: (e: React.SyntheticEvent) => void
  ) => {
    const itemsCount = row.order_items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

    return (
      <div className="space-y-3">
        {/* Header: Order Ref + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={toggleSelect}
              className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-slate-900">
              {row.order_number}
            </span>
          </div>
          <StatusBadge status={row.status} size="sm" />
        </div>

        {/* Customer & Total Details */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {row.customer_name}
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate">
              {row.customer_phone}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-mono font-bold text-slate-900">
              ৳{row.grand_total.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {itemsCount} {itemsCount === 1 ? "item" : "items"}
            </div>
          </div>
        </div>

        {/* Footer: Payment info, Date, and View CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-semibold ${
                row.payment_status === "COD_COLLECTED" || row.payment_status === "PAID"
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {row.payment_status === "COD_PENDING" ? "COD" : row.payment_status}
            </span>
            <span>•</span>
            <span>
              {new Date(row.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <Link
            href={`/admin/orders/${row.id}`}
            className="text-xs font-medium text-[#9e472a] hover:underline flex items-center space-x-0.5"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Orders Management"
      subtitle="Manage live customer orders, COD payments, stock allocation, and dispatch lifecycles."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {totalCount} total
        </span>
      }
      actions={
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchOrders}
        >
          Refresh
        </AdminButton>
      }
    >
      {orders.length === 0 && !loading ? (
        <AdminEmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="No customer orders match the current status filter."
          actionText="Show All Orders"
          onAction={() => setActiveTab("ALL")}
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="customer_name"
          searchPlaceholder="Search by customer name, order #, or phone..."
          filterTabs={STATUS_TABS}
          activeFilter={activeTab}
          onFilterChange={setActiveTab}
          mobileCardRender={renderMobileOrderCard}
          onRowClick={(item) => (window.location.href = `/admin/orders/${item.id}`)}
        />
      )}
    </AdminPageLayout>
  );
}
