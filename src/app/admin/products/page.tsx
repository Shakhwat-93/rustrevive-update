"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Download, RefreshCw, Package, Edit } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";
import { useAdminDialog } from "@/context/admin-dialog-context";

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

interface RawProductData {
  id: string;
  title: string;
  sku: string;
  status: string;
  base_price: number;
  compare_at_price?: number;
  categories?: { name?: string };
  product_media?: Array<{ is_primary?: boolean; media?: { public_url?: string } }>;
  inventory?: Array<{ quantity?: number }>;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const { exportToCSV } = useAdminDialog();

  const handleExport = () => {
    const headers = ["Product ID", "Title", "Category", "SKU", "Price (BDT)", "Stock Available", "Status"];
    const rows = products.map((p) => [
      p.id,
      p.title,
      p.category,
      p.sku,
      p.price,
      p.inventory,
      p.status,
    ]);
    exportToCSV("rust_revive_products", headers, rows);
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== "ALL") params.set("status", activeFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const mapped: AdminProductRow[] = (json.data.products || []).map((p: RawProductData) => {
          const primaryMedia = p.product_media?.find((pm) => pm.is_primary) || p.product_media?.[0];
          const totalInv = (p.inventory || []).reduce((acc: number, inv) => acc + (inv.quantity || 0), 0);
          return {
            id: p.id,
            title: p.title,
            category: p.categories?.name || "Uncategorized",
            sku: p.sku,
            price: p.base_price,
            compareAtPrice: p.compare_at_price,
            inventory: totalInv,
            status: p.status.toLowerCase() as "active" | "draft" | "archived",
            imageUrl: primaryMedia?.media?.public_url || "https://pub-90e6c63b53cb4c518fdafb3bfeb44169.r2.dev/placeholder.webp",
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filterTabs = [
    { label: "All Products", value: "ALL", count: products.length },
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
              unoptimized
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
      cell: (item) => <span className="text-slate-600 font-medium">{item.category}</span>,
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

  // Mobile Product Card Render
  const renderMobileProductCard = (
    item: AdminProductRow,
    isSelected: boolean,
    toggleSelect: (e: React.SyntheticEvent) => void
  ) => {
    return (
      <div className="flex items-center space-x-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={toggleSelect}
          className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
        />

        {/* Thumbnail */}
        <div className="relative w-14 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="56px"
            className="object-cover object-center"
            unoptimized
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-semibold text-xs text-slate-900 truncate leading-tight">
              {item.title}
            </h4>
            <StatusBadge status={item.status} size="sm" />
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
            <span>{item.category}</span>
            <span>•</span>
            <span className={item.inventory <= 3 ? "text-rose-600 font-bold" : ""}>
              {item.inventory} in stock
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="font-mono text-xs font-bold text-slate-900">
              ৳{item.price.toLocaleString("en-US")}
            </div>
            <Link
              href={`/admin/products/${item.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-[#9e472a] hover:underline flex items-center space-x-0.5"
            >
              <Edit className="w-3 h-3" />
              <span>Edit</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Products"
      subtitle="Manage product catalog, variants, pricing, images, and stock levels."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {products.length} items
        </span>
      }
      actions={
        <>
          <AdminButton variant="ghost" icon={RefreshCw} onClick={loadProducts}>
            Refresh
          </AdminButton>

          <AdminButton
            variant="secondary"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </AdminButton>

          <AdminButton href="/admin/products/new" icon={Plus}>
            Add Product
          </AdminButton>
        </>
      }
    >
      {loading ? (
        <TableSkeleton rows={5} />
      ) : products.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No products found"
          description="Your product catalog is empty. Add your first product with images, pricing, and sizes to begin selling."
          actionText="Add Product"
          actionHref="/admin/products/new"
        />
      ) : (
        <DataTable
          data={products}
          columns={columns}
          searchPlaceholder="Filter products by title, SKU, category..."
          searchKey="title"
          filterTabs={filterTabs}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          mobileCardRender={renderMobileProductCard}
          onRowClick={(item) => router.push(`/admin/products/${item.id}`)}
        />
      )}
    </AdminPageLayout>
  );
}
