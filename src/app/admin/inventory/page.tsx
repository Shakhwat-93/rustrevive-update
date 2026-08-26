"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package, Plus, Minus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { useAdminRealtime } from "@/context/admin-realtime-context";

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
  const { onNewOrder, onOrderUpdate } = useAdminRealtime();
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const { showToast } = useAdminDialog();

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

  // Realtime updates for inventory on new orders or cancellations
  useEffect(() => {
    const unsubNew = onNewOrder(() => {
      loadInventory();
    });

    const unsubUpdate = onOrderUpdate(() => {
      loadInventory();
    });

    return () => {
      unsubNew();
      unsubUpdate();
    };
  }, [onNewOrder, onOrderUpdate, loadInventory]);

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
        showToast(json.error?.message || "Adjustment failed", "error");
        return;
      }

      showToast(`Stock updated (${delta > 0 ? "+" : ""}${delta})`, "success");
      await loadInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Adjustment error";
      showToast(`Error: ${msg}`, "error");
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
            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer transition-colors disabled:opacity-40"
            aria-label="Decrease stock"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-semibold text-slate-900 w-8 text-center">
            {item.available}
          </span>
          <button
            disabled={adjustingId === item.id}
            onClick={() => handleAdjust(item.id, 1)}
            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer transition-colors disabled:opacity-40"
            aria-label="Increase stock"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ];

  // Mobile Inventory Card Render
  const renderMobileInventoryCard = (item: InventoryRow) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-xs text-slate-900 truncate">
              {item.productName}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 mt-0.5">
              <span>{item.sku}</span>
              <span>•</span>
              <span>{item.variant}</span>
            </div>
          </div>
          <StatusBadge status={item.status} size="sm" />
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs font-mono">
          <div className="text-slate-500">
            Reserved: <strong className="text-slate-700">{item.reserved}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-[11px]">Available:</span>
            <button
              disabled={adjustingId === item.id || item.available <= 0}
              onClick={(e) => {
                e.stopPropagation();
                handleAdjust(item.id, -1);
              }}
              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 shrink-0"
              aria-label="Decrease stock"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-slate-900 w-6 text-center text-sm">
              {item.available}
            </span>
            <button
              disabled={adjustingId === item.id}
              onClick={(e) => {
                e.stopPropagation();
                handleAdjust(item.id, 1);
              }}
              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 shrink-0"
              aria-label="Increase stock"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Inventory"
      subtitle="Track available vs. reserved stock levels and log atomic inventory movements."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {inventory.length} items
        </span>
      }
      actions={
        <AdminButton variant="secondary" icon={RefreshCw} onClick={loadInventory} isLoading={loading}>
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
          mobileCardRender={renderMobileInventoryCard}
        />
      )}
    </AdminPageLayout>
  );
}
