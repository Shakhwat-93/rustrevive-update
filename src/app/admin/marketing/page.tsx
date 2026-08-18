"use client";

import React from "react";
import { Megaphone, Plus, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/admin/ui/status-badge";

export default function AdminMarketingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Marketing Campaigns</h1>
            <Megaphone className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500">
            Seasonal promotions, SMS alerts, and private lookbook dispatches.
          </p>
        </div>

        <button
          onClick={() => alert("New Campaign Modal")}
          className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Active Promotions</h2>
        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between text-xs">
            <div>
              <div className="font-medium text-slate-800">Autumn 2026 Drop Announcement</div>
              <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Aug 18, 2026 – Aug 30, 2026</span>
              </div>
            </div>
            <StatusBadge status="active" size="sm" />
          </div>
          <div className="py-3 flex items-center justify-between text-xs">
            <div>
              <div className="font-medium text-slate-800">VIP Early Access: Raw Denim Collection</div>
              <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Scheduled for Sep 01, 2026</span>
              </div>
            </div>
            <StatusBadge status="pending" size="sm" label="SCHEDULED" />
          </div>
        </div>
      </div>
    </div>
  );
}
