"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Search,
  Download,
  Percent,
  ShoppingBag,
  Truck,
  Edit2,
  PowerOff,
  Power,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { useAdminDialog } from "@/context/admin-dialog-context";
import type { PromotionType, PromotionRuleConfig } from "@/lib/services/discount.service";

interface DiscountItem {
  id: string;
  code: string;
  name: string;
  displayName: string;
  type: string;
  value: number;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  computedStatus: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "DRAFT";
  rules: PromotionRuleConfig;
  created_at: string;
}

const STATUS_TABS: { id: "ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "EXPIRED", label: "Expired" },
  { id: "DISABLED", label: "Disabled" },
];

export default function AdminDiscountsPage() {
  const router = useRouter();
  const { showToast } = useAdminDialog();

  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/discounts?${params.toString()}`);
      const data = await res.json();
      if (data?.data) {
        setDiscounts(data.data);
      }
    } catch (err) {
      console.error("Failed to load discounts:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied code "${code}" to clipboard!`, "success");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (item: DiscountItem) => {
    try {
      const res = await fetch(`/api/admin/discounts/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status.");
      }

      showToast(`Discount "${item.code}" is now ${!item.is_active ? "Active" : "Disabled"}.`, "success");
      fetchDiscounts();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    }
  };

  const handleExportCSV = () => {
    if (discounts.length === 0) return;

    const headers = ["Title", "Code", "Type", "Method", "Value", "Status", "Used", "Usage Limit", "Starts At", "Ends At"];
    const rows = discounts.map((d) => [
      `"${d.displayName.replace(/"/g, '""')}"`,
      `"${d.code}"`,
      `"${d.rules?.promotionType || d.type}"`,
      `"${d.rules?.method || 'CODE'}"`,
      d.value,
      d.computedStatus,
      d.usage_count,
      d.rules?.usageLimit || d.usage_limit || "Unlimited",
      d.rules?.startsAt || "",
      d.rules?.endsAt || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rustrevive_discounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminPageLayout
      title="Discounts & Promotions"
      subtitle="Manage promotional discount codes, Buy X Get Y offers, and free shipping campaigns."
      actions={
        <div className="flex items-center space-x-2.5">
          <AdminButton variant="outline" size="sm" onClick={handleExportCSV} disabled={discounts.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </AdminButton>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => router.push("/admin/discounts/new")}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Discount
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filter Controls & Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, title, type..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#9e472a] bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#9e472a] animate-spin" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Loading Promotions...
              </p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Tag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No discounts found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || activeTab !== "ALL"
                  ? "No promotions match your active filters. Try resetting the search or filter tab."
                  : "Create your first discount code or Buy X Get Y campaign to boost conversions."}
              </p>
              <div className="pt-2">
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/admin/discounts/new")}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create Discount
                </AdminButton>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Title & Code</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Eligibility</th>
                    <th className="py-3.5 px-4">Used</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discounts.map((item) => {
                    const promoType = item.rules?.promotionType || (item.type as PromotionType);
                    const method = item.rules?.method || "CODE";
                    const isCode = method === "CODE";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Title & Code */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <Link
                              href={`/admin/discounts/${item.id}/edit`}
                              className="font-bold text-slate-900 hover:text-[#9e472a] transition-colors line-clamp-1"
                            >
                              {item.displayName}
                            </Link>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.code}
                              </span>
                              {isCode && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.code)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors cursor-pointer"
                                  title="Copy code"
                                >
                                  {copiedCode === item.code ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge
                            status={
                              item.computedStatus === "ACTIVE"
                                ? "active"
                                : item.computedStatus === "SCHEDULED"
                                ? "pending"
                                : item.computedStatus === "EXPIRED"
                                ? "archived"
                                : "draft"
                            }
                            label={item.computedStatus}
                          />
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700">
                            {method === "CODE" ? "Code" : "Automatic"}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            {promoType === "FREE_SHIPPING" ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Free shipping</span>
                              </>
                            ) : promoType === "BUY_X_GET_Y" ? (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                <span>Buy X Get Y</span>
                              </>
                            ) : promoType === "AMOUNT_OFF_PRODUCTS" ? (
                              <>
                                <Tag className="w-3.5 h-3.5 text-[#9e472a]" />
                                <span>Amount off products</span>
                              </>
                            ) : (
                              <>
                                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Amount off order</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Eligibility */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600">
                            {item.rules?.customerEligibility === "REGISTERED_CUSTOMERS"
                              ? "Registered"
                              : item.rules?.customerEligibility === "GUEST_CUSTOMERS"
                              ? "Guests"
                              : "All customers"}
                          </span>
                        </td>

                        {/* Used */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                          {item.usage_count}
                          {item.rules?.usageLimit || item.usage_limit
                            ? ` of ${item.rules?.usageLimit || item.usage_limit}`
                            : " used"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/discounts/${item.id}/edit`)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit discount"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.is_active
                                  ? "text-emerald-600 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={item.is_active ? "Disable discount" : "Enable discount"}
                            >
                              {item.is_active ? (
                                <Power className="w-3.5 h-3.5" />
                              ) : (
                                <PowerOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
