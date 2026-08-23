import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductService } from "@/lib/services/product.service";
import { ShopCatalogView } from "./shop-catalog-view";

export const metadata: Metadata = {
  title: "Catalog & Garments | Rust & Revive",
  description: "Explore raw selvedge denim, heavy cotton t-shirts, tailored jackets, and vegetable-tanned leather essentials.",
  alternates: {
    canonical: "/shop",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    ProductService.getStorefrontCategories(),
    ProductService.getStorefrontProducts(),
  ]);

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
