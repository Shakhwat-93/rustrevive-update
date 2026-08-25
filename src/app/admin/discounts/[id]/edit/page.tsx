"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";
import { Loader2 } from "lucide-react";
import type { PromotionRuleConfig } from "@/lib/services/discount.service";

export default function EditDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [discountData, setDiscountData] = useState<{
    id: string;
    code: string;
    name: string;
    rules: PromotionRuleConfig;
    is_active: boolean;
  } | null>(null);

  useEffect(() => {
    async function loadDiscount() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/discounts/${id}`);
        const data = await res.json();
        if (!res.ok || !data?.data) {
          throw new Error(data?.error?.message || "Failed to load discount details.");
        }
        setDiscountData(data.data);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadDiscount();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminPageLayout title="Loading Discount...">
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-[#9e472a] animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loading promotion settings...
          </p>
        </div>
      </AdminPageLayout>
    );
  }

  if (errorMsg || !discountData) {
    return (
      <AdminPageLayout title="Discount Not Found">
        <div className="p-8 text-center space-y-4 max-w-md mx-auto">
          <p className="text-sm text-rose-600 font-medium">
            {errorMsg || "Unable to locate the specified discount."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/discounts")}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Back to Discounts List
          </button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Edit Discount: ${discountData.code}`}
      subtitle="Modify promotion rules, targeting, active schedule, or combination parameters."
    >
      <DiscountForm mode="edit" initialData={discountData} />
    </AdminPageLayout>
  );
}
