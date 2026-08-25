"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  X,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RichTextEditor } from "@/components/admin/ui/RichTextEditor";
import { MediaUploadGrid, type ProductMediaItem } from "@/components/admin/products/MediaUploadGrid";
import {
  VariantMatrixEditor,
  type OptionConfig,
  type GeneratedVariant,
} from "@/components/admin/products/VariantMatrixEditor";
import {
  SizeChartEditor,
  type SizeChartData,
} from "@/components/admin/products/SizeChartEditor";

export interface ProductFormData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  product_type: string;
  brand: string;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  sku: string;
  barcode: string | null;
  has_variants: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  tags: string[];
  seo_title: string;
  seo_description: string;
  weight?: number;
  track_inventory: boolean;
  continue_selling_out_of_stock: boolean;
  initial_inventory: number;
  images: ProductMediaItem[];
  options: OptionConfig[];
  variants: GeneratedVariant[];
  size_chart?: SizeChartData;
  metafields?: Record<string, string>;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}


interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  mode: "create" | "edit";
  productId?: string;
}

export function ProductForm({ initialData, mode, productId }: ProductFormProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isManualSlug, setIsManualSlug] = useState(Boolean(initialData?.slug));
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">(
    initialData?.status || "ACTIVE"
  );
  const [productType, setProductType] = useState(initialData?.product_type || "Apparel");
  const [brand, setBrand] = useState(initialData?.brand || "Rust & Revive");
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id || "");
  const [basePrice, setBasePrice] = useState<number | "">(initialData?.base_price ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">(
    initialData?.compare_at_price ?? ""
  );
  const [costPrice, setCostPrice] = useState<number | "">(initialData?.cost_price ?? "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [barcode, setBarcode] = useState(initialData?.barcode || "");
  const [hasVariants, setHasVariants] = useState(initialData?.has_variants ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [tags, setTags] = useState<string[]>(
    initialData?.tags || ["Apparel", "Archival", "Raw Denim"]
  );
  const [tagInput, setTagInput] = useState("");
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || "");
  const [weight, setWeight] = useState<number | "">(initialData?.weight ?? 0.5);
  const [weightUnit, setWeightUnit] = useState<"kg" | "g" | "lb" | "oz">("kg");
  const [trackInventory, setTrackInventory] = useState(initialData?.track_inventory ?? true);
  const [continueSelling, setContinueSelling] = useState(
    initialData?.continue_selling_out_of_stock ?? false
  );
  const [initialInventory, setInitialInventory] = useState<number>(
    initialData?.initial_inventory ?? 10
  );
  const [images, setImages] = useState<ProductMediaItem[]>(initialData?.images || []);
  const [options, setOptions] = useState<OptionConfig[]>(
    initialData?.options || [{ id: "opt-1", name: "Size", values: ["S", "M", "L", "XL"] }]
  );
  const [variants, setVariants] = useState<GeneratedVariant[]>(initialData?.variants || []);
  const [instagramVideo, setInstagramVideo] = useState(
    initialData?.metafields?.["instagram_video"] || ""
  );
  const [fabricSpec, setFabricSpec] = useState(
    initialData?.metafields?.["fabric_spec"] || "100% Heavyweight Cotton"
  );
  const [sizeChart, setSizeChart] = useState<SizeChartData | undefined>(
    initialData?.size_chart
  );
  const [template, setTemplate] = useState("Default product");

  // UI state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showSeoAdvanced, setShowSeoAdvanced] = useState(false);
  const [showMetafieldsAdvanced, setShowMetafieldsAdvanced] = useState(false);

  // Auto-generate slug from title if not manually customized
  useEffect(() => {
    if (!isManualSlug && mode === "create") {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }, [title, isManualSlug, mode]);

  // Auto-generate SKU from title if empty
  useEffect(() => {
    if (!sku && title && mode === "create") {
      const clean = title.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const acronym = clean.slice(0, 4) || "PRD";
      setSku(`RR-${acronym}-001`);
    }
  }, [title, sku, mode]);

  // Track dirty state for unsaved guard
  const markDirty = () => setIsDirty(true);

  // Unsaved changes beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create Category Inline
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setCreatingCat(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await fetchCategories();
        setCategoryId(json.data.id);
        setShowCategoryModal(false);
        setNewCatName("");
      }
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setCreatingCat(false);
    }
  };

  // Add Tag Pill
  const addTag = (tagStr: string) => {
    const trimmed = tagStr.trim().replace(/^,+|,+$/g, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      markDirty();
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    markDirty();
  };

  // Profit and Margin Calculations
  const { profit, margin } = useMemo(() => {
    const p = typeof basePrice === "number" ? basePrice : 0;
    const c = typeof costPrice === "number" ? costPrice : 0;
    if (p <= 0) return { profit: 0, margin: 0 };
    const prof = p - c;
    const marg = Math.round((prof / p) * 100);
    return { profit: prof, margin: marg };
  }, [basePrice, costPrice]);

  // Form Submission
  const handleSave = async (saveStatus?: "ACTIVE" | "DRAFT" | "ARCHIVED") => {
    const targetStatus = saveStatus || status;
    setErrorMsg(null);

    // Validation
    if (!title.trim()) {
      setErrorMsg("Product title is required.");
      return;
    }
    if (basePrice === "" || Number(basePrice) < 0) {
      setErrorMsg("Please enter a valid product price.");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("Product SKU is required.");
      return;
    }

    try {
      setIsSaving(true);

      const mediaIds = images
        .map((img) => img.id)
        .filter((id): id is string => Boolean(id));

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description || undefined,
        short_description: shortDescription.trim() || undefined,
        status: targetStatus,
        product_type: productType,
        brand: brand.trim(),
        category_id: categoryId || null,
        base_price: Number(basePrice),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        has_variants: hasVariants,
        is_featured: isFeatured,
        is_active: targetStatus === "ACTIVE",
        tags,
        seo_title: seoTitle.trim() || title.trim(),
        seo_description: seoDescription.trim() || shortDescription.trim() || undefined,
        media_ids: mediaIds,
        initial_inventory: Number(initialInventory) || 0,
        size_chart: sizeChart,
        variants: hasVariants
          ? variants.map((v) => ({
              title: v.title,
              sku: v.sku.toUpperCase(),
              price: v.price || Number(basePrice),
              compare_at_price: v.compare_at_price || null,
              cost_price: v.cost_price || null,
              option_1_name: v.option_1_name || null,
              option_1_value: v.option_1_value || null,
              option_2_name: v.option_2_name || null,
              option_2_value: v.option_2_value || null,
              option_3_name: v.option_3_name || null,
              option_3_value: v.option_3_value || null,
              initial_quantity: v.stock || 0,
              weight: v.weight || null,
            }))
          : undefined,
      };

      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save product");
      }

      setIsDirty(false);
      setSuccessToast(`Product successfully ${mode === "create" ? "created" : "updated"}!`);

      setTimeout(() => {
        router.push("/admin/products");
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while saving product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-28">
      {/* 1. Top Sticky Navigation & Action Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs px-4 sm:px-8 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/products"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9e472a]">
                  Products
                </span>
                <span className="text-slate-300">/</span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {title.trim() || (mode === "create" ? "Add Product" : "Edit Product")}
                </h1>
              </div>
              {isDirty && (
                <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  ● Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Discard
            </button>

            {status !== "DRAFT" && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave("DRAFT")}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
              >
                Save as draft
              </button>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(status)}
              className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{mode === "create" ? "Save Product" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Form Area */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Shopify Layout: Main Content (~68%) + Sidebar (~32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ========================================================================= */}
          {/* LEFT / MAIN COLUMN (lg:col-span-8) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Title & Description Card */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. 280GSM Heavyweight Boxy Cut Tee"
                  className="w-full px-4 py-2.5 text-base font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* Slug Handle */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center space-x-1 font-mono">
                  <span>Handle:</span>
                  <span className="text-slate-800 font-semibold">/products/{slug || "slug"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSlug(!isManualSlug)}
                  className="text-[#9e472a] hover:underline font-medium"
                >
                  {isManualSlug ? "Auto-generate handle" : "Edit handle"}
                </button>
              </div>

              {isManualSlug && (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    markDirty();
                  }}
                  placeholder="custom-url-handle"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              )}

              {/* Rich Text Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <RichTextEditor
                  value={description}
                  onChange={(val) => {
                    setDescription(val);
                    markDirty();
                  }}
                  placeholder="Describe craftsmanship, silhouettes, material weight, and sizing advice..."
                />
              </div>

              {/* Short Summary */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Short Editorial Description
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => {
                    setShortDescription(e.target.value);
                    markDirty();
                  }}
                  placeholder="Brief one-line snippet for cards and hover states"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </section>

            {/* 2. Media Upload Card (Cloudflare R2) */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Media</h3>
                  <p className="text-xs text-slate-500">
                    Upload images to Cloudflare R2. Drag to reorder, click star to set cover.
                  </p>
                </div>
              </div>

              <MediaUploadGrid
                images={images}
                onChange={(updatedImgs) => {
                  setImages(updatedImgs);
                  markDirty();
                }}
                productTitle={title}
              />
            </section>

            {/* 3. Category Selector */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-[#9e472a] hover:underline font-semibold"
                >
                  + Add new category
                </button>
              </div>

              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-medium text-slate-900"
              >
                <option value="">Uncategorized / General Garments</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </section>

            {/* 4. Pricing Card */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Pricing</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Price (৳ BDT) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">৳</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => {
                        setBasePrice(e.target.value === "" ? "" : parseFloat(e.target.value));
                        markDirty();
                      }}
                      placeholder="4500"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Compare-at Price (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">৳</span>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => {
                        setCompareAtPrice(e.target.value === "" ? "" : parseFloat(e.target.value));
                        markDirty();
                      }}
                      placeholder="7800"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Cost per item (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">৳</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => {
                        setCostPrice(e.target.value === "" ? "" : parseFloat(e.target.value));
                        markDirty();
                      }}
                      placeholder="2200"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Profit & Margin Indicators */}
              {typeof basePrice === "number" && basePrice > 0 && typeof costPrice === "number" && (
                <div className="pt-2 flex items-center space-x-6 text-xs border-t border-slate-100">
                  <div>
                    <span className="text-slate-500">Margin: </span>
                    <span className="font-bold text-emerald-700 font-mono">{margin}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Profit: </span>
                    <span className="font-bold text-emerald-700 font-mono">৳{profit.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </section>

            {/* 5. Inventory & Simple Product Card */}
            {!hasVariants && (
              <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Inventory</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      SKU <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        markDirty();
                      }}
                      placeholder="RR-TEE-001"
                      className="w-full px-3 py-2 text-xs font-mono uppercase text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Available Stock
                    </label>
                    <input
                      type="number"
                      value={initialInventory}
                      onChange={(e) => {
                        setInitialInventory(parseInt(e.target.value, 10) || 0);
                        markDirty();
                      }}
                      placeholder="30"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Barcode (ISBN, UPC)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => {
                        setBarcode(e.target.value);
                        markDirty();
                      }}
                      placeholder="Optional barcode"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackInventory}
                      onChange={(e) => {
                        setTrackInventory(e.target.checked);
                        markDirty();
                      }}
                      className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a]"
                    />
                    <span>Track inventory quantity in Supabase</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={continueSelling}
                      onChange={(e) => {
                        setContinueSelling(e.target.checked);
                        markDirty();
                      }}
                      className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a]"
                    />
                    <span>Continue selling when out of stock</span>
                  </label>
                </div>
              </section>
            )}

            {/* 6. Variants Section (Multi-option Cartesian Matrix) */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Variants</h3>
                  <p className="text-xs text-slate-500">
                    Add options like size or color to generate multiple SKU variations.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => {
                      setHasVariants(e.target.checked);
                      markDirty();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9e472a]" />
                </label>
              </div>

              {hasVariants && (
                <VariantMatrixEditor
                  basePrice={Number(basePrice) || 0}
                  baseSku={sku}
                  productImages={images}
                  options={options}
                  onOptionsChange={(opts) => {
                    setOptions(opts);
                    markDirty();
                  }}
                  variants={variants}
                  onVariantsChange={(vars) => {
                    setVariants(vars);
                    markDirty();
                  }}
                />
              )}
            </section>

            {/* 7. Size Chart & Garment Measurements Card */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Size Chart & Garment Measurements
                </h3>
                <p className="text-xs text-slate-500">
                  Add an interactive size table (Chest, Length, Shoulder, Sleeve) or upload a direct size chart image. This will display on the product page.
                </p>
              </div>

              <SizeChartEditor
                value={sizeChart}
                onChange={(sc) => {
                  setSizeChart(sc);
                  markDirty();
                }}
                productTitle={title}
              />
            </section>

            {/* 8. Shipping Specs */}
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Shipping</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Weight
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => {
                        setWeight(e.target.value === "" ? "" : parseFloat(e.target.value));
                        markDirty();
                      }}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value as "kg" | "g" | "lb" | "oz")}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    defaultValue="Bangladesh"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </section>

            {/* 8. Additional Metafields (Collapsible) */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMetafieldsAdvanced(!showMetafieldsAdvanced)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Additional Metafields & Specs
                  </h3>
                  <p className="text-xs text-slate-500">Instagram video reel, custom fabric weave, tailoring specs</p>
                </div>
                {showMetafieldsAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showMetafieldsAdvanced && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Instagram Video Reel URL
                    </label>
                    <input
                      type="url"
                      value={instagramVideo}
                      onChange={(e) => {
                        setInstagramVideo(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://www.instagram.com/reel/..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Fabric Composition
                    </label>
                    <input
                      type="text"
                      value={fabricSpec}
                      onChange={(e) => {
                        setFabricSpec(e.target.value);
                        markDirty();
                      }}
                      placeholder="e.g. 14oz Raw Japanese Selvedge Denim"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT / SIDEBAR COLUMN (lg:col-span-4) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* 1. Status Card */}
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED");
                  markDirty();
                }}
                className={`w-full px-3.5 py-2 text-xs font-bold rounded-xl border focus:outline-none transition-colors ${
                  status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : status === "DRAFT"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                <option value="ACTIVE">● Active (Visible on Storefront)</option>
                <option value="DRAFT">○ Draft (Hidden from Storefront)</option>
                <option value="ARCHIVED">✕ Archived</option>
              </select>

              <label className="flex items-center space-x-2 text-xs text-slate-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => {
                    setIsFeatured(e.target.checked);
                    markDirty();
                  }}
                  className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a]"
                />
                <span className="font-medium">Mark as Featured Product</span>
              </label>
            </section>

            {/* 2. Publishing / Sales Channels */}
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Publishing Channels
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Online Storefront</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Point of Sale (POS)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Ready</span>
                </div>
              </div>
            </section>

            {/* 3. Product Organization */}
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Product Organization
              </h4>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Product Type
                </label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => {
                    setProductType(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Shirts, Denim, Outerwear"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vendor / Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    markDirty();
                  }}
                  placeholder="Rust & Revive"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Tags Pill Input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tags (press Enter to add)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px] focus-within:border-slate-900">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-800 text-[11px] font-medium rounded"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    onBlur={() => {
                      if (tagInput) addTag(tagInput);
                    }}
                    placeholder="Add tag..."
                    className="flex-1 min-w-[70px] text-xs bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 4. Theme Template */}
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                Theme Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
              >
                <option value="Default product">Default product</option>
                <option value="Archival Editorial">Archival Editorial</option>
                <option value="Limited Release">Limited Release</option>
              </select>
            </section>

            {/* 5. Google SERP & SEO Listing Preview */}
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Search Engine Listing
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSeoAdvanced(!showSeoAdvanced)}
                  className="text-xs text-[#9e472a] hover:underline font-semibold"
                >
                  {showSeoAdvanced ? "Hide edit" : "Edit SEO"}
                </button>
              </div>

              {/* SERP Snippet Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                <p className="text-[11px] text-emerald-800 font-mono truncate">
                  https://rustrevive.store/products/{slug || "slug"}
                </p>
                <h5 className="text-xs font-semibold text-blue-700 hover:underline line-clamp-1">
                  {seoTitle || title || "Product Title | Rust & Revive"}
                </h5>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {seoDescription ||
                    shortDescription ||
                    "Shop handcrafted garments designed for longevity, raw heavyweight fabrics, and archival street tailoring."}
                </p>
              </div>

              {/* Advanced SEO Inputs */}
              {showSeoAdvanced && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      SEO Page Title
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value);
                        markDirty();
                      }}
                      placeholder={title || "SEO Page Title"}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Meta description for search engines..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900">Add New Category</h4>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Knitwear, Leather, Denims"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingCat || !newCatName.trim()}
                onClick={handleCreateCategory}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {creatingCat ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
