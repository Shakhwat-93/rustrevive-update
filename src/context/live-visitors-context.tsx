"use client";

/**
 * LiveVisitorsContext
 *
 * Admin-panel context that:
 * 1. Fetches initial active visitors from /api/admin/live-visitors
 * 2. Subscribes to Supabase Realtime on live_visitors table
 * 3. Handles INSERT / UPDATE / DELETE events
 * 4. Protects against initial-fetch ↔ realtime race conditions
 * 5. Reconciles state on reconnect
 * 6. Provides derived KPI counts
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// ACTIVE WINDOW — must match server constant
// ---------------------------------------------------------------------------
export const ACTIVE_WINDOW_SECONDS = 90;

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface LiveVisitor {
  id: string;
  visitor_id: string;
  session_id: string;
  tab_id: string | null;
  current_path: string;
  page_title: string | null;
  page_type: string;
  product_id: string | null;
  category_id: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  started_at: string;
  last_seen_at: string;
  is_active: boolean;
  // Joined data
  products?: { id: string; title: string; slug: string } | null;
  categories?: { id: string; name: string; slug: string } | null;
}

export interface LiveVisitorKPIs {
  total: number;
  uniqueVisitors: number;
  onProducts: number;
  onCart: number;
  onCheckout: number;
  onSearch: number;
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface PageBreakdown {
  path: string;
  pageType: string;
  label: string;
  count: number;
}

interface LiveVisitorsContextType {
  visitors: LiveVisitor[];
  kpis: LiveVisitorKPIs;
  pageBreakdown: PageBreakdown[];
  isConnected: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
  selectedVisitor: LiveVisitor | null;
  setSelectedVisitor: (v: LiveVisitor | null) => void;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------
const LiveVisitorsContext = createContext<LiveVisitorsContextType | null>(null);

export function useLiveVisitors(): LiveVisitorsContextType {
  const ctx = useContext(LiveVisitorsContext);
  if (!ctx) throw new Error("useLiveVisitors must be used within LiveVisitorsProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function isActiveVisitor(v: LiveVisitor): boolean {
  const last = new Date(v.last_seen_at).getTime();
  const cutoff = Date.now() - ACTIVE_WINDOW_SECONDS * 1000;
  return last >= cutoff;
}

function getPageLabel(v: LiveVisitor): string {
  if (v.page_type === "PRODUCT" && v.products?.title) return v.products.title;
  if (v.page_type === "CATEGORY" && v.categories?.name) return v.categories.name;
  const labels: Record<string, string> = {
    HOME: "Homepage",
    PRODUCT: "Product Page",
    CATEGORY: "Category",
    SEARCH: "Search",
    CART: "Cart",
    CHECKOUT: "Checkout",
    ACCOUNT: "Account",
    CONTACT: "Contact",
    ABOUT: "About",
    CUSTOM: v.current_path,
    OTHER: v.current_path,
  };
  return labels[v.page_type] ?? v.current_path;
}

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------
export function LiveVisitorsProvider({ children }: { children: React.ReactNode }) {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null);

  // Ref to track rows received via realtime BEFORE initial fetch completes
  // Prevents race condition: realtime arrives → initial fetch overwrites it
  const pendingRealtimeEvents = useRef<Map<string, { type: "INSERT" | "UPDATE" | "DELETE"; row: LiveVisitor }>>(new Map());
  const initialFetchDone = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ---------------------------------------------------------------------------
  // Stale visitor filter — remove rows that have expired
  // ---------------------------------------------------------------------------
  const pruneStale = useCallback((list: LiveVisitor[]): LiveVisitor[] => {
    return list.filter(isActiveVisitor);
  }, []);

  // ---------------------------------------------------------------------------
  // Apply a realtime event to the current list
  // ---------------------------------------------------------------------------
  const applyEvent = useCallback(
    (
      prev: LiveVisitor[],
      type: "INSERT" | "UPDATE" | "DELETE",
      row: LiveVisitor
    ): LiveVisitor[] => {
      if (type === "DELETE") {
        return pruneStale(prev.filter((v) => v.id !== row.id));
      }
      if (type === "INSERT") {
        // Don't add stale visitors
        if (!isActiveVisitor(row)) return prev;
        // Deduplicate: replace if same id already exists
        const exists = prev.findIndex((v) => v.id === row.id);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = row;
          return pruneStale(next);
        }
        return pruneStale([row, ...prev]);
      }
      if (type === "UPDATE") {
        if (!isActiveVisitor(row)) {
          return pruneStale(prev.filter((v) => v.id !== row.id));
        }
        const idx = prev.findIndex((v) => v.id === row.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = row;
          return pruneStale(next);
        }
        return pruneStale([row, ...prev]);
      }
      return prev;
    },
    [pruneStale]
  );

  // ---------------------------------------------------------------------------
  // Fetch active visitors (initial + reconciliation)
  // ---------------------------------------------------------------------------
  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-visitors");
      if (!res.ok) throw new Error("Failed to fetch visitors");
      const json = await res.json();
      const rows: LiveVisitor[] = (json.data ?? []).filter(isActiveVisitor);

      setVisitors((_prev) => {
        // After initial fetch, apply any realtime events that arrived while fetching
        let merged = rows;
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
          // Apply buffered events
          for (const [, event] of pendingRealtimeEvents.current.entries()) {
            merged = applyEvent(merged, event.type, event.row);
          }
          pendingRealtimeEvents.current.clear();
        }
        return merged;
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[LiveVisitors] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [applyEvent]);

  // ---------------------------------------------------------------------------
  // Supabase Realtime subscription
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    // Fetch initial data
    void fetchVisitors();

    // Subscribe to live_visitors realtime events
    const channel = supabase
      .channel("live_visitors_admin", {
        config: { presence: { key: "admin" } },
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_visitors" },
        (payload) => {
          const p = payload as unknown as {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new: LiveVisitor;
            old: LiveVisitor;
          };
          const { eventType, new: newRow, old: oldRow } = p;

          const row = eventType === "DELETE" ? oldRow : newRow;
          if (!row) return;

          setLastUpdated(new Date());

          if (!initialFetchDone.current) {
            // Buffer events until initial fetch is done
            pendingRealtimeEvents.current.set(row.id, { type: eventType, row });
            return;
          }

          setVisitors((prev) => applyEvent(prev, eventType, row));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");

        if (status === "SUBSCRIBED") {
          // On reconnect: re-fetch to reconcile any missed events
          if (initialFetchDone.current) {
            void fetchVisitors();
          }
        }
      });

    channelRef.current = channel;

    // Prune stale visitors every 30 seconds on the admin panel
    const pruneInterval = setInterval(() => {
      setVisitors((prev) => prev.filter(isActiveVisitor));
    }, 30_000);

    return () => {
      clearInterval(pruneInterval);
      void supabase.removeChannel(channel);
    };
  }, [fetchVisitors, applyEvent]);

  // ---------------------------------------------------------------------------
  // Derived KPIs
  // ---------------------------------------------------------------------------
  const kpis = useMemo<LiveVisitorKPIs>(() => {
    const active = visitors.filter(isActiveVisitor);
    const uniqueVisitorIds = new Set(active.map((v) => v.visitor_id));
    return {
      total: active.length,
      uniqueVisitors: uniqueVisitorIds.size,
      onProducts: active.filter((v) => v.page_type === "PRODUCT").length,
      onCart: active.filter((v) => v.page_type === "CART").length,
      onCheckout: active.filter((v) => v.page_type === "CHECKOUT").length,
      onSearch: active.filter((v) => v.page_type === "SEARCH").length,
      mobile: active.filter((v) => v.device_type === "MOBILE").length,
      desktop: active.filter((v) => v.device_type === "DESKTOP").length,
      tablet: active.filter((v) => v.device_type === "TABLET").length,
    };
  }, [visitors]);

  // ---------------------------------------------------------------------------
  // Page breakdown
  // ---------------------------------------------------------------------------
  const pageBreakdown = useMemo<PageBreakdown[]>(() => {
    const active = visitors.filter(isActiveVisitor);
    const map = new Map<string, PageBreakdown>();

    for (const v of active) {
      const key = v.current_path;
      const label = getPageLabel(v);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { path: v.current_path, pageType: v.page_type, label, count: 1 });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [visitors]);

  return (
    <LiveVisitorsContext.Provider
      value={{
        visitors,
        kpis,
        pageBreakdown,
        isConnected,
        isLoading,
        lastUpdated,
        selectedVisitor,
        setSelectedVisitor,
        refresh: fetchVisitors,
      }}
    >
      {children}
    </LiveVisitorsContext.Provider>
  );
}
