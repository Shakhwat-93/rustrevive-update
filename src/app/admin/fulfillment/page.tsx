"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  RefreshCw,
  Eye,
  ChevronRight,
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

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Consignments", value: "ALL" },
  { label: "Picked Up", value: "PICKED_UP" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Out For Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Failed", value: "FAILED" },
  { label: "Returned", value: "RETURNED" },
];

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
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const fetchFulfillments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);

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
  }, [activeTab]);

  useEffect(() => {
    fetchFulfillments();
  }, [fetchFulfillments]);

  const columns: ColumnDef<FulfillmentRow>[] = [
    {
      key: "tracking_number",
      header: "Tracking ID",
      sortable: true,
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
      sortable: true,
      cell: (row: FulfillmentRow) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/orders/${row.order_id}`}
            className="font-mono text-xs font-semibold text-[#9e472a] hover:underline"
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
      sortable: true,
      cell: (row: FulfillmentRow) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "grand_total",
      header: "Consignment Value",
      sortable: true,
      cell: (row: FulfillmentRow) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          ৳{row.orders?.grand_total?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Dispatched Date",
      sortable: true,
      cell: (row: FulfillmentRow) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
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

  // Mobile Fulfillment Card Render
  const renderMobileFulfillmentCard = (row: FulfillmentRow) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-xs font-bold text-slate-900">
              {row.tracking_number}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              {row.courier_providers?.name || "In-House Logistics"}
            </div>
          </div>
          <StatusBadge status={row.status} size="sm" />
        </div>

        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
          <div className="min-w-0 pr-2">
            <Link
              href={`/admin/orders/${row.order_id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs font-semibold text-[#9e472a] hover:underline block truncate"
            >
              {row.orders?.order_number || "View Order"}
            </Link>
            <div className="text-[11px] text-slate-500 truncate">
              {row.orders?.customer_name} ({row.orders?.customer_phone})
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono text-xs font-bold text-slate-900">
              ৳{row.orders?.grand_total?.toLocaleString() || 0}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {new Date(row.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <Link
            href={`/admin/orders/${row.order_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-[#9e472a] hover:underline flex items-center space-x-0.5 font-mono"
          >
            <span>View Order</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  };

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
          Refresh
        </AdminButton>
      }
    >
      {/* Metric Cards Banner — 2 cols on mobile, 3 on sm, 6 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-4">
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Dispatched</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1 block">{metrics.total}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">In Transit</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-amber-700 mt-1 block">{metrics.in_transit}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Out for Delivery</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-blue-700 mt-1 block">{metrics.out_for_delivery}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Delivered</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1 block">{metrics.delivered}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Failed</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-rose-700 mt-1 block">{metrics.failed}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Returned</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-slate-700 mt-1 block">{metrics.returned}</span>
        </div>
      </div>

      {fulfillments.length === 0 && !loading ? (
        <AdminEmptyState
          icon={Truck}
          title="No consignments found"
          description="No delivery orders match the selected filter."
          actionText="Show All"
          onAction={() => setActiveTab("ALL")}
        />
      ) : (
        <DataTable
          columns={columns}
          data={fulfillments}
          filterTabs={STATUS_TABS}
          activeFilter={activeTab}
          onFilterChange={setActiveTab}
          searchPlaceholder="Search by tracking # or recipient..."
          searchKey="tracking_number"
          mobileCardRender={renderMobileFulfillmentCard}
          onRowClick={(item) => (window.location.href = `/admin/orders/${item.order_id}`)}
        />
      )}
    </AdminPageLayout>
  );
}
