"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { ProductForm, type ProductFormData } from "@/components/admin/products/ProductForm";
import type { OptionConfig, GeneratedVariant } from "@/components/admin/products/VariantMatrixEditor";

export default function EditProductPage() {
  const params = useParams();
  const productId = params["id"] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductFormData | null>(null);

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

        // Map Media
        const mappedImages = (p.product_media || []).map((pm: {
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

        // Map Variants & Options
        const rawVariants = p.product_variants || [];
        const mappedVariants: GeneratedVariant[] = rawVariants.map((v: {
          id: string;
          title: string;
          sku: string;
          barcode?: string;
          price: number;
          compare_at_price?: number;
          cost_price?: number;
          option_1_name?: string;
          option_1_value?: string;
          option_2_name?: string;
          option_2_value?: string;
          option_3_name?: string;
          option_3_value?: string;
          weight?: number;
          inventory?: { quantity: number; reserved_quantity: number }[];
        }) => {
          // Find stock from variant inventory
          const invList = p.inventory || [];
          const matchedInv = invList.find((i: { variant_id: string }) => i.variant_id === v.id);
          const stockQty = matchedInv ? matchedInv.quantity : v.inventory?.[0]?.quantity || 0;

          return {
            id: v.id,
            title: v.title,
            sku: v.sku,
            barcode: v.barcode,
            price: v.price || p.base_price,
            compare_at_price: v.compare_at_price,
            cost_price: v.cost_price,
            stock: stockQty,
            weight: v.weight,
            option_1_name: v.option_1_name,
            option_1_value: v.option_1_value,
            option_2_name: v.option_2_name,
            option_2_value: v.option_2_value,
            option_3_name: v.option_3_name,
            option_3_value: v.option_3_value,
          };
        });

        // Extract distinct options from variants if any
        const optionsList: OptionConfig[] = [];
        if (rawVariants.length > 0) {
          const opt1Name = rawVariants[0]?.option_1_name || "Size";
          const opt1Values = Array.from(
            new Set(rawVariants.map((v: { option_1_value?: string }) => v.option_1_value).filter(Boolean))
          ) as string[];

          if (opt1Values.length > 0) {
            optionsList.push({ id: "opt-1", name: opt1Name, values: opt1Values });
          }

          const opt2Name = rawVariants[0]?.option_2_name;
          const opt2Values = Array.from(
            new Set(rawVariants.map((v: { option_2_value?: string }) => v.option_2_value).filter(Boolean))
          ) as string[];

          if (opt2Name && opt2Values.length > 0) {
            optionsList.push({ id: "opt-2", name: opt2Name, values: opt2Values });
          }
        }

        // Main product inventory
        const mainInv = (p.inventory || []).find((i: { variant_id: string | null }) => i.variant_id === null);

        setProductData({
          id: p.id,
          title: p.title || "",
          slug: p.slug || "",
          description: p.description || "",
          short_description: p.short_description || "",
          status: p.status || "ACTIVE",
          product_type: p.product_type || "Apparel",
          brand: p.brand || "Rust & Revive",
          category_id: p.category_id || "",
          base_price: p.base_price || 0,
          compare_at_price: p.compare_at_price || null,
          cost_price: p.cost_price || null,
          sku: p.sku || "",
          barcode: p.barcode || "",
          has_variants: Boolean(p.has_variants && rawVariants.length > 0),
          is_featured: Boolean(p.is_featured),
          is_active: p.is_active !== undefined ? p.is_active : true,
          sort_order: p.sort_order || 0,
          tags: p.tags || [],
          seo_title: p.seo_title || p.title,
          seo_description: p.seo_description || p.short_description || "",
          weight: p.weight || 0.5,
          track_inventory: true,
          continue_selling_out_of_stock: false,
          initial_inventory: mainInv ? mainInv.quantity : 0,
          images: mappedImages,
          options: optionsList.length > 0 ? optionsList : [{ id: "opt-1", name: "Size", values: ["S", "M", "L", "XL"] }],
          variants: mappedVariants,
        });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#9e472a] animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading Product Details...
        </p>
      </div>
    );
  }

  if (errorMsg || !productData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-sm font-bold text-rose-900">Unable to load product</h2>
          <p className="text-xs text-rose-700">{errorMsg || "Product record not found"}</p>
          <Link
            href="/admin/products"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProductForm mode="edit" productId={productId} initialData={productData} />;
}
