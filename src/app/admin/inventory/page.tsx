"use client";

import React, { useState } from "react";
import { Boxes } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";

interface InventoryRow {
  id: string;
  sku: string;
  productName: string;
  variant: string;
  available: number;
  reserved: number;
  status: "active" | "low_stock" | "out_of_stock";
}

const INVENTORY_DATA: InventoryRow[] = [
  { id: "inv-1", sku: "RR-PNT-001-S", productName: "Wide Leg Pleated Sweatpants", variant: "Size S / Charcoal", available: 6, reserved: 1, status: "active" },
  { id: "inv-2", sku: "RR-PNT-001-M", productName: "Wide Leg Pleated Sweatpants", variant: "Size M / Charcoal", available: 3, reserved: 2, status: "low_stock" },
  { id: "inv-3", sku: "RR-DNM-002-32", productName: "FB Sister Unisex Baggy Jeans", variant: "Size 32 / Raw Indigo", available: 12, reserved: 0, status: "active" },
  { id: "inv-4", sku: "RR-JKT-003-L", productName: "Vintage Washed Aviator Jacket", variant: "Size L / Cognac", available: 2, reserved: 1, status: "low_stock" },
  { id: "inv-5", sku: "RR-TEE-004-XL", productName: "280GSM Heavy Boxy Tee", variant: "Size XL / Faded Rust", available: 1, reserved: 0, status: "low_stock" },
  { id: "inv-6", sku: "RR-BLT-005-32", productName: "Vegetable Tanned Leather Belt", variant: "Size 32 / Saddle Brown", available: 18, reserved: 3, status: "active" },
];

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>(INVENTORY_DATA);

  const handleAdjust = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextAvail = Math.max(0, item.available + delta);
        return {
          ...item,
          available: nextAvail,
          status: nextAvail === 0 ? "out_of_stock" : nextAvail <= 3 ? "low_stock" : "active",
        };
      })
    );
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
            onClick={() => handleAdjust(item.id, -1)}
            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer"
          >
            -
          </button>
          <span className="font-mono font-semibold text-slate-900 w-8 text-center">
            {item.available}
          </span>
          <button
            onClick={() => handleAdjust(item.id, 1)}
            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-mono cursor-pointer"
          >
            +
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <Boxes className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-xs text-slate-500">
          Track stock levels, reserve allocations, and log inventory movements.
        </p>
      </div>

      <DataTable
        data={inventory}
        columns={columns}
        searchPlaceholder="Search by SKU, product name..."
        searchKey="productName"
      />
    </div>
  );
}
