import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createPublicServerClient } from "@/lib/supabase/server";
import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "Search Catalog | Rust & Revive",
  description: "Search raw denim, jackets, heavy tees, and leather goods across the Rust & Revive catalog.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

interface SearchProductRecord {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  sku: string;
  product_media?: {
    is_primary: boolean;
    media?: {
      public_url?: string;
      alt_text?: string | null;
    } | null;
  }[];
}

export default async function SearchPage(props: SearchPageProps) {
  const { q } = await props.searchParams;
  const query = q?.trim() || "";
  const supabase = createPublicServerClient();

  let products: SearchProductRecord[] = [];
  if (query) {
    const { data } = await supabase
      .from("products")
      .select(`
        id,
        title,
        slug,
        base_price,
        compare_at_price,
        sku,
        status,
        product_media (
          is_primary,
          media (
            public_url,
            alt_text
          )
        )
      `)
      .eq("is_active", true)
      .eq("status", "ACTIVE")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
      .order("sort_order", { ascending: true });

    products = (data as unknown as SearchProductRecord[]) || [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />
      <main className="flex-1 w-full pt-24 pb-20">
        <SearchView initialQuery={query} initialResults={products} />
      </main>
      <EditorialFooter />
    </div>
  );
}
