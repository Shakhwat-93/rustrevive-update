"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    short_description: "",
    status: "DRAFT" as "DRAFT" | "ACTIVE",
    sku: "",
    base_price: 0,
    compare_at_price: 0,
    cost_price: 0,
    has_variants: false,
    initial_inventory: 10,
    seo_title: "",
    seo_description: "",
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === "" || prev.slug === generatedSlug.slice(0, -1) ? generatedSlug : prev.slug,
    }));
  };

  const handleSave = async (statusOverride?: "DRAFT" | "ACTIVE") => {
    if (!form.title || !form.sku || form.base_price <= 0) {
      alert("Please enter a Title, SKU, and Base Price (BDT).");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        status: statusOverride || form.status,
        base_price: Number(form.base_price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        cost_price: form.cost_price ? Number(form.cost_price) : undefined,
        initial_inventory: Number(form.initial_inventory),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create product");
      }

      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Creation error";
      alert(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageLayout
      title="Add New Garment"
      subtitle="Create a new garment piece in the catalog with real database persistence."
      actions={
        <>
          <AdminButton variant="secondary" href="/admin/products" icon={ArrowLeft}>
            Discard
          </AdminButton>
          <AdminButton
            variant="secondary"
            isLoading={saving}
            onClick={() => handleSave("DRAFT")}
          >
            Save Draft
          </AdminButton>
          <AdminButton
            icon={Save}
            isLoading={saving}
            onClick={() => handleSave("ACTIVE")}
          >
            Publish Product
          </AdminButton>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14.5oz Raw Selvedge Denim Pants"
                  value={form.title}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RR-DNM-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed editorial garment craftsmanship, weave, and fit notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Pricing (BDT ৳)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Price (৳) *
                </label>
                <input
                  type="number"
                  placeholder="6500"
                  value={form.base_price || ""}
                  onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Compare-at Price (৳)
                </label>
                <input
                  type="number"
                  placeholder="7800"
                  value={form.compare_at_price || ""}
                  onChange={(e) => setForm({ ...form, compare_at_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cost per Item (৳)
                </label>
                <input
                  type="number"
                  placeholder="3200"
                  value={form.cost_price || ""}
                  onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Right Col: Inventory & Status */}
        <div className="space-y-6">
          <AdminCard title="Inventory">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Stock Count
              </label>
              <input
                type="number"
                value={form.initial_inventory}
                onChange={(e) => setForm({ ...form, initial_inventory: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Will be automatically initialized in Supabase inventory ledger.
              </p>
            </div>
          </AdminCard>

          <AdminCard title="Search Engine Optimization">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  SEO Title
                </label>
                <input
                  type="text"
                  placeholder={form.title || "Rust & Revive Garment"}
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  SEO Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Meta description for search engine rich snippets..."
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageLayout>
  );
}
