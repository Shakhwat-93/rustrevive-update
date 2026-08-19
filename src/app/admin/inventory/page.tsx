"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";

interface InventoryRow {
  id: string;
  sku: string;
  productName: string;
  variant: string;
  available: number;
  reserved: number;
  status: "active" | "low_stock" | "out_of_stock";
}

interface RawInventoryItem {
  id: string;
  quantity?: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  products?: { title?: string; sku?: string };
  product_variants?: { title?: string; sku?: string };
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory");
      const json = await res.json();
      if (json.success && json.data) {
        const mapped: InventoryRow[] = (json.data.items || []).map((item: RawInventoryItem) => {
          const avail = item.quantity || 0;
          const status = avail === 0 ? "out_of_stock" : avail <= (item.low_stock_threshold || 3) ? "low_stock" : "active";
          return {
            id: item.id,
            sku: item.product_variants?.sku || item.products?.sku || "N/A",
            productName: item.products?.title || "Unknown Product",
            variant: item.product_variants?.title || "Standard",
            available: avail,
            reserved: item.reserved_quantity || 0,
            status,
          };
        });
        setInventory(mapped);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleAdjust = async (id: string, delta: number) => {
    try {
      setAdjustingId(id);
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory_id: id,
          quantity_change: delta,
          movement_type: delta > 0 ? "RESTOCK" : "MANUAL_ADJUSTMENT",
          reason: "Manual adjustment via Admin Panel",
          actor_name: "Admin",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error?.message || "Adjustment failed");
        return;
      }

      await loadInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Adjustment error";
      alert(`Error: ${msg}`);
    } finally {
      setAdjustingId(null);
    }
  };

  const columns: ColumnDef<InventoryRow>[] = [
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      cell: (item) => <span className="font-mono font-semibold text-slate-900">{item.sku}</span>,
    },
    {
      key: "productName",
      header: "Product & Variant",
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.productName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{item.variant}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Stock Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: "reserved",
      header: "Reserved",
      sortable: true,
      cell: (item) => <span className="font-mono text-slate-500">{item.reserved}</span>,
    },
    {
      key: "available",
      header: "Available Count",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center space-x-2">
          <button
            disabled={adjustingId === item.id || item.available <= 0}
            onClick={() => handleAdjust(item.id, -1)}
            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer transition-colors disabled:opacity-40"
          >
            -
          </button>
          <span className="font-mono font-semibold text-slate-900 w-8 text-center">
            {item.available}
          </span>
          <button
            disabled={adjustingId === item.id}
            onClick={() => handleAdjust(item.id, 1)}
            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer transition-colors disabled:opacity-40"
          >
            +
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Inventory"
      subtitle="Track available vs. reserved stock levels and log atomic inventory movements."
      actions={
        <AdminButton variant="ghost" icon={RefreshCw} onClick={loadInventory}>
          Refresh
        </AdminButton>
      }
    >
      {loading ? (
        <TableSkeleton rows={5} />
      ) : inventory.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No inventory records"
          description="Inventory rows will be automatically generated whenever products or variants are created."
          actionText="Add Product"
          actionHref="/admin/products/new"
        />
      ) : (
        <DataTable
          data={inventory}
          columns={columns}
          searchPlaceholder="Search by SKU, product name..."
          searchKey="productName"
        />
      )}
    </AdminPageLayout>
  );
}
