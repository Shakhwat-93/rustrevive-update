"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/components/editorial/ProductCard";
import { FEATURED_PRODUCTS, type ProductItem } from "@/data/homepage.data";

export function FeaturedProducts() {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filters = ["ALL", "PANTS", "JACKETS", "T-SHIRTS"];

  const filteredProducts =
    activeFilter === "ALL"
      ? FEATURED_PRODUCTS
      : FEATURED_PRODUCTS.filter((p) =>
          p.category.toUpperCase().includes(activeFilter)
        );

  const handleQuickAdd = (product: ProductItem) => {
    setToastMessage(`Added "${product.title}" to bag.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#0e0d0c]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <SectionHeader
          title="SELECTED PIECES"
          actionText="VIEW ALL"
          actionHref="/collections/all"
          theme="dark"
        />

        {/* Minimal Filter Tabs */}
        <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs font-mono-meta uppercase tracking-[0.18em] transition-colors cursor-pointer py-1 ${
                activeFilter === f
                  ? "text-[#fbf9f5] font-semibold border-b border-[#9e472a]"
                  : "text-[#666258] hover:text-[#9c9689]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 4-Col Desktop / 2-Col Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pt-2">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141312] border border-[#9e472a] text-[#fbf9f5] px-4 py-2.5 text-xs font-mono-meta uppercase tracking-wider shadow-lg flex items-center space-x-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9e472a]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
