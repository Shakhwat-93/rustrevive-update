"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    orderCount: number;
    aov: number;
    uniqueCustomers: number;
    conversionRate: number;
  };
  funnel: {
    productViews: number;
    addToCarts: number;
    checkouts: number;
    purchases: number;
  };
  topProducts: {
    title: string;
    units: number;
    revenue: number;
  }[];
  paymentMethods: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (json?.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <AdminPageLayout
      title="Commercial Intelligence & Analytics"
      subtitle="Track gross revenue, conversion funnel drop-offs, average order value, and top performers."
      actions={
        <div className="flex items-center space-x-2">
          {["today", "7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-mono rounded uppercase transition-colors ${
                range === r
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
          <AdminButton
            variant="secondary"
            icon={RefreshCw}
            isLoading={loading}
            onClick={fetchAnalytics}
          >
            Refresh
          </AdminButton>
        </div>
      }
    >
      {/* 1. Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard title="Gross Sales">
          <div className="space-y-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              ৳{(data?.summary.totalRevenue || 0).toLocaleString()}
            </span>
            <p className="text-xs font-mono text-slate-500">Realized revenue in selected window</p>
          </div>
        </AdminCard>

        <AdminCard title="Completed Orders">
          <div className="space-y-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {data?.summary.orderCount || 0}
            </span>
            <p className="text-xs font-mono text-slate-500">Excluding cancelled consignments</p>
          </div>
        </AdminCard>

        <AdminCard title="Average Order Value (AOV)">
          <div className="space-y-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              ৳{(data?.summary.aov || 0).toLocaleString()}
            </span>
            <p className="text-xs font-mono text-slate-500">Average spend per completed order</p>
          </div>
        </AdminCard>

        <AdminCard title="Conversion Rate">
          <div className="space-y-1">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {data?.summary.conversionRate || 0}%
            </span>
            <p className="text-xs font-mono text-slate-500">Product views to completed purchases</p>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. Conversion Funnel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <AdminCard title="Storefront Conversion Funnel">
            <div className="space-y-4 pt-2">
              {[
                { label: "1. Product Views", count: data?.funnel.productViews || 0, percent: "100%" },
                {
                  label: "2. Added to Bag",
                  count: data?.funnel.addToCarts || 0,
                  percent: `${Math.round(((data?.funnel.addToCarts || 0) / Math.max(1, data?.funnel.productViews || 1)) * 100)}%`,
                },
                {
                  label: "3. Initiated Checkout",
                  count: data?.funnel.checkouts || 0,
                  percent: `${Math.round(((data?.funnel.checkouts || 0) / Math.max(1, data?.funnel.productViews || 1)) * 100)}%`,
                },
                {
                  label: "4. Completed Orders",
                  count: data?.funnel.purchases || 0,
                  percent: `${Math.round(((data?.funnel.purchases || 0) / Math.max(1, data?.funnel.productViews || 1)) * 100)}%`,
                },
              ].map((step, idx) => (
                <div key={idx} className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">{step.label}</span>
                    <span>
                      {step.count.toLocaleString()} sessions ({step.percent})
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: step.percent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Top Performing Catalog Items */}
          <AdminCard title="Top Revenue Generating Products">
            <div className="divide-y divide-slate-100 font-mono text-xs">
              {(data?.topProducts || []).length === 0 ? (
                <p className="py-6 text-center text-slate-400 italic">No sales recorded in this timeframe.</p>
              ) : (
                data?.topProducts.map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900">{p.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">৳{p.revenue.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block">{p.units} units sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminCard>
        </div>

        {/* 3. Payment Methods & Customer Stats (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <AdminCard title="Payment Method Mix">
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(data?.paymentMethods || {}).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-700 font-semibold">{method.replace(/_/g, " ")}</span>
                  <span className="text-slate-900 font-bold">{count} orders</span>
                </div>
              ))}
              {Object.keys(data?.paymentMethods || {}).length === 0 && (
                <p className="text-slate-400 italic text-center py-4">No payment transactions yet.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Customer Acquisition">
            <div className="space-y-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Unique Patrons:</span>
                <span className="font-bold text-slate-900">{data?.summary.uniqueCustomers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Repeat Patron Rate:</span>
                <span className="font-bold text-emerald-700">
                  {data?.summary.uniqueCustomers && data.summary.orderCount > 0
                    ? `${Math.round(((data.summary.orderCount - data.summary.uniqueCustomers) / data.summary.orderCount) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageLayout>
  );
}
