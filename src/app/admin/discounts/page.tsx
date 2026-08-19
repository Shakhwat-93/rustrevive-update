"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/admin/ui/data-table";
import { useAdminDialog } from "@/context/admin-dialog-context";
import type { DiscountType } from "@/types/database.types";

interface DiscountRow {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: number;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { showToast } = useAdminDialog();

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(1000);
  const [maxDiscount] = useState<number | undefined>(500);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      if (data?.data) {
        setDiscounts(data.data);
      }
    } catch (err) {
      console.error("Failed to load discounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          type,
          value,
          minimum_order_amount: minOrder,
          maximum_discount_amount: maxDiscount,
          usage_limit: usageLimit,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData?.error?.message || "Failed to create discount.", "error");
      } else {
        setShowModal(false);
        setCode("");
        setName("");
        showToast(`Coupon ${code} created successfully`, "success");
        await fetchDiscounts();
      }
    } catch {
      showToast("Error creating discount.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<DiscountRow>[] = [
    {
      key: "code",
      header: "Coupon Code",
      sortable: true,
      cell: (row: DiscountRow) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {row.code}
          </span>
          <button
            onClick={() => handleCopy(row.code)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Copy code"
          >
            {copiedCode === row.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: "name",
      header: "Campaign Name",
      sortable: true,
      cell: (row: DiscountRow) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">
            Min Order: ৳{row.minimum_order_amount.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Benefit",
      sortable: true,
      cell: (row: DiscountRow) => {
        let label = "";
        if (row.type === "PERCENTAGE") label = `${row.value}% Off`;
        else if (row.type === "FIXED_AMOUNT") label = `৳${row.value.toLocaleString()} Off`;
        else if (row.type === "FREE_SHIPPING") label = "Free Delivery";

        return (
          <span className="font-mono text-xs font-semibold text-emerald-700">
            {label}
          </span>
        );
      },
    },
    {
      key: "usage",
      header: "Redemptions",
      sortable: true,
      cell: (row: DiscountRow) => (
        <div className="flex flex-col font-mono text-xs text-slate-700">
          <span>{row.usage_count} used</span>
          <span className="text-[10px] text-slate-400">
            {row.usage_limit ? `Limit: ${row.usage_limit}` : "Unlimited"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row: DiscountRow) => (
        <StatusBadge status={row.is_active ? "active" : "archived"} size="sm" />
      ),
    },
  ];

  // Mobile Discount Card Render
  const renderMobileDiscountCard = (row: DiscountRow) => {
    let benefitLabel = "";
    if (row.type === "PERCENTAGE") benefitLabel = `${row.value}% OFF`;
    else if (row.type === "FIXED_AMOUNT") benefitLabel = `৳${row.value.toLocaleString()} OFF`;
    else if (row.type === "FREE_SHIPPING") benefitLabel = "FREE DELIVERY";

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {row.code}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(row.code);
              }}
              className="text-slate-400 hover:text-slate-700 p-1"
              title="Copy code"
            >
              {copiedCode === row.code ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <StatusBadge status={row.is_active ? "active" : "archived"} size="sm" />
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div className="min-w-0 pr-2">
            <h4 className="text-xs font-semibold text-slate-800 truncate">{row.name}</h4>
            <p className="text-[11px] font-mono text-slate-500">
              Min Order: ৳{row.minimum_order_amount.toLocaleString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-xs font-bold text-emerald-700">
              {benefitLabel}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {row.usage_count} / {row.usage_limit || "∞"} used
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Coupons & Discounts"
      subtitle="Create promotional campaigns, coupon codes, and server-side discount thresholds."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {discounts.length} coupons
        </span>
      }
      actions={
        <div className="flex items-center space-x-2">
          <AdminButton
            variant="secondary"
            icon={RefreshCw}
            isLoading={loading}
            onClick={fetchDiscounts}
          >
            Refresh
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowModal(true)}
          >
            Create Coupon
          </AdminButton>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={discounts}
        searchPlaceholder="Search coupon code or campaign..."
        searchKey="code"
        mobileCardRender={renderMobileDiscountCard}
      />

      {/* Responsive Modal / Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-[#9e472a]" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Create Promotional Coupon
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Launch 20%"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiscountType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-slate-800 outline-none bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (৳)</option>
                    <option value="FREE_SHIPPING">Free Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Value {type === "PERCENTAGE" ? "(%)" : "(৳)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Min Order Amount (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={usageLimit || ""}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
