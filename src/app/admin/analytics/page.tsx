"use client";

import React, { useState } from "react";
import { Calendar, DollarSign, ShoppingCart, Users, ArrowUpRight } from "lucide-react";
import { KPICard } from "@/components/admin/ui/kpi-card";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminCard } from "@/components/admin/ui/admin-card";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <AdminPageLayout
      title="Analytics & Reports"
      subtitle="Conversion metrics, top-performing garments, and revenue trajectory."
      actions={
        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {["today", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded text-xs font-medium uppercase transition-colors cursor-pointer ${
                timeRange === range
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Gross Sales"
            value="৳461,400"
            change="+18.4%"
            trend="up"
            subtitle="vs previous period"
            icon={DollarSign}
          />
          <KPICard
            title="Online Orders"
            value="82"
            change="+11.2%"
            trend="up"
            subtitle="vs previous period"
            icon={ShoppingCart}
          />
          <KPICard
            title="Conversion Rate"
            value="3.42%"
            change="+0.6%"
            trend="up"
            subtitle="Storefront sessions"
            icon={ArrowUpRight}
          />
          <KPICard
            title="Returning Customers"
            value="44.8%"
            change="+3.2%"
            trend="up"
            subtitle="Brand loyalty rate"
            icon={Users}
          />
        </div>

        {/* Top Performing Garments Table */}
        <AdminCard title="Top Selling Garments">
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">Wide Leg Pleated Sweatpants</div>
                <div className="text-[11px] text-slate-400 font-mono">Pants • Washed Charcoal</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-slate-900">৳167,040</div>
                <div className="text-[11px] text-slate-500">24 units sold</div>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">FB Sister Unisex Baggy Raw Denim</div>
                <div className="text-[11px] text-slate-400 font-mono">Denim • Raw Indigo</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-slate-900">৳189,120</div>
                <div className="text-[11px] text-slate-500">18 units sold</div>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">Vintage Washed Leather Aviator Jacket</div>
                <div className="text-[11px] text-slate-400 font-mono">Jackets • Distressed Cognac</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-slate-900">৳105,200</div>
                <div className="text-[11px] text-slate-500">5 units sold</div>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminPageLayout>
  );
}
