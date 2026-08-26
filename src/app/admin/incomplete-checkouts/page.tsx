"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { KPICard } from "@/components/admin/ui/kpi-card";

interface IncompleteCheckoutItem {
  id: string;
  checkout_session_id: string;
  cart_session_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  city: string | null;
  area: string | null;
  postal_code: string | null;
  cart_snapshot: Array<{
    productId: string;
    variantId?: string | null;
    title: string;
    variantTitle?: string | null;
    sku: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
    lineTotal: number;
  }>;
  item_count: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  estimated_total: number;
  shipping_method_id: string | null;
  coupon_code: string | null;
  customer_notes: string | null;
  status: "IN_PROGRESS" | "ABANDONED" | "CONVERTED" | "EXPIRED";
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  converted_order_id: string | null;
  convertedOrder?: {
    id: string;
    order_number: string;
    grand_total: number;
    status: string;
  } | null;
}

export default function IncompleteCheckoutsAdminPage() {
  const [checkouts, setCheckouts] = useState<IncompleteCheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCheckout, setSelectedCheckout] = useState<IncompleteCheckoutItem | null>(null);

  const [kpi, setKpi] = useState({
    total: 0,
    inProgress: 0,
    abandoned: 0,
    converted: 0,
    expired: 0,
    abandonedValue: 0,
    convertedValue: 0,
    recoveryRate: 0,
  });

  const loadCheckouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: page.toString(),
        limit: "15",
      });
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/incomplete-checkouts?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setCheckouts(json.data.checkouts || []);
        setTotalPages(json.data.totalPages || 1);
        setTotalCount(json.data.total || 0);
        if (json.data.kpi) {
          setKpi(json.data.kpi);
        }
      }
    } catch (err) {
      console.error("Failed to load incomplete checkouts:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, searchQuery]);

  useEffect(() => {
    loadCheckouts();
  }, [loadCheckouts]);

  const handleOpenDetail = async (item: IncompleteCheckoutItem) => {
    setSelectedCheckout(item);
    try {
      const res = await fetch(`/api/admin/incomplete-checkouts/${item.id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setSelectedCheckout(json.data);
      }
    } catch (err) {
      console.error("Failed to load checkout detail:", err);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this incomplete checkout record?")) return;

    try {
      const res = await fetch(`/api/admin/incomplete-checkouts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCheckouts((prev) => prev.filter((c) => c.id !== id));
        if (selectedCheckout?.id === id) {
          setSelectedCheckout(null);
        }
        loadCheckouts();
      }
    } catch (err) {
      console.error("Failed to delete incomplete checkout:", err);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  const getStatusBadge = (status: IncompleteCheckoutItem["status"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
            In Progress
          </span>
        );
      case "ABANDONED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Abandoned
          </span>
        );
      case "CONVERTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Converted ✓
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminPageLayout
      title="Incomplete Checkouts"
      subtitle="Track, analyze, and recover customers who initiated checkout but have not completed their order."
      actions={
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={loadCheckouts}
            className="p-2 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Incomplete"
            value={kpi.total.toString()}
            icon={Clock}
            subtitle={`${kpi.inProgress} currently active`}
          />
          <KPICard
            title="Abandoned"
            value={kpi.abandoned.toString()}
            icon={AlertCircle}
            subtitle={`৳${kpi.abandonedValue.toLocaleString()} potential value`}
          />
          <KPICard
            title="Converted Orders"
            value={kpi.converted.toString()}
            icon={CheckCircle2}
            subtitle={`৳${kpi.convertedValue.toLocaleString()} recovered revenue`}
          />
          <KPICard
            title="Recovery Rate"
            value={`${kpi.recoveryRate}%`}
            icon={TrendingUp}
            subtitle="Checkout conversion efficiency"
          />
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { key: "ALL", label: "All Attempts", count: kpi.total },
                { key: "IN_PROGRESS", label: "In Progress", count: kpi.inProgress },
                { key: "ABANDONED", label: "Abandoned", count: kpi.abandoned },
                { key: "CONVERTED", label: "Converted", count: kpi.converted },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                    activeTab === tab.key
                      ? "bg-[#141312] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search customer, phone..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#9e472a] transition-colors"
              />
            </div>
          </div>

          {/* Table List */}
          <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Estimated Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Last Activity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                      <span>Loading incomplete checkouts...</span>
                    </td>
                  </tr>
                ) : checkouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="font-semibold text-slate-700">No Incomplete Checkouts Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When customers enter details during checkout without completing, they will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  checkouts.map((c) => {
                    const firstItem = c.cart_snapshot?.[0];
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleOpenDetail(c)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold text-[10px]">
                              {c.customer_name ? c.customer_name[0]?.toUpperCase() : "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {c.customer_name || "Anonymous Guest"}
                              </p>
                              {c.city && (
                                <p className="text-[10px] text-slate-400 truncate">{c.city}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-slate-700">
                          {c.customer_phone ? (
                            <p className="font-medium text-slate-900">{c.customer_phone}</p>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No phone</span>
                          )}
                          {c.customer_email && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.customer_email}</p>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex items-center space-x-2">
                            {firstItem?.imageUrl && (
                              <div className="w-6 h-8 bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0">
                                <Image
                                  src={firstItem.imageUrl}
                                  alt={firstItem.title}
                                  fill
                                  className="object-cover"
                                  sizes="30px"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 line-clamp-1">
                                {c.item_count} {c.item_count === 1 ? "item" : "items"}
                              </p>
                              {firstItem && (
                                <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                  {firstItem.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ৳{Number(c.estimated_total).toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatRelativeTime(c.last_activity_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(c);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(c.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-500">
              <span>
                Showing {checkouts.length} of {totalCount} records
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedCheckout && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedCheckout(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-20">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    Checkout Session
                  </h3>
                  {getStatusBadge(selectedCheckout.status)}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-xs">
                  {selectedCheckout.checkout_session_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCheckout(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Converted Order Banner */}
              {selectedCheckout.status === "CONVERTED" && selectedCheckout.convertedOrder && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900 font-mono">
                        Converted to Order #{selectedCheckout.convertedOrder.order_number}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-mono">
                        Total ৳{selectedCheckout.convertedOrder.grand_total.toLocaleString()} • Status: {selectedCheckout.convertedOrder.status}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/orders/${selectedCheckout.convertedOrder.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-mono font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0"
                  >
                    <span>View Order</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Customer Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
                  Customer Contact & Shipping
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {selectedCheckout.customer_name || "Guest (Name not entered)"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCheckout.customer_phone ? (
                      <a
                        href={`tel:${selectedCheckout.customer_phone}`}
                        className="text-[#9e472a] hover:underline"
                      >
                        {selectedCheckout.customer_phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCheckout.customer_email ? (
                      <a
                        href={`mailto:${selectedCheckout.customer_email}`}
                        className="text-slate-700 hover:underline"
                      >
                        {selectedCheckout.customer_email}
                      </a>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </div>

                  {selectedCheckout.shipping_address && (
                    <div className="flex items-start space-x-2 text-slate-700 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-800 leading-relaxed">
                        {selectedCheckout.shipping_address}
                        {selectedCheckout.city && `, ${selectedCheckout.city}`}
                      </span>
                    </div>
                  )}

                  {selectedCheckout.customer_notes && (
                    <div className="flex items-start space-x-2 text-slate-700 pt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600 italic">
                        "{selectedCheckout.customer_notes}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Snapshot Items */}
              <div className="space-y-3 font-mono">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] text-xs">
                  Cart Items Snapshot ({selectedCheckout.item_count})
                </h4>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {(selectedCheckout.cart_snapshot || []).map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start space-x-3 text-xs">
                      <div className="w-12 h-14 bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0 rounded-xs">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="50px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px]">
                            R&R
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.title}</p>
                        {item.variantTitle && (
                          <p className="text-[10px] text-slate-500">{item.variantTitle}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.quantity} × ৳{item.price.toLocaleString()}
                        </p>
                      </div>

                      <p className="font-bold text-slate-900 shrink-0">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Calculation Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>৳{Number(selectedCheckout.subtotal).toLocaleString()}</span>
                </div>
                {Number(selectedCheckout.discount_total) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-৳{Number(selectedCheckout.discount_total).toLocaleString()}</span>
                  </div>
                )}
                {Number(selectedCheckout.shipping_total) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span>৳{Number(selectedCheckout.shipping_total).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>Estimated Total</span>
                  <span>৳{Number(selectedCheckout.estimated_total).toLocaleString()}</span>
                </div>
              </div>

              {/* Timeline & Metadata */}
              <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-2">
                <p>First Attempt: {new Date(selectedCheckout.created_at).toLocaleString()}</p>
                <p>Last Activity: {new Date(selectedCheckout.last_activity_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedCheckout.id)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 text-xs font-mono font-medium rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCheckout(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
