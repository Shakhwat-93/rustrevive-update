"use client";

import React, { useState } from "react";
import {
  Users,
  Smartphone,
  Monitor,
  ShoppingCart,
  CreditCard,
  Package,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  Clock,
  Globe,
  ExternalLink,
  Tablet,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { LiveVisitorsProvider, useLiveVisitors, type LiveVisitor, ACTIVE_WINDOW_SECONDS } from "@/context/live-visitors-context";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function formatDuration(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function shortVisitorId(visitorId: string): string {
  return `#${visitorId.slice(0, 6).toUpperCase()}`;
}

function getPageTypeColor(pageType: string): string {
  const colors: Record<string, string> = {
    HOME: "bg-slate-100 text-slate-700",
    PRODUCT: "bg-blue-50 text-blue-700",
    CATEGORY: "bg-violet-50 text-violet-700",
    SEARCH: "bg-amber-50 text-amber-700",
    CART: "bg-orange-50 text-orange-700",
    CHECKOUT: "bg-emerald-50 text-emerald-700",
    ACCOUNT: "bg-slate-100 text-slate-600",
    CONTACT: "bg-pink-50 text-pink-700",
    ABOUT: "bg-teal-50 text-teal-700",
    CUSTOM: "bg-indigo-50 text-indigo-700",
    OTHER: "bg-slate-50 text-slate-500",
  };
  return colors[pageType] ?? "bg-slate-50 text-slate-500";
}

function getDeviceIcon(deviceType: string | null) {
  if (deviceType === "MOBILE") return <Smartphone className="w-3.5 h-3.5" />;
  if (deviceType === "TABLET") return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function getPageLabel(v: LiveVisitor): string {
  if (v.page_type === "PRODUCT" && v.products?.title) return v.products.title;
  if (v.page_type === "CATEGORY" && v.categories?.name) return v.categories.name;
  const labels: Record<string, string> = {
    HOME: "Homepage",
    PRODUCT: "Product Page",
    CATEGORY: "Category Page",
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

function getReferrerLabel(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    if (hostname.includes("google")) return "Google";
    if (hostname.includes("facebook") || hostname.includes("fb.com")) return "Facebook";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("tiktok")) return "TikTok";
    if (hostname.includes("youtube")) return "YouTube";
    if (hostname.includes("twitter") || hostname.includes("x.com")) return "Twitter/X";
    if (hostname.includes("pinterest")) return "Pinterest";
    return hostname;
  } catch {
    return "Direct";
  }
}

// ---------------------------------------------------------------------------
// VISITOR DETAIL DRAWER
// ---------------------------------------------------------------------------
function VisitorDetailDrawer({ visitor, onClose }: { visitor: LiveVisitor; onClose: () => void }) {
  const sessionDuration = Math.floor((Date.now() - new Date(visitor.started_at).getTime()) / 1000);
  const sessionMins = Math.floor(sessionDuration / 60);
  const sessionSecs = sessionDuration % 60;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 font-mono">
                Visitor {shortVisitorId(visitor.visitor_id)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Session {shortVisitorId(visitor.session_id)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Current Page */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Currently Viewing</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{getPageLabel(visitor)}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{visitor.current_path}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPageTypeColor(visitor.page_type)}`}>
                {visitor.page_type}
              </span>
            </div>
          </div>

          {/* Session Info */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Session</p>
            <div className="space-y-2">
              {[
                { label: "Duration", value: sessionDuration < 60 ? `${sessionDuration}s` : `${sessionMins}m ${sessionSecs}s` },
                { label: "Started", value: new Date(visitor.started_at).toLocaleTimeString() },
                { label: "Last Activity", value: formatDuration(visitor.last_seen_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">{label}</span>
                  <span className="text-slate-900 font-semibold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Device */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Device</p>
            <div className="space-y-2">
              {[
                { label: "Device", value: visitor.device_type ?? "—" },
                { label: "Browser", value: visitor.browser ?? "—" },
                { label: "OS", value: visitor.os ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">{label}</span>
                  <span className="text-slate-900 font-semibold font-mono capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Traffic Source */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Traffic Source</p>
            <div className="space-y-2">
              {[
                { label: "Referrer", value: getReferrerLabel(visitor.referrer) },
                { label: "UTM Source", value: visitor.utm_source ?? "—" },
                { label: "UTM Medium", value: visitor.utm_medium ?? "—" },
                { label: "UTM Campaign", value: visitor.utm_campaign ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">{label}</span>
                  <span className="text-slate-900 font-semibold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* IDs — Anonymous */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Anonymous Identity</p>
            <div className="space-y-2">
              {[
                { label: "Visitor ID", value: visitor.visitor_id.slice(0, 18) + "…" },
                { label: "Session ID", value: visitor.session_id.slice(0, 18) + "…" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">{label}</span>
                  <span className="text-slate-700 font-mono text-[11px]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">No personal information stored.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI CARD
// ---------------------------------------------------------------------------
function LiveKpiCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border shadow-2xs ${accent ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${accent ? "text-emerald-700" : "text-slate-500"}`}>
          {label}
        </span>
        <Icon className={`w-4 h-4 ${accent ? "text-emerald-600" : "text-slate-400"}`} />
      </div>
      <span className={`text-2xl font-bold font-mono ${accent ? "text-emerald-800" : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE (inner — needs context)
// ---------------------------------------------------------------------------
function LiveVisitorsInner() {
  const { visitors, kpis, pageBreakdown, isConnected, isLoading, lastUpdated, selectedVisitor, setSelectedVisitor, refresh } = useLiveVisitors();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <AdminPageLayout
      title="Live Visitors"
      subtitle={`Real-time anonymous session tracking — ${ACTIVE_WINDOW_SECONDS}s activity window`}
      actions={
        <div className="flex items-center space-x-3">
          {/* Connection indicator */}
          <div className="flex items-center space-x-1.5">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-mono uppercase">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-600 font-mono uppercase">Reconnecting…</span>
              </>
            )}
          </div>

          {lastUpdated && (
            <span className="hidden sm:block text-[10px] text-slate-400 font-mono">
              Updated {formatDuration(lastUpdated.toISOString())}
            </span>
          )}

          <AdminButton
            variant="secondary"
            icon={RefreshCw}
            isLoading={isRefreshing}
            onClick={handleRefresh}
          >
            Sync
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <LiveKpiCard label="Live Visitors" value={kpis.uniqueVisitors} icon={Users} accent />
          <LiveKpiCard label="On Products" value={kpis.onProducts} icon={Package} />
          <LiveKpiCard label="On Cart" value={kpis.onCart} icon={ShoppingCart} />
          <LiveKpiCard label="On Checkout" value={kpis.onCheckout} icon={CreditCard} />
          <LiveKpiCard label="Mobile" value={kpis.mobile} icon={Smartphone} />
          <LiveKpiCard label="Desktop" value={kpis.desktop + kpis.tablet} icon={Monitor} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Page Breakdown ──────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <AdminCard title="Live by Page">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : pageBreakdown.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">No visitors online</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pageBreakdown.map((page) => (
                    <div key={page.path} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{page.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{page.path}</p>
                      </div>
                      <div className="ml-3 flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getPageTypeColor(page.pageType)}`}>
                          {page.pageType}
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-900 w-5 text-right">{page.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>

          {/* ── Live Visitor Table ──────────────────────────────────────── */}
          <div className="lg:col-span-8">
            <AdminCard title={`Active Sessions (${visitors.length})`}>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : visitors.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Wifi className="w-10 h-10 text-slate-200 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-500">No visitors currently online</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sessions appear here within seconds of a visitor loading the website.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider pr-3">Visitor</th>
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider pr-3">Current Page</th>
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider pr-3">Device</th>
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider pr-3">Source</th>
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider pr-3">Started</th>
                          <th className="py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {visitors.map((v) => (
                          <tr
                            key={v.id}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedVisitor(v)}
                          >
                            <td className="py-3 pr-3">
                              <span className="font-bold text-slate-900">{shortVisitorId(v.visitor_id)}</span>
                            </td>
                            <td className="py-3 pr-3 max-w-[200px]">
                              <div>
                                <p className="font-semibold text-slate-800 truncate">{getPageLabel(v)}</p>
                                <p className="text-[10px] text-slate-400 truncate">{v.current_path}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center space-x-1 text-slate-600">
                                {getDeviceIcon(v.device_type)}
                                <span>{v.browser ?? "—"}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-slate-600">{getReferrerLabel(v.referrer)}</td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center space-x-1 text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(v.started_at)}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-600 font-bold text-[10px] uppercase">Live</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {visitors.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setSelectedVisitor(v)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-900 font-mono">{shortVisitorId(v.visitor_id)}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getPageTypeColor(v.page_type)}`}>
                              {v.page_type}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">{getPageLabel(v)}</p>
                        <div className="mt-1.5 flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center space-x-0.5">{getDeviceIcon(v.device_type)}<span>{v.browser}</span></span>
                          <span>{getReferrerLabel(v.referrer)}</span>
                          <span>{formatDuration(v.last_seen_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AdminCard>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedVisitor && (
        <VisitorDetailDrawer
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </AdminPageLayout>
  );
}

// ---------------------------------------------------------------------------
// EXPORT — wraps with provider
// ---------------------------------------------------------------------------
export default function LiveVisitorsPage() {
  return (
    <LiveVisitorsProvider>
      <LiveVisitorsInner />
    </LiveVisitorsProvider>
  );
}
