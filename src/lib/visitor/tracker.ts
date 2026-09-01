/**
 * Visitor Tracker — Core singleton for anonymous visitor session tracking.
 *
 * - visitor_id: stable anonymous ID per browser (localStorage)
 * - session_id: per-tab session (sessionStorage)
 * - tab_id:     per-tab render ID (in-memory)
 * - Heartbeat every HEARTBEAT_INTERVAL_MS
 * - Page updates sent immediately on route change
 * - Falls back silently on any error — NEVER breaks storefront
 */

"use client";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
export const ACTIVE_WINDOW_SECONDS = 90;
export const HEARTBEAT_INTERVAL_MS = 25_000; // 25 seconds — 3+ beats per window
const STORAGE_VISITOR_KEY = "rr_vid"; // visitor_id localStorage key
const STORAGE_SESSION_KEY = "rr_sid"; // session_id sessionStorage key

// ---------------------------------------------------------------------------
// PAGE TYPE CLASSIFICATION
// ---------------------------------------------------------------------------
export type PageType =
  | "HOME"
  | "PRODUCT"
  | "CATEGORY"
  | "SEARCH"
  | "CART"
  | "CHECKOUT"
  | "ACCOUNT"
  | "CONTACT"
  | "ABOUT"
  | "CUSTOM"
  | "OTHER";

export interface PageContext {
  pageType: PageType;
  productId?: string | null;
  categoryId?: string | null;
  pageTitle?: string;
}

/**
 * Classify a route path into a page type.
 * Accepts optional extra context (productId, categoryId) from page components.
 */
export function classifyPage(path: string): Pick<PageContext, "pageType"> {
  const p = path.toLowerCase().split("?")[0] ?? "";

  if (p === "/" || p === "") return { pageType: "HOME" };
  if (p.startsWith("/products/") && p.length > "/products/".length) return { pageType: "PRODUCT" };
  if (p === "/products") return { pageType: "CATEGORY" };
  if (p.startsWith("/category") || p.startsWith("/collections")) return { pageType: "CATEGORY" };
  if (p.startsWith("/shop")) return { pageType: "CATEGORY" };
  if (p.startsWith("/search")) return { pageType: "SEARCH" };
  if (p === "/cart") return { pageType: "CART" };
  if (p.startsWith("/checkout")) return { pageType: "CHECKOUT" };
  if (p.startsWith("/account")) return { pageType: "ACCOUNT" };
  if (p.startsWith("/contact")) return { pageType: "CONTACT" };
  if (p.startsWith("/about")) return { pageType: "ABOUT" };
  if (p.startsWith("/order-confirmation")) return { pageType: "CUSTOM" };
  return { pageType: "OTHER" };
}

// ---------------------------------------------------------------------------
// UUID GENERATION (no fingerprinting — pure random)
// ---------------------------------------------------------------------------
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// REFERRER SANITIZATION
// Strips query params that may contain PII (email, tokens, etc.)
// ---------------------------------------------------------------------------
function sanitizeReferrer(ref: string): string {
  if (!ref) return "";
  try {
    const url = new URL(ref);
    // Return only protocol + hostname (e.g. "https://google.com")
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// HEARTBEAT PAYLOAD
// ---------------------------------------------------------------------------
export interface HeartbeatPayload {
  visitor_id: string;
  session_id: string;
  tab_id: string;
  current_path: string;
  page_title?: string;
  page_type: PageType;
  product_id?: string | null;
  category_id?: string | null;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ---------------------------------------------------------------------------
// VISITOR TRACKER CLASS (module-level singleton)
// ---------------------------------------------------------------------------
class VisitorTrackerClass {
  private visitorId: string | null = null;
  private sessionId: string | null = null;
  private tabId: string | null = null;
  private initialized = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private currentPath = "/";
  private currentContext: PageContext = { pageType: "HOME" };
  private isSending = false;

  // ---------------------------------------------------------------------------
  // Initialize — call once on app mount
  // ---------------------------------------------------------------------------
  initialize(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    try {
      // Recover or create visitor_id (stable, per-browser)
      let vid = localStorage.getItem(STORAGE_VISITOR_KEY);
      if (!vid) {
        vid = generateUUID();
        localStorage.setItem(STORAGE_VISITOR_KEY, vid);
      }
      this.visitorId = vid;

      // Recover or create session_id (per-tab, cleared when tab closes)
      let sid = sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (!sid) {
        sid = generateUUID();
        sessionStorage.setItem(STORAGE_SESSION_KEY, sid);
      }
      this.sessionId = sid;

      // Tab ID — in-memory, differentiates tabs with same session
      this.tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    } catch {
      // Storage blocked (incognito strict mode) — generate ephemeral IDs
      this.visitorId = generateUUID();
      this.sessionId = generateUUID();
      this.tabId = `tab-${Date.now()}`;
    }

    // Listen for page hide to mark session end
    window.addEventListener("pagehide", this.handlePageHide.bind(this), { passive: true });
    window.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this), { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Update current page — called on every route change
  // ---------------------------------------------------------------------------
  updatePage(path: string, context: Partial<PageContext> = {}): void {
    if (!this.initialized) this.initialize();

    this.currentPath = path;
    this.currentContext = {
      ...classifyPage(path),
      ...context,
    };

    // Send immediately when page changes (don't wait for heartbeat timer)
    void this.sendHeartbeat();
  }

  // ---------------------------------------------------------------------------
  // Start heartbeat interval
  // ---------------------------------------------------------------------------
  startHeartbeat(): void {
    if (this.heartbeatTimer) return; // Already running
    this.heartbeatTimer = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  // ---------------------------------------------------------------------------
  // Stop heartbeat interval
  // ---------------------------------------------------------------------------
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Send heartbeat — the core upsert call
  // ---------------------------------------------------------------------------
  async sendHeartbeat(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.visitorId || !this.sessionId) return;
    if (this.isSending) return; // Prevent concurrent sends

    try {
      this.isSending = true;

      const searchParams = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();

      const payload: HeartbeatPayload = {
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        tab_id: this.tabId ?? "unknown",
        current_path: this.currentPath,
        page_title: typeof document !== "undefined" ? document.title : undefined,
        page_type: this.currentContext.pageType,
        product_id: this.currentContext.productId ?? null,
        category_id: this.currentContext.categoryId ?? null,
        referrer: sanitizeReferrer(typeof document !== "undefined" ? document.referrer : ""),
        utm_source: searchParams.get("utm_source") ?? undefined,
        utm_medium: searchParams.get("utm_medium") ?? undefined,
        utm_campaign: searchParams.get("utm_campaign") ?? undefined,
      };

      // Use sendBeacon when available (doesn't block navigation)
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/visitor/heartbeat", blob);
      } else {
        await fetch("/api/visitor/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }

    } catch {
      // Silently fail — NEVER break the storefront
    } finally {
      this.isSending = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Page hide handler — fires when tab is closed/hidden
  // ---------------------------------------------------------------------------
  private handlePageHide(): void {
    // Use sendBeacon to fire one last heartbeat as the page unloads
    // The server will mark the session stale after ACTIVE_WINDOW_SECONDS
    if (this.visitorId && this.sessionId && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const payload: HeartbeatPayload = {
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        tab_id: this.tabId ?? "unknown",
        current_path: this.currentPath,
        page_type: this.currentContext.pageType,
        product_id: this.currentContext.productId ?? null,
        category_id: this.currentContext.categoryId ?? null,
      };
      navigator.sendBeacon("/api/visitor/heartbeat", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    }
    this.stopHeartbeat();
  }

  // ---------------------------------------------------------------------------
  // Visibility change — resume/pause heartbeat
  // ---------------------------------------------------------------------------
  private handleVisibilityChange(): void {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible") {
      this.startHeartbeat();
      void this.sendHeartbeat(); // Immediate refresh when tab becomes visible again
    } else {
      this.stopHeartbeat();
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup — call on component unmount
  // ---------------------------------------------------------------------------
  cleanup(): void {
    this.stopHeartbeat();
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.handlePageHide.bind(this));
      window.removeEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
    }
  }

  // Getters
  getVisitorId(): string | null { return this.visitorId; }
  getSessionId(): string | null { return this.sessionId; }
}

// Module-level singleton — one instance per browser tab
export const VisitorTracker = new VisitorTrackerClass();
