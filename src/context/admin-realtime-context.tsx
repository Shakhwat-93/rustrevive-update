"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, ArrowRight, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus, PaymentStatus } from "@/types/database.types";

export interface RealtimeOrderPayload {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: string;
  payment_method: string;
  grand_total: number;
  subtotal: number;
  created_at: string;
  order_items?: Array<{ id: string; product_title_snapshot: string; quantity: number }>;
}

export interface RealtimeNotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
  targetUrl?: string;
}

interface OrderToastData {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface AdminRealtimeContextType {
  isConnected: boolean;
  lastSyncTime: Date | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  playAlertSound: () => void;
  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;
  onNewOrder: (callback: (order: RealtimeOrderPayload) => void) => () => void;
  onOrderUpdate: (callback: (order: RealtimeOrderPayload) => void) => () => void;
  onOrderDelete: (callback: (orderId: string) => void) => () => void;
  onNotification: (callback: (notif: RealtimeNotificationPayload) => void) => () => void;
  forceReconcile: () => Promise<void>;
}

const AdminRealtimeContext = createContext<AdminRealtimeContextType | null>(null);

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeToast, setActiveToast] = useState<OrderToastData | null>(null);

  // Callbacks registries
  const newOrderListeners = useRef<Set<(order: RealtimeOrderPayload) => void>>(new Set());
  const orderUpdateListeners = useRef<Set<(order: RealtimeOrderPayload) => void>>(new Set());
  const orderDeleteListeners = useRef<Set<(orderId: string) => void>>(new Set());
  const notificationListeners = useRef<Set<(notif: RealtimeNotificationPayload) => void>>(new Set());

  // Deduplication caches (order_id / notification_id with timestamp)
  const processedEvents = useRef<Map<string, number>>(new Map());
  const lastSyncTimestampRef = useRef<string>(new Date().toISOString());

  // Clean old deduplication entries (> 5 minutes)
  const cleanOldDeduplication = useCallback(() => {
    const now = Date.now();
    for (const [key, timestamp] of processedEvents.current.entries()) {
      if (now - timestamp > 5 * 60 * 1000) {
        processedEvents.current.delete(key);
      }
    }
  }, []);

  // Web Audio subtle chime
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      // Two-tone subtle luxury chime (D5 -> A5)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio playback fails gracefully if restricted by browser policy
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Browser system notification (if granted)
  const triggerBrowserNotification = useCallback((order: RealtimeOrderPayload) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(`New Order #${order.order_number}`, {
          body: `৳${order.grand_total.toLocaleString()} from ${order.customer_name}`,
          icon: "/favicon.ico",
          tag: `order_${order.id}`,
        });
        notif.onclick = () => {
          window.focus();
          router.push(`/admin/orders/${order.id}`);
        };
      } catch {
        // Ignored
      }
    }
  }, [router]);

  // Reconciliation query after network reconnect
  const forceReconcile = useCallback(async () => {
    try {
      const supabase = createClient();
      const since = lastSyncTimestampRef.current;
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          customer_email,
          status,
          payment_status,
          fulfillment_status,
          payment_method,
          grand_total,
          subtotal,
          created_at,
          order_items(id, product_title_snapshot, quantity)
        `)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (recentOrders && recentOrders.length > 0) {
        for (const rawOrder of recentOrders) {
          const dedupeKey = `reconcile_order_${rawOrder.id}`;
          if (!processedEvents.current.has(dedupeKey)) {
            processedEvents.current.set(dedupeKey, Date.now());
            const formattedOrder = rawOrder as unknown as RealtimeOrderPayload;
            newOrderListeners.current.forEach((cb) => cb(formattedOrder));
          }
        }
      }

      setLastSyncTime(new Date());
      lastSyncTimestampRef.current = new Date().toISOString();
    } catch (err) {
      console.error("[Realtime] Reconciliation error:", err);
    }
  }, []);

  // Listener registration hooks
  const onNewOrder = useCallback((callback: (order: RealtimeOrderPayload) => void) => {
    newOrderListeners.current.add(callback);
    return () => {
      newOrderListeners.current.delete(callback);
    };
  }, []);

  const onOrderUpdate = useCallback((callback: (order: RealtimeOrderPayload) => void) => {
    orderUpdateListeners.current.add(callback);
    return () => {
      orderUpdateListeners.current.delete(callback);
    };
  }, []);

  const onOrderDelete = useCallback((callback: (orderId: string) => void) => {
    orderDeleteListeners.current.add(callback);
    return () => {
      orderDeleteListeners.current.delete(callback);
    };
  }, []);

  const onNotification = useCallback((callback: (notif: RealtimeNotificationPayload) => void) => {
    notificationListeners.current.add(callback);
    return () => {
      notificationListeners.current.delete(callback);
    };
  }, []);

  // Canonical Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    cleanOldDeduplication();

    // 1. Establish single shared channel
    const channel = supabase
      .channel("admin-realtime-hub")
      // Listen to all changes on orders table
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          cleanOldDeduplication();
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === "INSERT" && newRow) {
            const dedupeKey = `insert_order_${newRow.id}`;
            if (processedEvents.current.has(dedupeKey)) return;
            processedEvents.current.set(dedupeKey, Date.now());

            const orderPayload: RealtimeOrderPayload = {
              id: newRow.id,
              order_number: newRow.order_number,
              customer_name: newRow.customer_name,
              customer_phone: newRow.customer_phone,
              customer_email: newRow.customer_email,
              status: newRow.status,
              payment_status: newRow.payment_status,
              fulfillment_status: newRow.fulfillment_status,
              payment_method: newRow.payment_method,
              grand_total: newRow.grand_total,
              subtotal: newRow.subtotal || newRow.grand_total,
              created_at: newRow.created_at,
              order_items: [],
            };

            // 1. Sound & Toast
            playAlertSound();
            setActiveToast({
              id: `toast_${newRow.id}`,
              orderId: newRow.id,
              orderNumber: newRow.order_number,
              customerName: newRow.customer_name,
              grandTotal: newRow.grand_total,
              status: newRow.status,
              createdAt: newRow.created_at,
            });

            // 2. Browser Notification
            triggerBrowserNotification(orderPayload);

            // 3. Increment Notification Badge
            setUnreadNotificationCount((prev) => prev + 1);

            // 4. Notify all registered UI listeners
            newOrderListeners.current.forEach((cb) => cb(orderPayload));
          } else if (eventType === "UPDATE" && newRow) {
            const dedupeKey = `update_order_${newRow.id}_${newRow.status}_${newRow.payment_status}`;
            if (processedEvents.current.has(dedupeKey)) return;
            processedEvents.current.set(dedupeKey, Date.now());

            const orderPayload: RealtimeOrderPayload = {
              id: newRow.id,
              order_number: newRow.order_number,
              customer_name: newRow.customer_name,
              customer_phone: newRow.customer_phone,
              customer_email: newRow.customer_email,
              status: newRow.status,
              payment_status: newRow.payment_status,
              fulfillment_status: newRow.fulfillment_status,
              payment_method: newRow.payment_method,
              grand_total: newRow.grand_total,
              subtotal: newRow.subtotal || newRow.grand_total,
              created_at: newRow.created_at,
              order_items: [],
            };

            orderUpdateListeners.current.forEach((cb) => cb(orderPayload));
          } else if (eventType === "DELETE" && oldRow?.id) {
            orderDeleteListeners.current.forEach((cb) => cb(oldRow.id));
          }
        }
      )
      // Listen to changes on notifications table
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new;
          if (!newNotif) return;

          const dedupeKey = `insert_notif_${newNotif.id}`;
          if (processedEvents.current.has(dedupeKey)) return;
          processedEvents.current.set(dedupeKey, Date.now());

          const formattedNotif: RealtimeNotificationPayload = {
            id: newNotif.id,
            type: newNotif.type,
            title: newNotif.title,
            message: newNotif.message,
            resource_type: newNotif.resource_type,
            resource_id: newNotif.resource_id,
            is_read: newNotif.is_read,
            created_at: newNotif.created_at,
            targetUrl:
              newNotif.resource_type === "orders" && newNotif.resource_id
                ? `/admin/orders/${newNotif.resource_id}`
                : newNotif.resource_type === "reviews"
                ? `/admin/reviews`
                : `/admin/notifications`,
          };

          setUnreadNotificationCount((prev) => prev + 1);
          notificationListeners.current.forEach((cb) => cb(formattedNotif));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setLastSyncTime(new Date());
        } else if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
          // Auto-reconcile on reconnection
          if (status === "CLOSED" || status === "TIMED_OUT") {
            setTimeout(() => {
              forceReconcile();
            }, 1000);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cleanOldDeduplication, playAlertSound, triggerBrowserNotification, forceReconcile]);

  // Auto-dismiss active toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  return (
    <AdminRealtimeContext.Provider
      value={{
        isConnected,
        lastSyncTime,
        soundEnabled,
        toggleSound,
        playAlertSound,
        unreadNotificationCount,
        setUnreadNotificationCount,
        onNewOrder,
        onOrderUpdate,
        onOrderDelete,
        onNotification,
        forceReconcile,
      }}
    >
      {children}

      {/* Global Realtime Order Toast */}
      {activeToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl p-4 shadow-2xl border border-slate-700 animate-slide-up flex items-start space-x-3 backdrop-blur-md"
        >
          <div className="w-9 h-9 rounded-lg bg-[#9e472a] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                New Order Received
              </span>
              <span className="text-[10px] font-mono text-slate-400">Just now</span>
            </div>

            <p className="text-xs font-bold text-white mt-0.5 truncate">
              Order #{activeToast.orderNumber} &bull; ৳{activeToast.grandTotal.toLocaleString()}
            </p>

            <p className="text-[11px] font-mono text-slate-300 truncate mt-0.5">
              Customer: {activeToast.customerName}
            </p>

            <div className="mt-2 flex items-center space-x-3 pt-1 border-t border-slate-800">
              <Link
                href={`/admin/orders/${activeToast.orderId}`}
                onClick={() => setActiveToast(null)}
                className="text-xs font-mono font-semibold text-[#f59e0b] hover:text-amber-300 transition-colors flex items-center space-x-1"
              >
                <span>View Order Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AdminRealtimeContext.Provider>
  );
}

export function useAdminRealtime() {
  const context = useContext(AdminRealtimeContext);
  if (!context) {
    throw new Error("useAdminRealtime must be used within an AdminRealtimeProvider");
  }
  return context;
}
