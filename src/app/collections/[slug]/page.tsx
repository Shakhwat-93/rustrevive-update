import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createPublicServerClient } from "@/lib/supabase/server";
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
  const supabase = createPublicServerClient();

  // 1. Fetch Categories for filter pills
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // 2. Fetch Products
  let query = supabase
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
    .eq("status", "ACTIVE");

  let pageTitle = "The Complete Collection";
  const pageSubtitle = "Archival craftsmanship built with heritage raw fabrics and minimal silhouettes.";

  if (slug !== "all") {
    // If slug matches a category or custom collection
    const matchedCategory = categories?.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
    if (matchedCategory) {
      query = query.eq("category_id", matchedCategory.id);
      pageTitle = matchedCategory.name;
    } else {
      pageTitle = slug.replace(/-/g, " ").toUpperCase();
    }
  }

  const { data: products } = await query.order("sort_order", { ascending: true });

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
