"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, Plus, Check } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getMediaUrl } from "@/lib/media/media-url";

interface ProductRecord {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  category_id: string | null;
  sku: string;
  status: string;
  is_featured: boolean;
  created_at: string;
  product_media?: {
    is_primary: boolean;
    sort_order: number;
    media?: {
      public_url?: string;
      alt_text?: string | null;
    } | null;
  }[];
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
}

interface ShopCatalogViewProps {
  initialProducts: ProductRecord[];
  categories: CategoryRecord[];
  pageTitle?: string;
  pageSubtitle?: string;
  activeCategorySlug?: string;
  showHeader?: boolean;
}

export function ShopCatalogView({
  initialProducts,
  categories,
  pageTitle,
  pageSubtitle,
  activeCategorySlug,
  showHeader = false,
}: ShopCatalogViewProps) {
  const { addItem, openCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategorySlug || "ALL");
  const [sortBy, setSortBy] = useState<string>("FEATURED");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [addedSku, setAddedSku] = useState<string | null>(null);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // Category Filter
    if (selectedCategory !== "ALL") {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) {
        list = list.filter((p) => p.category_id === cat.id);
      }
    }

    // Sorting
    if (sortBy === "PRICE_ASC") {
      list.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a, b) => b.base_price - a.base_price);
    } else if (sortBy === "NEWEST") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [initialProducts, categories, selectedCategory, sortBy]);

  const handleQuickAdd = (product: ProductRecord) => {
    const primaryImg = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
    addItem({
      productId: product.id,
      title: product.title,
      sku: product.sku || product.id.slice(0, 8).toUpperCase(),
      price: product.base_price,
      imageUrl: primaryImg?.media?.public_url,
    });
    setAddedSku(product.sku || product.id);
    setTimeout(() => setAddedSku(null), 1500);
    openCart();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 space-y-6">
      {/* 1. Minimal Editorial Header (Optional) */}
      {showHeader && pageTitle && (
        <div className="text-center max-w-2xl mx-auto space-y-2.5 pt-4">
          <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
            Authentic Garments
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif uppercase tracking-wider text-[#141312]">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e] leading-relaxed">
              {pageSubtitle}
            </p>
          )}
        </div>
      )}

      {/* 2. Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-[#ded7c8]">
        {/* Desktop Category Pills */}
        <div className="hidden md:flex items-center space-x-2 overflow-x-auto pb-1 max-w-2xl scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 text-xs font-mono-meta uppercase tracking-wider rounded-full transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#141312] text-[#fbf9f5] font-semibold"
                : "bg-white border border-[#ded7c8] text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
            }`}
          >
            All Pieces ({initialProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 text-xs font-mono-meta uppercase tracking-wider rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[#141312] text-[#fbf9f5] font-semibold"
                  : "bg-white border border-[#ded7c8] text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mobile Filter Trigger */}
        <div className="flex md:hidden items-center justify-between w-full">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-[#ded7c8] text-xs font-mono-meta uppercase tracking-wider text-[#141312] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9e472a]" />
            <span>Filter ({selectedCategory === "ALL" ? "All" : selectedCategory})</span>
          </button>

          <span className="text-xs font-mono-meta text-[#5c574e]">
            {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center space-x-2 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#5c574e]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-mono-meta uppercase tracking-wider text-[#141312] border-b border-[#ded7c8] py-1 outline-none cursor-pointer focus:border-[#141312]"
          >
            <option value="FEATURED">Curated Order</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="NEWEST">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {/* 3. Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white border border-[#ded7c8] p-12 shadow-xs">
          <p className="font-serif text-lg uppercase tracking-wider text-[#141312]">
            No garments found in this selection
          </p>
          <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
            Try adjusting your category filters or browse the complete collection.
          </p>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className="inline-block px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider hover:bg-[#9e472a] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => {
            const primaryImg = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
            const secondaryImg = product.product_media?.find((m) => !m.is_primary && m.media?.public_url);

            return (
              <div key={product.id} className="group flex flex-col w-full">
                {/* Image Frame */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8] transition-colors"
                >
                  <Image
                    src={getMediaUrl(primaryImg?.media?.public_url)}
                    alt={primaryImg?.media?.alt_text || product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />

                  {secondaryImg?.media?.public_url && (
                    <Image
                      src={getMediaUrl(secondaryImg.media.public_url)}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] absolute inset-0 opacity-0 group-hover:opacity-100"
                    />
                  )}

                  {product.compare_at_price && product.compare_at_price > product.base_price && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#9e472a] text-[#ffffff] text-[9px] font-mono-meta uppercase tracking-widest font-semibold">
                      SALE
                    </span>
                  )}

                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuickAdd(product);
                    }}
                    className="hidden sm:flex absolute bottom-2.5 right-2.5 p-2 bg-[#141312] hover:bg-[#9e472a] text-[#ffffff] items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                    aria-label={`Add ${product.title} to bag`}
                  >
                    {addedSku === (product.sku || product.id) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </Link>

                {/* Info */}
                <div className="pt-3 space-y-1">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-serif text-sm sm:text-base uppercase tracking-tight text-[#141312] group-hover:text-[#9e472a] transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-2 text-xs font-mono-meta">
                    <span className="text-[#141312] font-semibold">
                      ৳{product.base_price.toLocaleString()}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-[#8c8577] line-through text-[11px]">
                        ৳{product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-[#0e0d0c]/60 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#fbf9f5] border-l border-[#ded7c8] p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#ded7c8]">
                <span className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                  Filter Pieces
                </span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-xs font-mono-meta uppercase tracking-wider text-[#5c574e]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left py-2 px-3 text-xs font-mono-meta uppercase tracking-wider rounded ${
                    selectedCategory === "ALL"
                      ? "bg-[#141312] text-[#fbf9f5] font-semibold"
                      : "text-[#5c574e] hover:bg-slate-100"
                  }`}
                >
                  All Pieces ({initialProducts.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left py-2 px-3 text-xs font-mono-meta uppercase tracking-wider rounded ${
                      selectedCategory === cat.slug
                        ? "bg-[#141312] text-[#fbf9f5] font-semibold"
                        : "text-[#5c574e] hover:bg-slate-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
