"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";

interface SearchProduct {
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

interface SearchViewProps {
  initialQuery: string;
  initialResults: SearchProduct[];
}

export function SearchView({ initialQuery, initialResults }: SearchViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
          Catalog Search
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
          Find Your Garment
        </h1>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        <div className="flex items-center border-b-2 border-[#141312] pb-2 bg-transparent">
          <Search className="w-5 h-5 text-[#5c574e] mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search raw selvedge denim, heavy t-shirt, leather jacket..."
            className="w-full bg-transparent text-sm sm:text-base text-[#141312] placeholder-[#8c8577] font-sans-ui focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider hover:bg-[#9e472a] transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results Section */}
      {initialQuery ? (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#ded7c8] pb-3 text-xs font-mono-meta text-[#5c574e]">
            <span>
              Search results for <strong className="text-[#141312]">&quot;{initialQuery}&quot;</strong>
            </span>
            <span>
              {initialResults.length} {initialResults.length === 1 ? "result" : "results"}
            </span>
          </div>

          {initialResults.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white border border-[#ded7c8] p-8 shadow-xs">
              <p className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                No garments matched your query
              </p>
              <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
                Check your spelling or explore our complete catalog collection.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider hover:bg-[#9e472a] transition-colors"
                >
                  <span>Browse All Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {initialResults.map((product) => {
                const primaryImg = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group flex flex-col w-full"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8]">
                      <Image
                        src={getMediaUrl(primaryImg?.media?.public_url)}
                        alt={primaryImg?.media?.alt_text || product.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>
                    <div className="pt-2.5 space-y-1">
                      <h3 className="font-serif text-sm uppercase tracking-tight text-[#141312] group-hover:text-[#9e472a] transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="font-mono-meta text-xs font-semibold text-[#141312]">
                        ৳{product.base_price.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="pt-8 text-center space-y-4">
          <p className="text-xs font-mono-meta text-[#8c8577] uppercase tracking-wider">
            Popular Searches: Selvedge Denim &bull; Heavyweight Tee &bull; Leather Belt &bull; Denim Jacket
          </p>
        </div>
      )}
    </div>
  );
}
