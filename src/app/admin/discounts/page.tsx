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

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(1000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(500);
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
        alert(errData?.error?.message || "Failed to create discount.");
      } else {
        setShowModal(false);
        setCode("");
        setName("");
        await fetchDiscounts();
      }
    } catch {
      alert("Error creating discount.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<DiscountRow>[] = [
    {
      key: "code",
      header: "Coupon Code",
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
      cell: (row: DiscountRow) => (
        <StatusBadge status={row.is_active ? "active" : "archived"} />
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Coupons & Discounts"
      subtitle="Create promotional campaigns, coupon codes, and server-side discount thresholds."
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
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-slate-600" />
                <span>Create New Promotion</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. HERITAGE15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-200 rounded uppercase outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campaign Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Heritage Drop 15% Off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discount Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiscountType)}
                    className="w-full p-2 border border-slate-200 rounded outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (৳)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded outline-none focus:border-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Order (৳)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Cap (৳)</label>
                  <input
                    type="number"
                    value={maxDiscount || ""}
                    placeholder="Optional"
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 border border-slate-200 rounded outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit || ""}
                    placeholder="e.g. 100"
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 border border-slate-200 rounded outline-none"
                  />
                </div>
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
                  Save Coupon
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
