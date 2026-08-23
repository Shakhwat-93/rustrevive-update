import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductService } from "@/lib/services/product.service";
import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "Search Catalog | Rust & Revive",
  description: "Search raw denim, jackets, heavy tees, and leather goods across the Rust & Revive catalog.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const { q } = await props.searchParams;
  const query = q?.trim() || "";

  let products: Parameters<typeof SearchView>[0]["initialResults"] = [];
  if (query) {
    const raw = await ProductService.getStorefrontProducts({ search: query });
    products = raw as unknown as Parameters<typeof SearchView>[0]["initialResults"];
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
