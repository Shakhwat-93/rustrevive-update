"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, MapPin, Users, RefreshCw } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";
import { useAdminDialog } from "@/context/admin-dialog-context";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { exportToCSV, showToast } = useAdminDialog();

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data.customers || []);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
      showToast("Unable to load customer directory", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleExport = () => {
    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Location",
      "Orders Count",
      "Total Spent (BDT)",
      "Last Order",
    ];
    const rows = customers.map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone || "N/A",
      c.location,
      c.ordersCount,
      c.totalSpent,
      c.lastOrder,
    ]);
    exportToCSV("rust_revive_customers", headers, rows);
  };

  const columns: ColumnDef<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      cell: (item) => (
        <div className="py-1">
          <div className="font-semibold text-slate-900 line-clamp-1">{item.name}</div>
          <div className="text-[11px] text-slate-400 font-mono line-clamp-1">{item.email}</div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      cell: (item) => <span className="text-slate-600 font-medium">{item.location}</span>,
    },
    {
      key: "ordersCount",
      header: "Orders",
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-slate-700 font-medium">
          {item.ordersCount} {item.ordersCount === 1 ? "order" : "orders"}
        </span>
      ),
    },
    {
      key: "totalSpent",
      header: "Total Spent",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right font-mono font-semibold text-slate-900">
          ৳{item.totalSpent.toLocaleString("en-US")}
        </div>
      ),
    },
  ];

  // Mobile Customer Card Render
  const renderMobileCustomerCard = (item: CustomerRow) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#9e472a]/10 text-[#9e472a] flex items-center justify-center font-bold text-xs font-mono shrink-0">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs text-slate-900 truncate">{item.name}</h4>
              <p className="text-[11px] font-mono text-slate-400 truncate">{item.email}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono text-xs font-bold text-slate-900">
              ৳{item.totalSpent.toLocaleString("en-US")}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {item.ordersCount} {item.ordersCount === 1 ? "order" : "orders"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] font-mono text-slate-500">
          <div className="flex items-center space-x-1 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="shrink-0">Last order: {item.lastOrder}</div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Customers"
      subtitle="View registered patron profiles, order frequencies, and lifetime commercial value."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {customers.length} patrons
        </span>
      }
      actions={
        <>
          <AdminButton
            variant="ghost"
            icon={RefreshCw}
            isLoading={loading}
            onClick={loadCustomers}
          >
            Refresh
          </AdminButton>
          <AdminButton
            variant="secondary"
            icon={Download}
            disabled={customers.length === 0}
            onClick={handleExport}
          >
            Export CSV
          </AdminButton>
        </>
      }
    >
      {loading ? (
        <TableSkeleton rows={5} />
      ) : customers.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No customer accounts registered"
          description="Customer records will appear here as patrons register accounts or place orders via guest checkout."
        />
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          searchPlaceholder="Search customer name or email..."
          searchKey="name"
          mobileCardRender={renderMobileCustomerCard}
        />
      )}
    </AdminPageLayout>
  );
}
