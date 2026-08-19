"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  RefreshCw,
  Eye,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import type { DeliveryStatus } from "@/types/database.types";

interface FulfillmentRow {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  tracking_number: string;
  shipment_reference: string;
  created_at: string;
  courier_providers?: { name: string; code: string } | null;
  orders?: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    grand_total: number;
    status: string;
  } | null;
}

interface Metrics {
  total: number;
  created: number;
  picked_up: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  failed: number;
  returned: number;
}

export default function AdminFulfillmentPage() {
  const [fulfillments, setFulfillments] = useState<FulfillmentRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    created: 0,
    picked_up: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    failed: 0,
    returned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DeliveryStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchFulfillments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/fulfillment?${params.toString()}`);
      const data = await res.json();

      if (data?.data) {
        setFulfillments(data.data.fulfillments || []);
        if (data.data.metrics) {
          setMetrics(data.data.metrics);
        }
      }
    } catch (err) {
      console.error("Failed to load fulfillments:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchFulfillments();
  }, [fetchFulfillments]);

  const columns: ColumnDef<FulfillmentRow>[] = [
    {
      key: "tracking_number",
      header: "Tracking ID",
      cell: (row: FulfillmentRow) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-slate-900">
            {row.tracking_number}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {row.courier_providers?.name || "In-House Logistics"}
          </span>
        </div>
      ),
    },
    {
      key: "order_number",
      header: "Order Reference",
      cell: (row: FulfillmentRow) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/orders/${row.order_id}`}
            className="font-mono text-xs font-semibold text-amber-800 hover:underline"
          >
            {row.orders?.order_number || "Order"}
          </Link>
          <span className="text-[11px] text-slate-500">
            {row.orders?.customer_name} ({row.orders?.customer_phone})
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Fulfillment Status",
      cell: (row: FulfillmentRow) => <StatusBadge status={row.status} />,
    },
    {
      key: "grand_total",
      header: "Consignment Value",
      cell: (row: FulfillmentRow) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          ৳{row.orders?.grand_total?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Dispatched Date",
      cell: (row: FulfillmentRow) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      cell: (row: FulfillmentRow) => (
        <Link
          href={`/admin/orders/${row.order_id}`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded inline-flex items-center space-x-1 text-xs font-mono transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </Link>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Fulfillment & Logistics"
      subtitle="Track active consignments, courier sync, dispatch statuses, and delivery workflows."
      actions={
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchFulfillments}
        >
          Refresh Logistics
        </AdminButton>
      }
    >
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Dispatched</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{metrics.total}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">In Transit</span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">{metrics.in_transit}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Out for Delivery</span>
          <span className="text-xl font-bold font-mono text-blue-700 mt-1 block">{metrics.out_for_delivery}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Delivered</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">{metrics.delivered}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Failed</span>
          <span className="text-xl font-bold font-mono text-rose-700 mt-1 block">{metrics.failed}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Returned</span>
          <span className="text-xl font-bold font-mono text-slate-700 mt-1 block">{metrics.returned}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-slate-200 p-4 rounded-md space-y-3">
        <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { label: "All Consignments", value: "ALL" },
            { label: "In Transit", value: "IN_TRANSIT" },
            { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
            { label: "Delivered", value: "DELIVERED" },
            { label: "Delivery Failed", value: "DELIVERY_FAILED" },
            { label: "Returned", value: "RETURNED" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as DeliveryStatus | "ALL")}
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

        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by tracking number (e.g. SF-..., RR-EXP-...) or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono border border-slate-200 rounded focus:border-slate-800 outline-none transition-colors"
            />
          </div>
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
            Showing {fulfillments.length} consignments
          </span>
        </div>
      </div>

      {/* Table / Empty State */}
      {fulfillments.length === 0 && !loading ? (
        <AdminEmptyState
          icon={Truck}
          title="No fulfillments recorded"
          description={
            search
              ? "No consignments match your search query."
              : "No orders have been dispatched under this fulfillment status yet."
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
          data={fulfillments}
        />
      )}
    </AdminPageLayout>
  );
}
