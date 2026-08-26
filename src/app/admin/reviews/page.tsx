"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trash2,
  Eye,
  Search,
  AlertTriangle,
  X,
  MessageSquare,
  Clock,
  Check,
  ShoppingBag,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { getMediaUrl } from "@/lib/media/media-url";
import type { ReviewStatus } from "@/types/database.types";

interface ReviewRow {
  id: string;
  product_id: string;
  variant_id?: string | null;
  customer_id?: string | null;
  customer_name: string;
  order_id?: string | null;
  rating: number;
  title: string | null;
  content: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    title: string;
    slug: string;
    sku: string;
    base_price: number;
    product_media?: {
      is_primary: boolean;
      media?: { public_url?: string } | null;
    }[];
  } | null;
  orders?: {
    id: string;
    order_number: string;
    grand_total: number;
  } | null;
}

interface StatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");

  // Modal / Drawer state
  const [inspectReview, setInspectReview] = useState<ReviewRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { showToast } = useAdminDialog();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (selectedRating !== "ALL") params.set("rating", selectedRating);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      if (data?.data) {
        setReviews(data.data.reviews || []);
        if (data.data.counts) {
          setCounts(data.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      showToast("Failed to fetch reviews from database.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedRating, searchQuery, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      setActionLoadingId(reviewId);
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status: newStatus }),
      });

      if (res.ok) {
        showToast(
          newStatus === "APPROVED"
            ? "Review approved and published to storefront."
            : "Review marked as rejected.",
          "success"
        );
        if (inspectReview?.id === reviewId) {
          setInspectReview((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        await fetchReviews();
      } else {
        showToast("Failed to update review status.", "error");
      }
    } catch {
      showToast("Error updating review moderation status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteConfirmId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/reviews?id=${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Review permanently deleted from database.", "success");
        setDeleteConfirmId(null);
        if (inspectReview?.id === deleteConfirmId) {
          setInspectReview(null);
        }
        await fetchReviews();
      } else {
        showToast("Failed to delete review.", "error");
      }
    } catch {
      showToast("Error executing database deletion.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusTabs = [
    { label: "All Reviews", value: "ALL", count: counts.all },
    { label: "Pending", value: "PENDING", count: counts.pending, isPending: true },
    { label: "Approved", value: "APPROVED", count: counts.approved },
    { label: "Rejected", value: "REJECTED", count: counts.rejected },
  ];

  return (
    <AdminPageLayout
      title="Customer Reviews"
      subtitle="Moderate patron feedback, verify orders, and control live storefront ratings."
      badge={
        <span className="text-[11px] font-mono bg-[#f4eee3] text-[#141312] border border-[#ded7c8] px-2.5 py-0.5 rounded-full font-bold">
          {counts.all} total &bull; {counts.pending} pending
        </span>
      }
      actions={
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          onClick={fetchReviews}
          isLoading={loading}
        >
          Refresh
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* 1. KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Reviews</span>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{counts.all}</p>
          </div>

          <div
            onClick={() => setActiveTab("PENDING")}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
              activeTab === "PENDING"
                ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white border-slate-200 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
              <span>Awaiting Moderation</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-900">{counts.pending}</p>
          </div>

          <div
            onClick={() => setActiveTab("APPROVED")}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
              activeTab === "APPROVED"
                ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-white border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
              <span>Live on Storefront</span>
              <Check className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-900">{counts.approved}</p>
          </div>

          <div
            onClick={() => setActiveTab("REJECTED")}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
              activeTab === "REJECTED"
                ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-slate-200 hover:border-rose-300"
            }`}
          >
            <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
              <span>Rejected / Hidden</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-900">{counts.rejected}</p>
          </div>
        </div>

        {/* 2. Status Filter Tabs & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === tab.value
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                      tab.isPending && tab.count > 0
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Rating Filter Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <label className="text-xs text-slate-500 font-medium">Rating:</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
              >
                <option value="ALL">All Stars (1–5★)</option>
                <option value="5">5 Stars only</option>
                <option value="4">4 Stars only</option>
                <option value="3">3 Stars only</option>
                <option value="2">2 Stars only</option>
                <option value="1">1 Star only</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, product title, or review text..."
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 3. Reviews Table & Listing */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500">Loading reviews from database...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">No reviews found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No customer reviews match the selected tab and filters. When patrons submit reviews on the storefront, they will appear here for moderation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Garment / Product</th>
                    <th className="py-3 px-4">Reviewer</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Feedback Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((row) => {
                    const primaryMedia = row.products?.product_media?.find((m) => m.is_primary) || row.products?.product_media?.[0];
                    const imgUrl = getMediaUrl(primaryMedia?.media?.public_url) || "/placeholder-garment.webp";

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setInspectReview(row)}
                      >
                        {/* Product Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-12 bg-slate-100 border border-slate-200 rounded-sm overflow-hidden shrink-0">
                              <Image
                                src={imgUrl}
                                alt={row.products?.title || "Product"}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[180px]">
                                {row.products?.title || "Garment"}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500">
                                {row.products?.sku || "SKU N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Customer Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900">{row.customer_name}</p>
                            {row.is_verified_purchase ? (
                              <span className="inline-flex items-center text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                                Verified Buyer
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Store Patron</span>
                            )}
                          </div>
                        </td>

                        {/* Rating Column */}
                        <td className="py-3.5 px-4">
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
                        </td>

                        {/* Feedback Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {row.title && (
                            <p className="font-bold text-slate-900 truncate">{row.title}</p>
                          )}
                          <p className="text-slate-600 line-clamp-2 mt-0.5 text-[11px] leading-relaxed">
                            {row.content}
                          </p>
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={row.status} size="sm" />
                        </td>

                        {/* Date Column */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions Column */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => setInspectReview(row)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                              title="Inspect Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {row.status !== "APPROVED" && (
                              <button
                                type="button"
                                disabled={actionLoadingId === row.id}
                                onClick={() => handleModerate(row.id, "APPROVED")}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Approve & Publish"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {row.status !== "REJECTED" && (
                              <button
                                type="button"
                                disabled={actionLoadingId === row.id}
                                onClick={() => handleModerate(row.id, "REJECTED")}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(row.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Full Review Detail Drawer / Modal */}
      {inspectReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative animate-fade-in">
            <button
              type="button"
              onClick={() => setInspectReview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusBadge status={inspectReview.status} size="sm" />
                {inspectReview.is_verified_purchase && (
                  <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified Buyer
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">Review Moderation Details</h3>
            </div>

            {/* Product Meta */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
              <div className="relative w-12 h-14 bg-white border border-slate-200 rounded-sm overflow-hidden shrink-0">
                <Image
                  src={
                    getMediaUrl(
                      inspectReview.products?.product_media?.find((m) => m.is_primary)?.media?.public_url ||
                        inspectReview.products?.product_media?.[0]?.media?.public_url
                    ) || "/placeholder-garment.webp"
                  }
                  alt={inspectReview.products?.title || "Product"}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">
                  {inspectReview.products?.title || "Garment"}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  SKU: {inspectReview.products?.sku || "N/A"}
                </p>
                {inspectReview.orders && (
                  <p className="text-[10px] font-mono text-slate-500 flex items-center space-x-1 mt-0.5">
                    <ShoppingBag className="w-2.5 h-2.5 text-slate-400" />
                    <span>Order #{inspectReview.orders.order_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Rating & Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < inspectReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="font-bold text-xs font-mono text-slate-800 ml-1.5">
                    {inspectReview.rating}.0 / 5.0
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(inspectReview.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">Reviewer Name</p>
                <p className="text-sm font-bold text-slate-900">{inspectReview.customer_name}</p>
              </div>

              {inspectReview.title && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Review Title</p>
                  <p className="text-sm font-bold text-slate-900">{inspectReview.title}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Feedback Content</p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                  {inspectReview.content}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(inspectReview.id)}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center space-x-2">
                {inspectReview.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => handleModerate(inspectReview.id, "REJECTED")}
                    className="px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Reject Review
                  </button>
                )}
                {inspectReview.status !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => handleModerate(inspectReview.id, "APPROVED")}
                    className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1 font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve &amp; Publish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Permanent Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Delete Review Permanently?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                This action will delete the review directly from the database. It cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePermanent}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
