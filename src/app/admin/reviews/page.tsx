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

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "ALL">("ALL");

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

  const handleModerate = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status: newStatus }),
      });

      if (res.ok) {
        await fetchReviews();
      }
    } catch {
      alert("Error updating review status.");
    }
  };

  const columns: ColumnDef<ReviewRow>[] = [
    {
      key: "product",
      header: "Product & Customer",
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
      cell: (row: ReviewRow) => (
        <div className="flex items-center space-x-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < row.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
              }`}
            />
          ))}
          <span className="text-xs font-mono font-bold text-slate-800 ml-1">
            {row.rating}.0
          </span>
        </div>
      ),
    },
    {
      key: "content",
      header: "Feedback",
      cell: (row: ReviewRow) => (
        <div className="max-w-md">
          {row.title && <p className="text-xs font-bold text-slate-800">{row.title}</p>}
          <p className="text-xs text-slate-600 line-clamp-2">{row.content}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: ReviewRow) => <StatusBadge status={row.status.toLowerCase()} />,
    },
    {
      key: "actions",
      header: "Moderation",
      cell: (row: ReviewRow) => (
        <div className="flex items-center space-x-1">
          {row.status !== "APPROVED" && (
            <button
              onClick={() => handleModerate(row.id, "APPROVED")}
              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded text-xs font-mono flex items-center space-x-1"
              title="Approve Review"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
          )}
          {row.status !== "REJECTED" && (
            <button
              onClick={() => handleModerate(row.id, "REJECTED")}
              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded text-xs font-mono flex items-center space-x-1"
              title="Reject Review"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Product Reviews Moderation"
      subtitle="Inspect customer ratings, verified purchase flags, and moderate public catalog reviews."
      actions={
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchReviews}
        >
          Refresh Reviews
        </AdminButton>
      }
    >
      <div className="bg-white border border-slate-200 p-4 rounded-md space-y-3">
        <div className="flex items-center space-x-1 border-b border-slate-100 pb-2">
          {[
            { label: "All Reviews", value: "ALL" },
            { label: "Pending Moderation", value: "PENDING" },
            { label: "Approved (Public)", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as ReviewStatus | "ALL")}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeTab === tab.value
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
      />
    </AdminPageLayout>
  );
}
