"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/components/editorial/ProductCard";
import { FEATURED_PRODUCTS, type ProductItem } from "@/data/homepage.data";

interface FeaturedProductsProps {
  products?: ProductItem[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayList = products && products.length > 0 ? products : FEATURED_PRODUCTS;

  // Extract unique categories dynamically from products
  const dynamicCategories = Array.from(
    new Set(displayList.map((p) => (p.category || "").toUpperCase()).filter(Boolean))
  );
  const filters = ["ALL", ...dynamicCategories.slice(0, 4)];

  const filteredProducts =
    activeFilter === "ALL"
      ? displayList
      : displayList.filter((p) =>
          (p.category || "").toUpperCase().includes(activeFilter)
        );

  const handleQuickAdd = (product: ProductItem) => {
    setToastMessage(`Added "${product.title}" to bag.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#fbf9f5]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <SectionHeader
          title="SELECTED PIECES"
          actionText="VIEW ALL"
          actionHref="/shop"
          theme="light"
        />

        {/* Minimal Filter Tabs */}
        {filters.length > 1 && (
          <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs font-mono-meta uppercase tracking-[0.18em] transition-colors cursor-pointer py-1 ${
                  activeFilter === f
                    ? "text-[#141312] font-semibold border-b-2 border-[#9e472a]"
                    : "text-[#8c8577] hover:text-[#141312]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

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
        <div className="fixed bottom-6 right-6 z-50 bg-[#141312] text-[#ffffff] px-4 py-2.5 text-xs font-mono-meta uppercase tracking-wider shadow-lg flex items-center space-x-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9e472a]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
