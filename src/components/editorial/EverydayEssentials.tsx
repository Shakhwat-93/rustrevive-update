"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/components/editorial/ProductCard";
import { ESSENTIALS_PRODUCTS, type ProductItem } from "@/data/homepage.data";

interface EverydayEssentialsProps {
  products?: ProductItem[];
}

export function EverydayEssentials({ products }: EverydayEssentialsProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayList = products && products.length > 0 ? products : ESSENTIALS_PRODUCTS;

  const handleQuickAdd = (product: ProductItem) => {
    setToastMessage(`Added "${product.title}" to bag.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#fbf9f5]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <SectionHeader
          title="EVERYDAY ESSENTIALS"
          actionText="SHOP ALL"
          actionHref="/shop"
          theme="light"
        />

        {/* 4-Column Desktop / 2-Column Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {displayList.slice(0, 4).map((product) => (
            <ProductCard
              key={`essentials-${product.id}`}
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
