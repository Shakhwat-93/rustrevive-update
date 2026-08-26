"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Star,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePushNotification } from "@/lib/push/use-push-notification";
import { useAdminRealtime } from "@/context/admin-realtime-context";

export interface AdminNotification {
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

function getNotificationIcon(type: string) {
  switch (type) {
    case "NEW_ORDER":
    case "ORDER_CANCELLED":
    case "ORDER_RETURNED":
    case "PAYMENT_RECEIVED":
      return <ShoppingBag className="w-4 h-4 text-amber-600" />;
    case "LOW_STOCK":
    case "OUT_OF_STOCK":
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    case "NEW_REVIEW":
      return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
    case "CUSTOMER_MESSAGE":
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-[#9e472a]" />;
  }
}

export function AdminNotificationBell() {
  const router = useRouter();
  const { soundEnabled, toggleSound, onNotification } = useAdminRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ORDERS" | "INVENTORY" | "REVIEWS">("ALL");
  const [hasNewAlertAnimation, setHasNewAlertAnimation] = useState(false);

  const { isSupported, isSubscribed, subscribe } = usePushNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/notifications?limit=20&type=${activeFilter}`);
      const json = await res.json();
      if (json?.data?.notifications) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime notification listener via central context
  useEffect(() => {
    const unsubscribe = onNotification((notif) => {
      const formatted: AdminNotification = {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        resource_type: notif.resource_type,
        resource_id: notif.resource_id,
        is_read: notif.is_read,
        created_at: notif.created_at,
        targetUrl: notif.targetUrl || (notif.resource_type === "orders" && notif.resource_id
          ? `/admin/orders/${notif.resource_id}`
          : notif.resource_type === "reviews"
          ? `/admin/reviews`
          : `/admin/orders`),
      };

      setNotifications((prev) => [formatted, ...prev.filter((n) => n.id !== formatted.id)]);
      setUnreadCount((prev) => prev + 1);
      setHasNewAlertAnimation(true);
      setTimeout(() => setHasNewAlertAnimation(false), 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [onNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    router.push(notif.targetUrl);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer relative shrink-0 ${
          isOpen ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100"
        } ${hasNewAlertAnimation ? "animate-bounce text-[#9e472a]" : ""}`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Compact Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#9e472a] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[390px] max-h-[85vh] sm:max-h-[540px] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#9e472a]/10 text-[#9e472a] text-[10px] font-mono font-bold rounded">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-[#9e472a] transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Web Push Enable Banner (If supported & not yet subscribed) */}
          {isSupported && !isSubscribed && (
            <div className="p-2.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <Smartphone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-900 truncate">
                  Get instant mobile alerts for new orders
                </span>
              </div>
              <button
                type="button"
                onClick={() => subscribe()}
                className="px-2 py-0.5 bg-[#9e472a] text-white text-[10px] font-mono uppercase font-bold rounded hover:bg-[#7d361f] transition-colors cursor-pointer shrink-0 ml-2"
              >
                Enable
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center space-x-1 overflow-x-auto scrollbar-none bg-white">
            {(["ALL", "ORDERS", "INVENTORY", "REVIEWS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                  activeFilter === tab
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[360px]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono text-slate-700 font-semibold uppercase tracking-wider">
                  You&apos;re all caught up
                </p>
                <p className="text-[11px] text-slate-400">
                  New orders, reviews, and stock alerts will appear here in real time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 sm:p-3.5 flex items-start space-x-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                    !notif.is_read ? "bg-amber-50/30" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs truncate ${
                          !notif.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#9e472a] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1 text-xs font-mono font-semibold text-slate-700 hover:text-[#9e472a] transition-colors"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
