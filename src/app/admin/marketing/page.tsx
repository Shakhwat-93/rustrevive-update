"use client";

import React from "react";
import { Plus, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";

export default function AdminMarketingPage() {
  return (
    <AdminPageLayout
      title="Marketing Campaigns"
      subtitle="Seasonal promotions, SMS alerts, and private lookbook dispatches."
      actions={
        <AdminButton
          icon={Plus}
          onClick={() => alert("Create campaign modal")}
        >
          Create Campaign
        </AdminButton>
      }
    >
      <AdminCard title="Active Promotions">
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
      </AdminCard>
    </AdminPageLayout>
  );
}
