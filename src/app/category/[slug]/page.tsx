import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ShopCatalogView } from "@/app/shop/shop-catalog-view";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createPublicServerClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, seo_title, seo_description")
    .eq("slug", slug)
    .maybeSingle();

  const name = category?.name || slug.replace(/-/g, " ").toUpperCase();
  return {
    title: category?.seo_title || `${name} | Rust & Revive`,
    description: category?.seo_description || `Discover hand-crafted ${name} from Rust & Revive.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const supabase = createPublicServerClient();

  // Fetch Category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category && slug !== "all") {
    notFound();
  }

  // Fetch all categories for filter pills
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch Products in this category
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

  if (category) {
    query = query.eq("category_id", category.id);
  }

  const { data: products } = await query.order("sort_order", { ascending: true });

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
