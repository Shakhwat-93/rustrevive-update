"use client";

import React, { useState } from "react";
import { Users, Download } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers</h1>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500">
            View customer order histories, lifetime value, and profiles.
          </p>
        </div>

        <button
          onClick={() => alert("Exporting customer profiles to CSV...")}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers</span>
        </button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        searchPlaceholder="Search customer name or email..."
        searchKey="name"
      />
    </div>
  );
}
