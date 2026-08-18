"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";

interface OrderRow {
  id: string;
  customerName: string;
  itemsCount: number;
  total: number;
  paymentStatus: "paid" | "pending" | "failed";
  fulfillmentStatus: "fulfilled" | "unfulfilled";
  deliveryMethod: string;
  createdAt: string;
}

const ORDERS_DATA: OrderRow[] = [
  { id: "RR-1025", customerName: "Tanvir Ahmed", itemsCount: 2, total: 17520, paymentStatus: "paid", fulfillmentStatus: "fulfilled", deliveryMethod: "Standard Nationwide", createdAt: "12 mins ago" },
  { id: "RR-1024", customerName: "Nafis Fuad", itemsCount: 1, total: 4560, paymentStatus: "pending", fulfillmentStatus: "unfulfilled", deliveryMethod: "Cash on Delivery", createdAt: "45 mins ago" },
  { id: "RR-1023", customerName: "Zarin Tasnim", itemsCount: 3, total: 22200, paymentStatus: "paid", fulfillmentStatus: "fulfilled", deliveryMethod: "Dhaka Express", createdAt: "2 hours ago" },
  { id: "RR-1022", customerName: "Farhan Kabir", itemsCount: 1, total: 6960, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", deliveryMethod: "Cash on Delivery", createdAt: "4 hours ago" },
  { id: "RR-1021", customerName: "Raisa Mehnaz", itemsCount: 2, total: 15120, paymentStatus: "paid", fulfillmentStatus: "fulfilled", deliveryMethod: "Standard Nationwide", createdAt: "Yesterday" },
  { id: "RR-1020", customerName: "Ahsan Habib", itemsCount: 4, total: 28400, paymentStatus: "paid", fulfillmentStatus: "fulfilled", deliveryMethod: "Dhaka Express", createdAt: "2 days ago" },
];

export default function AdminOrdersPage() {
  const [orders] = useState<OrderRow[]>(ORDERS_DATA);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const filterTabs = [
    { label: "All Orders", value: "ALL", count: orders.length },
    { label: "Unfulfilled", value: "UNFULFILLED", count: orders.filter((o) => o.fulfillmentStatus === "unfulfilled").length },
    { label: "Fulfilled", value: "FULFILLED", count: orders.filter((o) => o.fulfillmentStatus === "fulfilled").length },
  ];

  const filteredOrders =
    activeFilter === "ALL"
      ? orders
      : orders.filter((o) => o.fulfillmentStatus.toUpperCase() === activeFilter);

  const columns: ColumnDef<OrderRow>[] = [
    {
      key: "id",
      header: "Order",
      sortable: true,
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900">{item.id}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      cell: (item) => <span className="font-medium text-slate-800">{item.customerName}</span>,
    },
    {
      key: "paymentStatus",
      header: "Payment",
      sortable: true,
      cell: (item) => <StatusBadge status={item.paymentStatus} size="sm" />,
    },
    {
      key: "fulfillmentStatus",
      header: "Fulfillment",
      sortable: true,
      cell: (item) => <StatusBadge status={item.fulfillmentStatus} size="sm" />,
    },
    {
      key: "itemsCount",
      header: "Items",
      sortable: true,
      cell: (item) => <span className="text-slate-600">{item.itemsCount} items</span>,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right font-mono font-semibold text-slate-900">
          ৳{item.total.toLocaleString("en-US")}
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Orders"
      subtitle="Fulfill shipments, update tracking numbers, and process returns."
      actions={
        <AdminButton
          variant="secondary"
          icon={Download}
          onClick={() => alert("Exporting orders...")}
        >
          Export Orders
        </AdminButton>
      }
    >
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchPlaceholder="Search order #, customer..."
        searchKey="customerName"
        filterTabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </AdminPageLayout>
  );
}
