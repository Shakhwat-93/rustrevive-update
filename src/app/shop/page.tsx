import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ShopCatalogView } from "./shop-catalog-view";

export const metadata: Metadata = {
  title: "Catalog & Garments | Rust & Revive",
  description: "Explore raw selvedge denim, heavy cotton t-shirts, tailored jackets, and vegetable-tanned leather essentials.",
  alternates: {
    canonical: "/shop",
  },
};

export default async function ShopPage() {
  const supabase = createPublicServerClient();

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // 2. Fetch Active Products with Media
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      base_price,
      compare_at_price,
      category_id,
      sku,
      status,
      is_featured,
      created_at,
      product_media (
        is_primary,
        sort_order,
        media (
          public_url,
          alt_text
        )
      )
    `)
    .eq("is_active", true)
    .eq("status", "ACTIVE")
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />
      <main className="flex-1 w-full pt-24 pb-20">
        <ShopCatalogView
          initialProducts={products || []}
          categories={categories || []}
          pageTitle="The Complete Collection"
          pageSubtitle="Timeless garments designed for longevity, crafted with heavyweight fabrics and archival tailoring."
        />
      </main>
      <EditorialFooter />
    </div>
  );
}
