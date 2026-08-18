"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Download, Upload } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { FEATURED_PRODUCTS } from "@/data/homepage.data";

interface AdminProductRow {
  id: string;
  title: string;
  category: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  status: "active" | "draft" | "archived";
  imageUrl: string;
}

const INITIAL_PRODUCTS: AdminProductRow[] = FEATURED_PRODUCTS.map((p, idx) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  sku: `RR-${p.category.slice(0, 3).toUpperCase()}-00${idx + 1}`,
  price: Math.round(p.priceCents * 1.2),
  compareAtPrice: p.compareAtPriceCents ? Math.round(p.compareAtPriceCents * 1.2) : undefined,
  inventory: idx === 2 ? 2 : idx === 0 ? 3 : 24,
  status: idx === 1 ? "draft" : "active",
  imageUrl: p.imageUrl,
}));

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductRow[]>(INITIAL_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const filterTabs = [
    { label: "All", value: "ALL", count: products.length },
    {
      label: "Active",
      value: "ACTIVE",
      count: products.filter((p) => p.status === "active").length,
    },
    {
      label: "Draft",
      value: "DRAFT",
      count: products.filter((p) => p.status === "draft").length,
    },
    {
      label: "Archived",
      value: "ARCHIVED",
      count: products.filter((p) => p.status === "archived").length,
    },
  ];

  const filteredProducts =
    activeFilter === "ALL"
      ? products
      : products.filter((p) => p.status.toUpperCase() === activeFilter);

  // Bulk Operations
  const handleBulkStatusChange = (selectedIds: string[], status: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id)
          ? { ...p, status: status.toLowerCase() as "active" | "draft" | "archived" }
          : p
      )
    );
  };

  const handleBulkArchive = (selectedIds: string[]) => {
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, status: "archived" } : p
      )
    );
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    }
  };

  const columns: ColumnDef<AdminProductRow>[] = [
    {
      key: "title",
      header: "Product",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center space-x-3 py-1">
          <div className="relative w-10 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="40px"
              className="object-cover object-center"
            />
          </div>
          <div>
            <div className="font-medium text-slate-900 line-clamp-1">{item.title}</div>
            <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: "inventory",
      header: "Inventory",
      sortable: true,
      cell: (item) => (
        <span
          className={`font-mono font-medium ${
            item.inventory <= 3 ? "text-rose-600 font-semibold" : "text-slate-700"
          }`}
        >
          {item.inventory} in stock
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (item) => <span className="text-slate-600">{item.category}</span>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      className: "text-right",
      cell: (item) => (
        <div className="text-right font-mono font-semibold text-slate-900">
          ৳{item.price.toLocaleString("en-US")}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-xs text-slate-500">
            Manage garment catalog, variants, pricing, and stock levels.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => alert("Exporting product catalog to CSV...")}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => alert("Product CSV Import is ready.")}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <Link
            href="/admin/products/new"
            className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* High-Performance Product DataTable */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        searchPlaceholder="Filter products by title, SKU, category..."
        searchKey="title"
        filterTabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRowClick={(item) => router.push(`/admin/products/${item.id}`)}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
