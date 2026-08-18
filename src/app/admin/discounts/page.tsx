"use client";

import React, { useState } from "react";
import { Percent, Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";

interface DiscountRow {
  id: string;
  code: string;
  type: string;
  value: string;
  status: "active" | "draft" | "archived";
  usageCount: number;
  minOrder: string;
}

const DISCOUNTS_DATA: DiscountRow[] = [
  { id: "d-1", code: "RUST10", type: "Percentage", value: "10% off", status: "active", usageCount: 42, minOrder: "৳3,000" },
  { id: "d-2", code: "FREESHIPBD", type: "Free Shipping", value: "Free Nationwide Delivery", status: "active", usageCount: 88, minOrder: "৳5,000" },
  { id: "d-3", code: "VIPRAW20", type: "Fixed Amount", value: "৳1,000 off", status: "draft", usageCount: 0, minOrder: "৳10,000" },
];

export default function AdminDiscountsPage() {
  const [discounts] = useState<DiscountRow[]>(DISCOUNTS_DATA);

  const columns: ColumnDef<DiscountRow>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      cell: (item) => (
        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
          {item.code}
        </span>
      ),
    },
    {
      key: "value",
      header: "Discount Value",
      sortable: true,
      cell: (item) => <span className="font-medium text-slate-800">{item.value}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: "minOrder",
      header: "Minimum Spend",
      cell: (item) => <span className="text-slate-600 font-mono">{item.minOrder}</span>,
    },
    {
      key: "usageCount",
      header: "Times Used",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right font-mono text-slate-700">{item.usageCount} uses</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Discounts</h1>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500">
            Create coupon codes, automatic cart discounts, and free shipping triggers.
          </p>
        </div>

        <button
          onClick={() => alert("Create Discount modal")}
          className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Discount</span>
        </button>
      </div>

      <DataTable
        data={discounts}
        columns={columns}
        searchPlaceholder="Search discount code..."
        searchKey="code"
      />
    </div>
  );
}
