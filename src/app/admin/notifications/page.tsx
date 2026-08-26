"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ShoppingBag,
  Star,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  CheckCheck,
  Check,
  Trash2,
  Search,
  Smartphone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { KPICard } from "@/components/admin/ui/kpi-card";
import { usePushNotification } from "@/lib/push/use-push-notification";

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
  targetUrl: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSecs < 60) return "Just now";
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  if (diffInSecs < 604800) return `${Math.floor(diffInSecs / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getCategoryBadge(type: string) {
  switch (type) {
    case "NEW_ORDER":
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase rounded">New Order</span>;
    case "ORDER_CANCELLED":
    case "ORDER_RETURNED":
      return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-bold uppercase rounded">Order Cancelled</span>;
    case "LOW_STOCK":
    case "OUT_OF_STOCK":
      return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold uppercase rounded">Stock Alert</span>;
    case "NEW_REVIEW":
      return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold uppercase rounded">Review</span>;
    case "CUSTOMER_MESSAGE":
      return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold uppercase rounded">Customer</span>;
    default:
      return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold uppercase rounded">System</span>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "NEW_ORDER":
    case "ORDER_CANCELLED":
    case "ORDER_RETURNED":
    case "PAYMENT_RECEIVED":
      return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
    case "LOW_STOCK":
    case "OUT_OF_STOCK":
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case "NEW_REVIEW":
      return <Star className="w-4 h-4 text-purple-600 fill-purple-600" />;
    case "CUSTOMER_MESSAGE":
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-[#9e472a]" />;
  }
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ORDERS" | "INVENTORY" | "REVIEWS" | "UNREAD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [counts, setCounts] = useState({
    all: 0,
    orders: 0,
    inventory: 0,
    reviews: 0,
    unread: 0,
  });
  const [filteredTotal, setFilteredTotal] = useState(0);

  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotification();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((page - 1) * pageSize).toString());

      if (activeTab === "UNREAD") {
        params.set("unreadOnly", "true");
      } else if (activeTab !== "ALL") {
        params.set("type", activeTab);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const json = await res.json();

      if (json?.data) {
        setNotifications(json.data.notifications || []);
        setFilteredTotal(json.data.filteredTotal || 0);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load admin notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, searchQuery]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));

      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setFilteredTotal((prev) => Math.max(0, prev - 1));

      await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const totalPages = Math.ceil(filteredTotal / pageSize) || 1;

  return (
    <AdminPageLayout
      title="Notifications & Activity Log"
      subtitle="Real-time event stream of customer orders, inventory stock warnings, and patron reviews."
      actions={
        <div className="flex items-center space-x-2.5">
          {/* Web Push Subscription Toggle */}
          {isSupported && (
            <button
              type="button"
              onClick={isSubscribed ? unsubscribe : subscribe}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                isSubscribed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200"
                  : "bg-[#141312] text-white hover:bg-[#9e472a] border-[#141312]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isSubscribed ? "Push Active ✓" : "Enable Mobile Push"}</span>
            </button>
          )}

          {/* Mark All Read */}
          {counts.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Mark All Read</span>
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={loadNotifications}
            className="p-2 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
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
            title="Total Events"
            value={counts.all.toString()}
            icon={Bell}
            subtitle="Lifetime recorded events"
          />
          <KPICard
            title="Unread Alerts"
            value={counts.unread.toString()}
            icon={Sparkles}
            subtitle="Awaiting staff action"
          />
          <KPICard
            title="Order Alerts"
            value={counts.orders.toString()}
            icon={ShoppingBag}
            subtitle="New placements & updates"
          />
          <KPICard
            title="Stock Warnings"
            value={counts.inventory.toString()}
            icon={AlertTriangle}
            subtitle="Low & depleted items"
          />
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Tabs with real counts */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Events", count: counts.all },
                { id: "ORDERS", label: "Orders", count: counts.orders },
                { id: "INVENTORY", label: "Inventory", count: counts.inventory },
                { id: "REVIEWS", label: "Reviews", count: counts.reviews },
                { id: "UNREAD", label: "Unread", count: counts.unread },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer, item..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notifications Stream */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
          {loading && notifications.length === 0 ? (
            <div className="p-16 text-center text-xs font-mono text-slate-400">
              Loading notification logs...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-mono font-bold text-slate-800 uppercase tracking-wider">
                No notifications found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "No matching alerts found for this search filter."
                  : "All caught up! Real-time notifications will appear here automatically."}
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleMarkAsRead(notif.id);
                  router.push(notif.targetUrl);
                }}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group ${
                  !notif.is_read ? "bg-amber-50/20" : ""
                }`}
              >
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getCategoryBadge(notif.type)}
                      <h4
                        className={`text-xs sm:text-sm ${
                          !notif.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#9e472a] shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {notif.message}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 pt-0.5">
                      <span>{timeAgo(notif.created_at)}</span>
                      <span>&bull;</span>
                      <span>{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Row Quick Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    href={notif.targetUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notif.is_read) handleMarkAsRead(notif.id);
                    }}
                    className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md bg-white shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Mark read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-xs font-mono text-slate-500">
              Page {page} of {totalPages} &bull; {filteredTotal} total entries
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
