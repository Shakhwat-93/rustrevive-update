"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_days: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminShippingSettingsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState(80);
  const [formEstimatedDays, setFormEstimatedDays] = useState("24-48 hours");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/shipping-methods");
      const data = await res.json();
      if (data?.data) {
        setMethods(data.data);
      }
    } catch (err) {
      console.error("Failed to load shipping methods:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormPrice(100);
    setFormEstimatedDays("24-48 hours");
    setFormIsActive(true);
    setFormSortOrder(methods.length + 1);
    setShowModal(true);
  };

  const handleOpenEdit = (method: ShippingMethod) => {
    setEditingId(method.id);
    setFormName(method.name);
    setFormDescription(method.description || "");
    setFormPrice(method.price);
    setFormEstimatedDays(method.estimated_days);
    setFormIsActive(method.is_active);
    setFormSortOrder(method.sort_order);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        price: Number(formPrice),
        estimated_days: formEstimatedDays.trim(),
        is_active: formIsActive,
        sort_order: Number(formSortOrder),
      };

      if (editingId) {
        const res = await fetch(`/api/admin/shipping-methods/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch("/api/admin/shipping-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
      }

      setShowModal(false);
      fetchMethods();
    } catch (err) {
      alert((err as Error).message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping method?")) return;
    try {
      const res = await fetch(`/api/admin/shipping-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchMethods();
    } catch (err) {
      alert((err as Error).message || "Delete failed");
    }
  };

  return (
    <AdminPageLayout
      title="Shipping & Delivery Methods"
      subtitle="Configure delivery zones, rates (Inside Dhaka, Sub-Dhaka, Outside Dhaka), and timelines for checkout."
      actions={
        <div className="flex items-center space-x-2">
          <Link
            href="/admin/fulfillment"
            className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-mono rounded hover:bg-slate-100 transition-colors flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Fulfillments</span>
          </Link>
          <AdminButton variant="secondary" icon={RefreshCw} onClick={fetchMethods} isLoading={loading}>
            Refresh
          </AdminButton>
          <AdminButton variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Method
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Method Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`bg-white border rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                m.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Order #{m.sort_order}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      m.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.is_active ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>

                <h3 className="font-serif text-base uppercase tracking-wide text-slate-900 font-bold">
                  {m.name}
                </h3>

                {m.description && (
                  <p className="text-xs font-sans text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                )}

                <div className="pt-2 flex items-baseline justify-between border-t border-slate-100 font-mono">
                  <span className="text-xs text-slate-500">{m.estimated_days}</span>
                  <span className="text-lg font-bold text-amber-800">৳{m.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-2.5 py-1 text-xs font-mono text-rose-600 hover:text-rose-800 border border-rose-200 rounded hover:bg-rose-50 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-800" />
                <h3 className="font-serif text-base uppercase tracking-wider text-slate-900 font-bold">
                  {editingId ? "Edit Shipping Method" : "Add Shipping Method"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs font-mono text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Method Name (e.g. Inside Dhaka, Sub-Dhaka) *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Delivery Rate (BDT ৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Coverage Details / Sub-Districts (Optional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Keraniganj, Gazipur, Narayanganj, Savar"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Estimated Transit Time *
                </label>
                <input
                  type="text"
                  value={formEstimatedDays}
                  onChange={(e) => setFormEstimatedDays(e.target.value)}
                  placeholder="e.g. 24-48 hours"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sort Priority</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
                  />
                </div>

                <div className="flex items-center pt-5 space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="accent-slate-900 w-4 h-4"
                  />
                  <label htmlFor="isActiveCheck" className="text-slate-800 cursor-pointer select-none">
                    Active &amp; Visible
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-amber-800 text-white font-semibold rounded transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Method"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
