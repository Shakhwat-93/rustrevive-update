"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { useAdminDialog } from "@/context/admin-dialog-context";
import type { CampaignType, CampaignStatus } from "@/types/database.types";

interface CampaignRow {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  target_type: string;
  budget: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface SegmentRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rules: Record<string, unknown>;
}

export default function AdminMarketingPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useAdminDialog();

  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("PROMOTION");
  const [budget, setBudget] = useState(5000);
  const [submitting, setSubmitting] = useState(false);

  const fetchMarketingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/marketing");
      const json = await res.json();
      if (json?.data) {
        setCampaigns(json.data.campaigns || []);
        setSegments(json.data.segments || []);
      }
    } catch (err) {
      console.error("Failed to load marketing data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketingData();
  }, [fetchMarketingData]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          budget,
          status: "ACTIVE",
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName("");
        showToast(`Campaign ${name} created successfully`, "success");
        await fetchMarketingData();
      } else {
        showToast("Failed to create campaign", "error");
      }
    } catch {
      showToast("Failed to create campaign.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<CampaignRow>[] = [
    {
      key: "name",
      header: "Campaign Name",
      cell: (row: CampaignRow) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900">{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">{row.type}</span>
        </div>
      ),
    },
    {
      key: "target_type",
      header: "Targeting",
      cell: (row: CampaignRow) => (
        <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.target_type}
        </span>
      ),
    },
    {
      key: "budget",
      header: "Allocated Budget",
      cell: (row: CampaignRow) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          ৳{row.budget.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: CampaignRow) => <StatusBadge status={row.status.toLowerCase()} />,
    },
  ];

  return (
    <AdminPageLayout
      title="Marketing & Customer Segments"
      subtitle="Manage promotional drop announcements, customer segmentation rules, and campaign performance."
      actions={
        <div className="flex items-center space-x-2">
          <AdminButton
            variant="secondary"
            icon={RefreshCw}
            isLoading={loading}
            onClick={fetchMarketingData}
          >
            Refresh
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowModal(true)}
          >
            New Campaign
          </AdminButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaigns Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <DataTable
            columns={columns}
            data={campaigns}
          />
        </div>

        {/* Customer Segments (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <AdminCard title="Audience Segments">
            <div className="divide-y divide-slate-100 font-mono text-xs">
              {segments.map((seg) => (
                <div key={seg.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{seg.name}</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {seg.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{seg.description}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-slate-600" />
                <span>Create Marketing Campaign</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Autumn Leather Drop Release"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Channel / Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CampaignType)}
                  className="w-full p-2 border border-slate-200 rounded outline-none"
                >
                  <option value="PROMOTION">Catalog Promotion</option>
                  <option value="PRODUCT_CAMPAIGN">Product Highlight Drop</option>
                  <option value="COLLECTION_CAMPAIGN">Collection Campaign</option>
                  <option value="EMAIL">Email Dispatch</option>
                  <option value="SMS">SMS Flash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Budget (BDT)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <AdminButton
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                >
                  Schedule Campaign
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
