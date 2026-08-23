import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductService } from "@/lib/services/product.service";
import { ShopCatalogView } from "@/app/shop/shop-catalog-view";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const categories = await ProductService.getStorefrontCategories();
  const category = categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());

  const name = category?.name || slug.replace(/-/g, " ").toUpperCase();
  return {
    title: `${name} | Rust & Revive`,
    description: category?.description || `Discover hand-crafted ${name} from Rust & Revive.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const categories = await ProductService.getStorefrontCategories();
  const category = categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());

  if (!category && slug !== "all") {
    notFound();
  }

  // Fetch Products in this category
  const products = await ProductService.getStorefrontProducts(
    category ? { category_id: category.id } : {}
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />
      <main className="flex-1 w-full pt-24 pb-20">
        <ShopCatalogView
          initialProducts={products || []}
          categories={categories || []}
          pageTitle={category?.name || "Curated Category"}
          pageSubtitle={category?.description || `Explore our archival ${category?.name || "garments"} crafted with raw materials.`}
          activeCategorySlug={category?.slug}
        />
      </main>
      <EditorialFooter />
    </div>
  );
}
