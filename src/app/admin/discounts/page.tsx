"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";

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
    <AdminPageLayout
      title="Discounts"
      subtitle="Create coupon codes, automatic cart discounts, and free delivery thresholds."
      actions={
        <AdminButton icon={Plus} onClick={() => alert("Create Discount modal")}>
          Create Discount
        </AdminButton>
      }
    >
      <DataTable
        data={discounts}
        columns={columns}
        searchPlaceholder="Search discount code..."
        searchKey="code"
      />
    </AdminPageLayout>
  );
}
