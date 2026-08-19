"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronLeft, Plus, Trash2, Star } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  area?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
}

function AddressModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Address>;
  onSave: (data: Partial<Address>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    phone: initial?.phone ?? "",
    address_line_1: initial?.address_line_1 ?? "",
    address_line_2: initial?.address_line_2 ?? "",
    city: initial?.city ?? "",
    area: initial?.area ?? "",
    postal_code: initial?.postal_code ?? "",
    is_default: initial?.is_default ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#ded7c8] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#ded7c8] flex justify-between items-center">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#141312]">
            {initial?.id ? "Edit Address" : "New Address"}
          </h2>
          <button onClick={onClose} className="text-[#8c8577] hover:text-[#141312] text-xs font-mono cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700">{error}</div>
          )}

          <div>
            <label className="block text-[#141312] font-semibold mb-1.5">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={set("full_name")}
              required
              className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
            />
          </div>
          <div>
            <label className="block text-[#141312] font-semibold mb-1.5">Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              required
              className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
            />
          </div>
          <div>
            <label className="block text-[#141312] font-semibold mb-1.5">Address Line 1 *</label>
            <input
              type="text"
              value={form.address_line_1}
              onChange={set("address_line_1")}
              required
              className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
            />
          </div>
          <div>
            <label className="block text-[#141312] font-semibold mb-1.5">Address Line 2</label>
            <input
              type="text"
              value={form.address_line_2}
              onChange={set("address_line_2")}
              className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#141312] font-semibold mb-1.5">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={set("city")}
                required
                className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
              />
            </div>
            <div>
              <label className="block text-[#141312] font-semibold mb-1.5">Area</label>
              <input
                type="text"
                value={form.area}
                onChange={set("area")}
                className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#141312] font-semibold mb-1.5">Postal Code</label>
            <input
              type="text"
              value={form.postal_code}
              onChange={set("postal_code")}
              className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
            />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((prev) => ({ ...prev, is_default: e.target.checked }))}
              className="accent-[#9e472a]"
            />
            <span className="text-[#141312] font-semibold">Set as default address</span>
          </label>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#ded7c8] text-[#5c574e] hover:border-[#141312] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editData?: Address }>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/addresses");
      const data = await res.json();
      if (data?.data) setAddresses(data.data);
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSave = async (formData: Partial<Address>) => {
    if (modal.editData?.id) {
      const res = await fetch(`/api/account/addresses/${modal.editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update address.");
    } else {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add address.");
    }
    await fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      {modal.open && (
        <AddressModal
          initial={modal.editData}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-1 pt-4">
            <Link
              href="/account"
              className="inline-flex items-center space-x-1 text-xs font-mono text-[#8c8577] hover:text-[#141312] transition-colors mb-4"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Account</span>
            </Link>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold block">
              Delivery Destinations
            </span>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">Saved Addresses</h1>
              <button
                onClick={() => setModal({ open: true })}
                className="flex items-center space-x-1.5 text-xs font-mono px-4 py-2.5 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-[#e8e2d5] p-8 text-center text-xs font-mono text-[#8c8577]">
              Loading addresses...
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <MapPin className="w-8 h-8 text-[#9e472a] mx-auto" />
              <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                No saved addresses found
              </h3>
              <p className="text-xs font-sans text-[#5c574e] max-w-sm mx-auto">
                Add a default delivery destination to speed up future checkouts.
              </p>
              <button
                onClick={() => setModal({ open: true })}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white border p-5 shadow-xs space-y-3 ${addr.is_default ? "border-[#9e472a]" : "border-[#e8e2d5]"}`}
                >
                  {addr.is_default && (
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-[#9e472a] font-semibold uppercase tracking-wider">
                      <Star className="w-3 h-3" />
                      <span>Default</span>
                    </div>
                  )}
                  <div className="text-xs font-mono space-y-0.5">
                    <p className="font-semibold text-[#141312]">{addr.full_name}</p>
                    <p className="text-[#5c574e]">{addr.phone}</p>
                    <p className="text-[#5c574e]">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-[#5c574e]">{addr.address_line_2}</p>}
                    <p className="text-[#5c574e]">
                      {[addr.area, addr.city, addr.postal_code].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-[#5c574e]">{addr.country}</p>
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => setModal({ open: true, editData: addr })}
                      className="text-[11px] font-mono text-[#5c574e] hover:text-[#141312] underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="text-[11px] font-mono text-rose-500 hover:text-rose-700 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === addr.id ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
