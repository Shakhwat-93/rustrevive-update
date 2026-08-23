"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  X,
  Star,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { getMediaUrl } from "@/lib/media/media-url";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

interface VariantItem {
  size: string;
  sku: string;
  price: number;
  stock: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const { showToast } = useAdminDialog();
  const [creatingCat, setCreatingCat] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Product Basic Info
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("ACTIVE");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [brand, setBrand] = useState("Rust & Revive");
  const [tags, setTags] = useState("apparel, luxury, raw, heavyweight");
  const [isFeatured, setIsFeatured] = useState(false);

  // Pricing
  const [basePrice, setBasePrice] = useState<number | "">(4500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">(2200);

  // Inventory
  const [initialInventory, setInitialInventory] = useState<number>(30);
  const [barcode, setBarcode] = useState("");

  // Media
  const [images, setImages] = useState<ProductImage[]>([
    {
      url: "/placeholder-garment.webp",
      altText: "Product Main View",
      isPrimary: true,
    },
  ]);

  // Variants
  const [hasVariants, setHasVariants] = useState(true);
  const [variants, setVariants] = useState<VariantItem[]>([
    { size: "S", sku: "", price: 4500, stock: 8 },
    { size: "M", sku: "", price: 4500, stock: 12 },
    { size: "L", sku: "", price: 4500, stock: 8 },
    { size: "XL", sku: "", price: 4500, stock: 2 },
  ]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
        if (json.data.length > 0 && !categoryId) {
          setCategoryId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Title change & Auto-Slug / Auto-SKU
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const genSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(genSlug);

    if (!sku || sku.startsWith("RR-")) {
      const acronym = val
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4) || "PRD";
      setSku(`RR-${acronym}-001`);
    }
  };

  // Live profit calculation
  const { profit, margin } = useMemo(() => {
    const numPrice = Number(basePrice) || 0;
    const numCost = Number(costPrice) || 0;
    if (numPrice <= 0) return { profit: 0, margin: 0 };
    const p = numPrice - numCost;
    const m = Math.round((p / numPrice) * 100);
    return { profit: p, margin: m };
  }, [basePrice, costPrice]);

  // Add Image via Direct URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    setImages((prev) => [
      ...prev,
      {
        url: trimmed,
        altText: title || "Product image",
        isPrimary: prev.length === 0,
      },
    ]);
    setImageUrlInput("");
  };

  // Upload Image File to R2
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", title || file.name);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Upload failed");
      }

      const media = json.data;
      setImages((prev) => {
        const isFirst = prev.length === 0 || (prev.length === 1 && Boolean(prev[0]?.url.includes("placeholder")));
        const filtered = prev.filter((img) => !img.url.includes("placeholder"));
        return [
          ...filtered,
          {
            id: media.id,
            url: media.public_url,
            altText: media.original_filename,
            isPrimary: isFirst,
          },
        ];
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Set Primary Image
  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary) && next[0]) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  // Quick Size Presets
  const handleApplyPreset = (preset: "APPAREL" | "PANTS" | "ONE_SIZE") => {
    const numPrice = Number(basePrice) || 4500;
    const baseSku = sku || "RR-ITEM";

    if (preset === "APPAREL") {
      setVariants([
        { size: "S", sku: `${baseSku}-S`, price: numPrice, stock: 8 },
        { size: "M", sku: `${baseSku}-M`, price: numPrice, stock: 12 },
        { size: "L", sku: `${baseSku}-L`, price: numPrice, stock: 8 },
        { size: "XL", sku: `${baseSku}-XL`, price: numPrice, stock: 2 },
      ]);
    } else if (preset === "PANTS") {
      setVariants([
        { size: "30", sku: `${baseSku}-30`, price: numPrice, stock: 6 },
        { size: "32", sku: `${baseSku}-32`, price: numPrice, stock: 10 },
        { size: "34", sku: `${baseSku}-34`, price: numPrice, stock: 10 },
        { size: "36", sku: `${baseSku}-36`, price: numPrice, stock: 4 },
      ]);
    } else {
      setVariants([
        { size: "One Size", sku: `${baseSku}-OS`, price: numPrice, stock: 25 },
      ]);
    }
  };

  // Add Custom Variant
  const handleAddVariant = () => {
    const baseSku = sku || "RR-ITEM";
    setVariants((prev) => [
      ...prev,
      {
        size: "Custom",
        sku: `${baseSku}-${prev.length + 1}`,
        price: Number(basePrice) || 4500,
        stock: 5,
      },
    ]);
  };

  // Create Category Inline
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setCreatingCat(true);
      const catSlug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), slug: catSlug }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCategories((prev) => [...prev, json.data]);
        setCategoryId(json.data.id);
        setShowCategoryModal(false);
        setNewCatName("");
        showToast(`Category "${json.data.name}" created`, "success");
      }
    } catch {
      showToast("Failed to create category", "error");
    } finally {
      setCreatingCat(false);
    }
  };

  // Save Product Handler
  const handleSaveProduct = async (overrideStatus?: "ACTIVE" | "DRAFT") => {
    if (!title.trim()) {
      showToast("Please enter a Product Title.", "warning");
      return;
    }
    if (!sku.trim()) {
      showToast("Please enter a unique SKU (e.g. RR-TSH-001).", "warning");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      showToast("Please enter a valid selling price.", "warning");
      return;
    }

    try {
      setSaving(true);

      const validMediaIds = images.map((img) => img.id).filter(Boolean) as string[];

      const payload = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description.trim(),
        short_description: shortDescription.trim() || undefined,
        status: overrideStatus || status,
        category_id: categoryId || null,
        brand: brand.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        base_price: Number(basePrice),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : undefined,
        cost_price: costPrice ? Number(costPrice) : undefined,
        initial_inventory: Number(initialInventory) || 0,
        is_featured: isFeatured,
        has_variants: hasVariants && variants.length > 0,
        variants: hasVariants
          ? variants.map((v) => ({
              title: `${title} - ${v.size}`,
              sku: v.sku || `${sku}-${v.size.toUpperCase()}`,
              price: Number(v.price),
              option_1_name: "Size",
              option_1_value: v.size,
              initial_quantity: Number(v.stock),
            }))
          : undefined,
        media_ids: validMediaIds,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        seo_title: seoTitle.trim() || title,
        seo_description: seoDescription.trim() || shortDescription || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create product");
      }

      showToast(`Product "${title}" created successfully`, "success");
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Product creation error";
      showToast(`Error: ${msg}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageLayout
      title="Add New Product"
      subtitle="Create, configure images, set pricing, and publish a new item to your luxury storefront catalog."
      actions={
        <>
          <AdminButton variant="secondary" href="/admin/products" icon={ArrowLeft}>
            Discard
          </AdminButton>
          <AdminButton
            variant="secondary"
            isLoading={saving}
            onClick={() => handleSaveProduct("DRAFT")}
          >
            Save Draft
          </AdminButton>
          <AdminButton
            icon={Save}
            isLoading={saving}
            onClick={() => handleSaveProduct("ACTIVE")}
          >
            Publish Product
          </AdminButton>
        </>
      }
    >
      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900">Add New Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Heavyweight Outerwear"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingCat}
                onClick={handleCreateCategory}
                className="flex-1 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer disabled:opacity-60"
              >
                {creatingCat ? "Creating..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info, Media, Pricing, Variants */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Basic Information */}
          <AdminCard title="Product Details">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14.5oz Raw Selvedge Denim Pants"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-medium text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    SKU (Stock Keeping Unit) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RR-DNM-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    placeholder="raw-selvedge-denim-pants"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Short Tagline / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavyweight Japanese shuttle-loomed denim engineered for lifetime wear."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Editorial Description & Craftsmanship Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe garment weave, fabric origin, weight, wash care instructions, and silhouette..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>
            </div>
          </AdminCard>

          {/* 2. Media & Product Photos */}
          <AdminCard title="Product Media & Photos">
            <div className="space-y-5">
              {/* Image Grid Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 bg-slate-100 group transition-all ${
                        img.isPrimary ? "border-[#9e472a] shadow-sm" : "border-slate-200"
                      }`}
                    >
                      <Image
                        src={getMediaUrl(img.url)}
                        alt={img.altText || "Product photo"}
                        fill
                        className="object-cover object-center"
                      />

                      {/* Primary Badge */}
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 z-10 bg-[#9e472a] text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Primary</span>
                        </div>
                      )}

                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 space-y-2">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="px-2 py-1 bg-white text-slate-900 text-[11px] font-semibold rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="px-2 py-1 bg-rose-600 text-white text-[11px] font-semibold rounded hover:bg-rose-700 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* File Upload to R2 */}
                <label className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-all">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                  <Upload className="w-6 h-6 text-[#9e472a] mb-2 stroke-[1.5]" />
                  <span className="text-xs font-semibold text-slate-900">
                    {uploadingImage ? "Uploading to Cloudflare R2..." : "Upload Photo File"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP up to 10MB</span>
                </label>

                {/* Add by URL */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Or Add by Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://pub-...r2.dev/photo.webp"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Add Image Link
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* 3. Pricing & Financials */}
          <AdminCard title="Pricing & Profitability (BDT ৳)">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Selling Price (৳) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono text-sm font-semibold">৳</span>
                    <input
                      type="number"
                      placeholder="4500"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Compare-At Price (৳)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono text-sm font-semibold">৳</span>
                    <input
                      type="number"
                      placeholder="5500"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Strikethrough original price</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cost per Item (৳)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono text-sm font-semibold">৳</span>
                    <input
                      type="number"
                      placeholder="2200"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">For internal profit calculation</p>
                </div>
              </div>

              {/* Profit Margin Indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-600">
                  Estimated Gross Profit:{" "}
                  <strong className="text-emerald-700 font-bold">
                    ৳{profit.toLocaleString("en-US")}
                  </strong>
                </div>
                <div className="text-slate-600">
                  Margin:{" "}
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${margin >= 40 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {margin}%
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* 4. Sizes & Variants */}
          <AdminCard title="Sizes & Variants">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 accent-[#9e472a]"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    This product has multiple size or fit variants
                  </span>
                </label>

                {hasVariants && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-mono">Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("APPAREL")}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      S/M/L/XL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("PANTS")}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      30/32/34/36
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("ONE_SIZE")}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      One Size
                    </button>
                  </div>
                )}
              </div>

              {hasVariants && (
                <div className="space-y-3 pt-2">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Size / Option</th>
                          <th className="py-2.5 px-3 text-left">Variant SKU</th>
                          <th className="py-2.5 px-3 text-right">Price (৳)</th>
                          <th className="py-2.5 px-3 text-right">Stock</th>
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {variants.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.size}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariants((prev) =>
                                    prev.map((item, idx) => (idx === i ? { ...item, size: val } : item))
                                  );
                                }}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-semibold text-slate-900 bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.sku}
                                placeholder={`${sku}-${v.size}`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariants((prev) =>
                                    prev.map((item, idx) => (idx === i ? { ...item, sku: val } : item))
                                  );
                                }}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 bg-white"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setVariants((prev) =>
                                    prev.map((item, idx) => (idx === i ? { ...item, price: val } : item))
                                  );
                                }}
                                className="w-24 px-2 py-1 text-xs border border-slate-200 rounded text-right font-bold text-slate-900 bg-white ml-auto"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setVariants((prev) =>
                                    prev.map((item, idx) => (idx === i ? { ...item, stock: val } : item))
                                  );
                                }}
                                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded text-right font-bold text-slate-900 bg-white ml-auto"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View (< sm) */}
                  <div className="block sm:hidden space-y-2.5">
                    {variants.map((v, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Size:</span>
                            <input
                              type="text"
                              value={v.size}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, size: val } : item))
                                );
                              }}
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-bold text-slate-900 bg-white"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Price (৳)</span>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVariants((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, price: val } : item))
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-bold text-slate-900 bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Stock Count</span>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVariants((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, stock: val } : item))
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-bold text-slate-900 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#9e472a] hover:underline cursor-pointer pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Size Option</span>
                  </button>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Right Col: Category, Status, Organization, SEO */}
        <div className="space-y-6">

          {/* 1. Status & Visibility */}
          <AdminCard title="Publishing Status">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Visibility
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED")}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ACTIVE">🟢 Active (Live on Storefront)</option>
                  <option value="DRAFT">🟡 Draft (Hidden from Public)</option>
                  <option value="ARCHIVED">🔴 Archived</option>
                </select>
              </div>

              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 accent-[#9e472a]"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Featured on Homepage</span>
                  <span className="text-[11px] text-slate-400 block">Shows in curated signature collection</span>
                </div>
              </label>
            </div>
          </AdminCard>

          {/* 2. Category & Brand */}
          <AdminCard title="Organization & Category">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] font-semibold text-[#9e472a] hover:underline cursor-pointer"
                  >
                    + New
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brand / Line
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="selvedge, raw, heavyweight, winter"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>
          </AdminCard>

          {/* 3. Base Inventory */}
          <AdminCard title="Inventory Management">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Initial Stock
                </label>
                <input
                  type="number"
                  value={initialInventory}
                  onChange={(e) => setInitialInventory(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Synced into Postgres ledger for live oversell prevention.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Barcode / UPC (Optional)
                </label>
                <input
                  type="text"
                  placeholder="880923849102"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </AdminCard>

          {/* 4. SEO & Search Snippet */}
          <AdminCard title="Search Engine Preview">
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="text-[11px] text-emerald-800 font-mono">rustrevive.store › products › {slug || "sample-item"}</div>
                <div className="text-sm font-semibold text-blue-800 line-clamp-1">{seoTitle || title || "Product Title"} | Rust &amp; Revive</div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {seoDescription || shortDescription || "Explore luxury hand-crafted garments from Rust & Revive Bangladesh."}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  placeholder={title || "Product SEO Title"}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Description</label>
                <textarea
                  rows={2}
                  placeholder="Search snippet description..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </AdminCard>

        </div>
      </div>
    </AdminPageLayout>
  );
}
