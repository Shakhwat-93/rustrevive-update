"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { useAdminDialog } from "@/context/admin-dialog-context";
import type { ReviewStatus } from "@/types/database.types";

interface ReviewRow {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  created_at: string;
  products?: { title: string; slug: string } | null;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Reviews", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      if (data?.data) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const { showToast } = useAdminDialog();

  const handleModerate = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status: newStatus }),
      });

      if (res.ok) {
        showToast(`Review marked as ${newStatus}`, "success");
        await fetchReviews();
      } else {
        showToast("Failed to update review status", "error");
      }
    } catch {
      showToast("Error updating review status.", "error");
    }
  };

  const columns: ColumnDef<ReviewRow>[] = [
    {
      key: "product",
      header: "Product & Customer",
      sortable: true,
      cell: (row: ReviewRow) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900">
            {row.products?.title || "Product"}
          </span>
          <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
            <span>{row.customer_name}</span>
            {row.is_verified_purchase && (
              <span className="inline-flex items-center text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                Verified
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      cell: (row: ReviewRow) => (
        <div className="flex items-center space-x-0.5 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < row.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: "content",
      header: "Review Content",
      cell: (row: ReviewRow) => (
        <div className="max-w-md">
          {row.title && (
            <div className="text-xs font-semibold text-slate-800 line-clamp-1">
              {row.title}
            </div>
          )}
          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
            {row.content}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row: ReviewRow) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Moderate",
      className: "text-right",
      cell: (row: ReviewRow) => (
        <div className="flex items-center justify-end space-x-1.5">
          {row.status !== "APPROVED" && (
            <button
              onClick={() => handleModerate(row.id, "APPROVED")}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              title="Approve Review"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {row.status !== "REJECTED" && (
            <button
              onClick={() => handleModerate(row.id, "REJECTED")}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Reject Review"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Mobile Review Card Render
  const renderMobileReviewCard = (row: ReviewRow) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-xs text-slate-900 truncate">
              {row.products?.title || "Product"}
            </h4>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
              <span>{row.customer_name}</span>
              {row.is_verified_purchase && (
                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={row.status} size="sm" />
        </div>

        <div className="flex items-center space-x-0.5 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < row.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
              }`}
            />
          ))}
        </div>

        {row.content && (
          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
            &ldquo;{row.content}&rdquo;
          </p>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-mono text-slate-400">
            {new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>

          <div className="flex items-center space-x-2">
            {row.status !== "APPROVED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModerate(row.id, "APPROVED");
                }}
                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )}
            {row.status !== "REJECTED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModerate(row.id, "REJECTED");
                }}
                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Product Reviews"
      subtitle="Moderate customer feedback, verify purchases, and approve storefront ratings."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {reviews.length} reviews
        </span>
      }
      actions={
        <AdminButton variant="secondary" icon={RefreshCw} onClick={fetchReviews} isLoading={loading}>
          Refresh
        </AdminButton>
      }
    >
      <DataTable
        columns={columns}
        data={reviews}
        filterTabs={STATUS_TABS}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
        mobileCardRender={renderMobileReviewCard}
      />
    </AdminPageLayout>
  );
}
