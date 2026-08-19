"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Clock, RefreshCw, ScrollText } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";

interface AuditLogRow {
  id: string;
  action: string;
  actorName: string;
  resource: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: "action",
      header: "Action",
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase">
          {item.action.replace(/_/g, " ")}
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
          {item.resource} {item.resourceId ? `(${item.resourceId})` : ""}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (item) => <span className="text-slate-600 line-clamp-1 font-mono text-xs">{item.details}</span>,
    },
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right text-slate-400 font-mono text-[11px] flex items-center justify-end space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
  ];

  // Mobile Audit Card Render
  const renderMobileAuditCard = (item: AuditLogRow) => {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase truncate">
            {item.action.replace(/_/g, " ")}
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-700 font-medium pt-1">
          <span>{item.actorName}</span>
          <span className="text-slate-400 font-mono text-[10px]">{item.resource}</span>
        </div>

        <p className="text-[11px] text-slate-500 font-mono line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
          {item.details}
        </p>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Audit Logs"
      subtitle="Immutable audit trail of staff administrative mutations, price adjustments, and system events."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
          <Shield className="w-3 h-3 text-emerald-600 mr-1" />
          <span>{logs.length} logs</span>
        </span>
      }
      actions={
        <AdminButton
          variant="ghost"
          icon={RefreshCw}
          isLoading={loading}
          onClick={loadAuditLogs}
        >
          Refresh
        </AdminButton>
      }
    >
      {loading ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <AdminEmptyState
          icon={ScrollText}
          title="No audit events logged"
          description="Administrative mutations, price adjustments, and role updates will be automatically recorded here."
        />
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Filter audit records by action or user..."
          searchKey="action"
          mobileCardRender={renderMobileAuditCard}
        />
      )}
    </AdminPageLayout>
  );
}
