"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";

interface ProductImage {
  id?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params["id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("ACTIVE");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Fetch Real Product from API
  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/admin/products/${productId}`);
        const json = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message || "Failed to load product details");
        }

        const p = json.data;
        setTitle(p.title || "");
        setDescription(p.description || "");
        setShortDescription(p.short_description || "");
        setStatus(p.status || "ACTIVE");
        setSku(p.sku || "");
        setPrice(p.base_price || 0);
        setCompareAtPrice(p.compare_at_price || "");
        setCostPrice(p.cost_price || "");

        // Map Media
        const mappedImages: ProductImage[] = (p.product_media || []).map((pm: {
          id: string;
          media_id: string;
          is_primary: boolean;
          media?: { id: string; public_url: string; alt_text: string };
        }) => ({
          id: pm.media?.id || pm.media_id,
          url: pm.media?.public_url || "/placeholder-garment.webp",
          altText: pm.media?.alt_text || p.title,
          isPrimary: pm.is_primary,
        }));

        setImages(mappedImages);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Failed to load product", "error");
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const { profit, margin } = useMemo(() => {
    const numPrice = Number(price) || 0;
    const numCost = Number(costPrice) || 0;
    if (numPrice <= 0) return { profit: 0, margin: 0 };
    const p = numPrice - numCost;
    const m = Math.round((p / numPrice) * 100);
    return { profit: p, margin: m };
  }, [price, costPrice]);

  // Handle Automatic WebP File Upload to Cloudflare R2
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
        const isFirst = prev.length === 0;
        return [
          ...prev,
          {
            id: media.id,
            url: media.public_url,
            altText: media.original_filename,
            isPrimary: isFirst,
          },
        ];
      });
      showToast("Image automatically converted to WebP and uploaded to R2!");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Add Manual Image URL
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

  // Set Primary Image
  const handleSetPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  // Delete Image
  const handleDeleteImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary) && next[0]) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  // Save Updates
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const mediaIds = images.map((img) => img.id).filter(Boolean) as string[];

      const payload = {
        title,
        description,
        short_description: shortDescription,
        status,
        sku,
        base_price: Number(price) || 0,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        media_ids: mediaIds,
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update product");
      }

      showToast("Product updated successfully in Supabase!");
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-slate-500 font-mono text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#9e472a]" />
          <span>Loading Product Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-mono text-white ${
            notification.type === "success" ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Product</h1>
            <p className="text-xs text-slate-500 font-mono">SKU: {sku || "UNASSIGNED"}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? "Saving..." : "Save Product"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 8 COLS */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Description */}
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
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary for product cards..."
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Product Media & Photos (Automatic WebP + Cloudflare R2) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Product Media &amp; Photos
                </h2>
                <p className="text-[11px] text-slate-500">
                  Images are automatically converted to high-performance WebP and stored in Cloudflare R2.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {images.length} {images.length === 1 ? "Image" : "Images"}
              </span>
            </div>

            {/* Upload Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                {uploadingImage ? (
                  <div className="flex flex-col items-center space-y-2 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-[#9e472a]" />
                    <span className="text-xs font-medium">Converting to WebP &amp; Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1.5 text-center">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Upload Photo File</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      JPG, PNG, WEBP, AVIF (Auto-WebP)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              {/* Add by URL */}
              <div className="flex flex-col justify-center space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                <span className="text-xs font-semibold text-slate-700">Or Add by Image URL</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Media Gallery Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border transition-all ${
                      img.isPrimary ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200"
                    }`}
                  >
                    <Image
                      src={getMediaUrl(img.url)}
                      alt={img.altText || `Image ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />

                    {/* Primary Badge */}
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xs">
                        PRIMARY
                      </span>
                    )}

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          title="Set as Primary"
                          className="p-1.5 bg-white text-slate-900 hover:bg-amber-50 rounded-md text-xs cursor-pointer transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        title="Delete Image"
                        className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-md text-xs cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Card */}
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
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cost per Item (৳)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Profit Margin Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Estimated Gross Margin:</span>
              <span className={`font-semibold ${margin > 40 ? "text-emerald-700" : "text-amber-700"}`}>
                ৳{profit.toLocaleString()} ({margin}%)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Product Status
            </h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED")}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE (Published)</option>
              <option value="DRAFT">DRAFT (Hidden)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          {/* SKU & Identification */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Inventory SKU
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stock Keeping Unit (SKU) *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
