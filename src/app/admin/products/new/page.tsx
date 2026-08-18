"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Pants");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [tags, setTags] = useState("raw, vintage, heavyweight");

  // Pricing State
  const [price, setPrice] = useState<number | "">("");
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [costPerItem, setCostPerItem] = useState<number | "">("");

  // Inventory State
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [quantity, setQuantity] = useState(20);

  // Media
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop");

  // Variants State
  const [variants, setVariants] = useState<{ size: string; color: string; price: number; stock: number }[]>([
    { size: "S", color: "Raw Indigo", price: 8800, stock: 5 },
    { size: "M", color: "Raw Indigo", price: 8800, stock: 8 },
    { size: "L", color: "Raw Indigo", price: 8800, stock: 5 },
    { size: "XL", color: "Raw Indigo", price: 8800, stock: 2 },
  ]);

  // Live Profit & Margin Calculation
  const { profit, margin } = useMemo(() => {
    const numPrice = Number(price) || 0;
    const numCost = Number(costPerItem) || 0;
    if (numPrice <= 0) return { profit: 0, margin: 0 };
    const p = numPrice - numCost;
    const m = Math.round((p / numPrice) * 100);
    return { profit: p, margin: m };
  }, [price, costPerItem]);

  const handleSave = () => {
    if (!title) {
      alert("Product title is required.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setNotification("Product created successfully!");
      setTimeout(() => router.push("/admin/products"), 1500);
    }, 600);
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size: "M", color: "New Color", price: Number(price) || 5000, stock: 5 },
    ]);
  };

  const handleDeleteVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products"
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Product</h1>
            <p className="text-xs text-slate-500">Configure new garment, pricing, and variants.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? "Saving..." : "Save Product"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 8 COLS: Primary Product Information */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Title &amp; Description
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 14.5oz Raw Selvedge Denim Baggy Pants"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe garment cut, Japanese cotton mill fabric, construction details, and fit guidance..."
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Media Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Product Media (Cloudflare R2)
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Image URL (or Cloudflare R2 CDN Asset)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Pricing & Cost Card with Live Margin Calculator */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Pricing &amp; Margins
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Price (৳ BDT) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Compare-At Price (৳)
                </label>
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cost per Item (৳)
                </label>
                <input
                  type="number"
                  value={costPerItem}
                  onChange={(e) => setCostPerItem(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Live Profit & Margin Summary Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Estimated Profit: <strong className="text-slate-900 font-mono">৳{profit.toLocaleString("en-US")}</strong>
              </span>
              <span className="text-slate-600">
                Gross Margin: <strong className="text-emerald-700 font-mono">{margin}%</strong>
              </span>
            </div>
          </div>

          {/* Inventory Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Inventory &amp; SKUs
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. RR-PNT-RAW-001"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Barcode (ISBN, UPC, GTIN)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 880923849102"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="rounded text-[#9e472a] focus:ring-[#9e472a]"
                />
                <span>Track inventory count</span>
              </label>

              {trackInventory && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Available:</span>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-20 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs font-mono text-slate-900 text-center"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Variants Matrix Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Variants Matrix (Size &amp; Color)
              </h2>
              <button
                onClick={handleAddVariant}
                className="flex items-center space-x-1 text-xs text-[#9e472a] font-medium hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px]">
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3">Color</th>
                    <th className="py-2 px-3">Price (৳)</th>
                    <th className="py-2 px-3">Stock</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((v, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, size: val } : item))
                            );
                          }}
                          className="w-16 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, color: val } : item))
                            );
                          }}
                          className="w-28 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                            );
                          }}
                          className="w-24 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs font-mono text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                            );
                          }}
                          className="w-16 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs font-mono text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteVariant(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: Status, Organization & SEO */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing Status Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product Status
            </h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "draft" | "archived")}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="active">Active (Visible in Storefront)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Organization & Categorization Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product Organization
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Pants">Pants &amp; Denim</option>
                <option value="Jackets">Jackets &amp; Outerwear</option>
                <option value="T-Shirts">Heavyweight T-Shirts</option>
                <option value="Belts">Leather Belts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags..."
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Search Engine Listing Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-[#9e472a]" />
              <span>Search Engine Listing</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-xs">
              <div className="text-blue-700 font-medium line-clamp-1">
                {title || "Product Title"} — Rust &amp; Revive
              </div>
              <div className="text-emerald-700 font-mono text-[10px]">
                https://rustrevive.store/products/{title ? title.toLowerCase().replace(/\s+/g, "-") : "product-slug"}
              </div>
              <div className="text-slate-500 text-[11px] line-clamp-2">
                {description || "Timeless garments crafted from raw denim and heavyweight cotton."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
