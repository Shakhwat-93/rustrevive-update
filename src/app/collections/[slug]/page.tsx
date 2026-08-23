import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductService } from "@/lib/services/product.service";
import { ShopCatalogView } from "@/app/shop/shop-catalog-view";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: CollectionPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const title = slug === "all" ? "All Pieces" : slug.replace(/-/g, " ").toUpperCase();
  return {
    title: `${title} | Rust & Revive Collection`,
    description: `Browse the ${title} collection from Rust & Revive.`,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CollectionPage(props: CollectionPageProps) {
  const { slug } = await props.params;
  const categories = await ProductService.getStorefrontCategories();

  let pageTitle = "The Complete Collection";
  const pageSubtitle = "Archival craftsmanship built with heritage raw fabrics and minimal silhouettes.";

  const matchedCategory = slug !== "all" 
    ? categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase())
    : undefined;

  if (matchedCategory) {
    pageTitle = matchedCategory.name;
  } else if (slug !== "all") {
    pageTitle = slug.replace(/-/g, " ").toUpperCase();
  }

  const products = await ProductService.getStorefrontProducts(
    matchedCategory ? { category_id: matchedCategory.id } : {}
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />
      <main className="flex-1 w-full pt-24 pb-20">
        <ShopCatalogView
          initialProducts={products || []}
          categories={categories || []}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          activeCategorySlug={slug !== "all" ? slug : undefined}
        />
      </main>
      <EditorialFooter />
    </div>
  );
}
