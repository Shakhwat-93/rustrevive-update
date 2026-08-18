"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  location: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
}

const CUSTOMERS_DATA: CustomerRow[] = [
  { id: "c-1", name: "Tanvir Ahmed", email: "tanvir@example.com", location: "Dhaka", ordersCount: 3, totalSpent: 38400, lastOrder: "Today" },
  { id: "c-2", name: "Zarin Tasnim", email: "zarin@example.com", location: "Chittagong", ordersCount: 5, totalSpent: 62500, lastOrder: "Yesterday" },
  { id: "c-3", name: "Nafis Fuad", email: "nafis@example.com", location: "Sylhet", ordersCount: 1, totalSpent: 4560, lastOrder: "3 days ago" },
  { id: "c-4", name: "Farhan Kabir", email: "farhan@example.com", location: "Dhaka", ordersCount: 2, totalSpent: 18200, lastOrder: "1 week ago" },
  { id: "c-5", name: "Raisa Mehnaz", email: "raisa@example.com", location: "Rajshahi", ordersCount: 2, totalSpent: 26120, lastOrder: "2 weeks ago" },
];

export default function AdminCustomersPage() {
  const [customers] = useState<CustomerRow[]>(CUSTOMERS_DATA);

  const columns: ColumnDef<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-900">{item.name}</div>
          <div className="text-[11px] text-slate-400 font-mono">{item.email}</div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      cell: (item) => <span className="text-slate-600">{item.location}</span>,
    },
    {
      key: "ordersCount",
      header: "Orders",
      sortable: true,
      cell: (item) => <span className="font-mono text-slate-700">{item.ordersCount} orders</span>,
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

  return (
    <AdminPageLayout
      title="Customers"
      subtitle="View customer order histories, profiles, and lifetime value."
      actions={
        <AdminButton
          variant="secondary"
          icon={Download}
          onClick={() => alert("Exporting customers...")}
        >
          Export Customers
        </AdminButton>
      }
    >
      <DataTable
        data={customers}
        columns={columns}
        searchPlaceholder="Search customer name or email..."
        searchKey="name"
      />
    </AdminPageLayout>
  );
}
