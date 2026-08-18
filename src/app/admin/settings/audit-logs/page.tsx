"use client";

import React, { useState } from "react";
import { Shield, Clock } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";

interface AuditLogRow {
  id: string;
  action: string;
  actorName: string;
  resource: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

const AUDIT_DATA: AuditLogRow[] = [
  {
    id: "log-1",
    action: "HOMEPAGE_PUBLISHED",
    actorName: "Shakhwat Hossain (SUPER_ADMIN)",
    resource: "CMS",
    resourceId: "v2",
    details: "Published live homepage config with on-demand ISR revalidation",
    timestamp: "10 mins ago",
  },
  {
    id: "log-2",
    action: "PRICE_UPDATED",
    actorName: "Shakhwat Hossain",
    resource: "Products",
    resourceId: "RR-PNT-001",
    details: "Updated price from ৳5,800 to ৳6,960",
    timestamp: "1 hour ago",
  },
  {
    id: "log-3",
    action: "INVENTORY_ADJUSTED",
    actorName: "Shakhwat Hossain",
    resource: "Inventory",
    resourceId: "RR-JKT-003-L",
    details: "Stock adjusted: -3 units (Reason: Order #RR-1023)",
    timestamp: "2 hours ago",
  },
  {
    id: "log-4",
    action: "MEDIA_UPLOADED",
    actorName: "Shakhwat Hossain",
    resource: "Media (R2)",
    resourceId: "med-1",
    details: "Uploaded autumn-hero-fashion-model-35mm.webp (482 KB)",
    timestamp: "3 hours ago",
  },
  {
    id: "log-5",
    action: "ORDER_FULFILLED",
    actorName: "System Automation",
    resource: "Orders",
    resourceId: "RR-1025",
    details: "Tracking number generated and dispatched via courier",
    timestamp: "4 hours ago",
  },
];

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogRow[]>(AUDIT_DATA);

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: "action",
      header: "Action",
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
          {item.action}
        </span>
      ),
    },
    {
      key: "actorName",
      header: "Staff Member",
      sortable: true,
      cell: (item) => <span className="font-medium text-slate-800">{item.actorName}</span>,
    },
    {
      key: "resource",
      header: "Resource",
      sortable: true,
      cell: (item) => (
        <span className="text-slate-600 font-mono text-[11px]">
          {item.resource} ({item.resourceId})
        </span>
      ),
    },
    {
      key: "details",
      header: "Change Description",
      cell: (item) => <span className="text-slate-600 line-clamp-1">{item.details}</span>,
    },
    {
      key: "timestamp",
      header: "Time",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right text-slate-400 font-mono text-[11px] flex items-center justify-end space-x-1">
          <Clock className="w-3 h-3" />
          <span>{item.timestamp}</span>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Audit Logs"
      subtitle="Immutable audit trail of all staff administrative mutations and price adjustments."
      badge={<Shield className="w-4 h-4 text-emerald-600" />}
    >
      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Filter audit records..."
        searchKey="action"
      />
    </AdminPageLayout>
  );
}
