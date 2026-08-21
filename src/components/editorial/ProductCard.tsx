"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";
import type { ProductItem } from "@/data/homepage.data";

interface ProductCardProps {
  product: ProductItem;
  onQuickAdd?: (product: ProductItem) => void;
}

export function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const mainImageUrl = getMediaUrl(product.imageUrl);
  const hoverImg = product.hoverImageUrl ? getMediaUrl(product.hoverImageUrl) : null;

  const formattedPrice = `৳${(product.priceCents * 1.2).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
  const formattedComparePrice = product.compareAtPriceCents
    ? `৳${(product.compareAtPriceCents * 1.2).toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`
    : null;

  return (
    <div
      className="group flex flex-col w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8] transition-colors"
      >
        <Image
          src={mainImageUrl}
          alt={product.imageAlt || product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
            isHovered && hoverImg ? "opacity-0" : "opacity-100"
          }`}
        />

        {hoverImg && (
          <Image
            src={hoverImg}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] absolute inset-0 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Minimal Sale Tag */}
        {product.isSale && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#9e472a] text-[#ffffff] text-[9px] font-mono-meta uppercase tracking-widest font-semibold">
            SALE
          </span>
        )}

        {/* Subtle Quick Add Button on Hover */}
        {onQuickAdd && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="hidden sm:flex absolute bottom-2.5 right-2.5 p-2 bg-[#141312] hover:bg-[#9e472a] text-[#ffffff] items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm"
            aria-label={`Add ${product.title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </Link>

      {/* Minimal Product Information */}
      <div className="pt-3 space-y-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif-editorial text-base uppercase tracking-tight text-[#141312] group-hover:text-[#9e472a] transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center space-x-2 text-xs font-mono-meta">
          <span className="text-[#141312] font-semibold">{formattedPrice}</span>
          {formattedComparePrice && (
            <span className="text-[#8c8577] line-through text-[11px]">
              {formattedComparePrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
