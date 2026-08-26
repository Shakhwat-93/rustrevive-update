"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Star, Check } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { useCart } from "@/context/cart-context";

export interface MerchandisedProductItem {
  id: string;
  title: string;
  shortDescription?: string;
  slug: string;
  category: string;
  colorName?: string;
  priceCents: number;
  compareAtPriceCents?: number;
  currency: string;
  imageUrl: string;
  hoverImageUrl?: string;
  imageAlt: string;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  stockCount: number;
  hasVariants?: boolean;
  variantId?: string;
  sku?: string;
}

export interface FeaturedProductsProps {
  label?: string;
  title?: string;
  subtitle?: string;
  products?: MerchandisedProductItem[];
}

export function FeaturedProducts({
  label = "OUR COLLECTION",
  title = "Featured Products",
  subtitle = "Explore our most popular items loved by customers",
  products = [],
}: FeaturedProductsProps) {
  const { addItem } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [wishlistedMap, setWishlistedMap] = useState<Record<string, boolean>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch & Drag Swipe State
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const totalProducts = products.length;

  // Auto-Slide (3.5 seconds) - automatically slides when not paused or touched
  useEffect(() => {
    if (totalProducts <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalProducts);
    }, 3500);

    return () => clearInterval(timer);
  }, [totalProducts, isPaused]);

  const handleNext = useCallback(() => {
    if (totalProducts <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalProducts);
  }, [totalProducts]);

  const handlePrev = useCallback(() => {
    if (totalProducts <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalProducts) % totalProducts);
  }, [totalProducts]);

  // Touch Handlers with fast response
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    isDragging.current = true;
    touchStartX.current = e.targetTouches[0]?.clientX || 0;
    touchEndX.current = touchStartX.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.targetTouches[0]?.clientX || 0;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    // Resume auto-slide after brief pause
    setTimeout(() => setIsPaused(false), 2500);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  // Wishlist Toggle
  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistedMap((prev) => {
      const nextState = !prev[productId];
      setToastMessage(nextState ? "Saved to your wishlist." : "Removed from wishlist.");
      setTimeout(() => setToastMessage(null), 2500);
      return { ...prev, [productId]: nextState };
    });
  };

  // Add To Cart
  const handleAddToCart = (product: MerchandisedProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) return;

    addItem({
      productId: product.id,
      variantId: product.variantId,
      title: product.title,
      price: product.priceCents,
      imageUrl: product.imageUrl,
      sku: product.sku || `RR-${product.slug.toUpperCase().slice(0, 6)}`,
    });

    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setToastMessage(`Added "${product.title}" to bag.`);

    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
      setToastMessage(null);
    }, 2500);
  };

  if (!products || products.length === 0) {
    return null;
  }

  // Calculate circular offset for 5-card carousel perspective
  const getCardOffset = (index: number) => {
    let offset = index - activeIndex;
    if (offset > totalProducts / 2) offset -= totalProducts;
    if (offset < -totalProducts / 2) offset += totalProducts;
    return offset;
  };

  return (
    <section
      className="w-full py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#fdfbf7] via-[#f8f3eb] to-[#fbf9f5] overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Featured Products Carousel"
    >
      <div className="max-w-[1600px] mx-auto space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto px-4">
          <span className="text-[11px] sm:text-xs font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-bold block">
            {label}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#141312] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm font-sans-ui text-[#7c7569] leading-relaxed max-w-md mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Visual Stage with Floating Cards */}
        <div
          className="relative min-h-[480px] sm:min-h-[520px] md:min-h-[560px] flex items-center justify-center touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows (Desktop/Tablet only, hidden on mobile) */}
          {totalProducts > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-md border border-[#e5ded0] shadow-md items-center justify-center text-[#141312] hover:bg-[#141312] hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-md border border-[#e5ded0] shadow-md items-center justify-center text-[#141312] hover:bg-[#141312] hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Next product"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Cards Track (Desktop 5-card perspective + Mobile smooth focus) */}
          <div className="w-full flex items-center justify-center relative py-4">
            {products.map((product, idx) => {
              const offset = getCardOffset(idx);
              const isActive = offset === 0;
              const isAdjacent = Math.abs(offset) === 1;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible && totalProducts > 5) return null;

              // Responsive Translate & Scale Matrix
              const translateXDesktop = offset * 280; // pixels
              const scale = isActive ? 1.04 : isAdjacent ? 0.94 : 0.86;
              const opacity = isActive ? 1 : isAdjacent ? 0.88 : 0.6;
              const zIndex = 20 - Math.abs(offset) * 5;

              const isWishlisted = Boolean(wishlistedMap[product.id]);
              const isAdded = Boolean(addedMap[product.id]);
              const badgeText =
                product.badge ||
                (product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents
                  ? "SALE"
                  : idx === 0
                  ? "BEST SELLER"
                  : idx === 1
                  ? "POPULAR"
                  : "NEW");

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!isActive) setActiveIndex(idx);
                  }}
                  style={{
                    transform: `translateX(${translateXDesktop}px) scale(${scale})`,
                    zIndex,
                    opacity,
                  }}
                  className={`absolute transition-all duration-500 ease-out cursor-pointer w-[280px] sm:w-[300px] md:w-[320px] ${
                    isActive ? "pointer-events-auto" : "pointer-events-auto hover:opacity-100"
                  }`}
                >
                  <div
                    className={`bg-white/95 backdrop-blur-xs rounded-[28px] p-4 sm:p-5 border transition-all duration-300 flex flex-col justify-between min-h-[440px] sm:min-h-[470px] overflow-hidden ${
                      isActive
                        ? "border-[#d8ccb8] shadow-[0_20px_50px_rgba(158,71,42,0.12)] bg-white"
                        : "border-[#ebe4d6] shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    {/* Top Row: Badge & Wishlist */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-[#f5ecdc] text-[#8c5828] text-[10px] font-mono-meta font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {badgeText}
                      </span>

                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isWishlisted
                            ? "bg-rose-50 text-rose-500"
                            : "text-[#8c8577] hover:text-[#9e472a] hover:bg-[#f4eee3]"
                        }`}
                        aria-label="Save to Wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>

                    {/* Product Image Area */}
                    <Link
                      href={`/products/${product.slug}`}
                      className="group relative my-3 flex flex-col items-center justify-center"
                    >
                      <div className="w-full h-44 sm:h-48 relative flex items-center justify-center p-2">
                        <SafeImage
                          src={product.imageUrl}
                          alt={product.imageAlt || product.title}
                          fill
                          sizes="(max-width: 640px) 280px, (max-width: 1024px) 300px, 320px"
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                          priority={isActive}
                        />
                      </div>

                      {/* Image Indicator Dots */}
                      <div className="flex items-center space-x-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9e472a]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ded7c8]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ded7c8]" />
                      </div>
                    </Link>

                    {/* Product Metadata & Info */}
                    <div className="space-y-1.5 pt-1">
                      <Link href={`/products/${product.slug}`} className="block group">
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#141312] tracking-wide line-clamp-1 group-hover:text-[#9e472a] transition-colors">
                          {product.title}
                        </h3>
                      </Link>

                      <p className="text-[11px] sm:text-xs font-sans-ui text-[#7c7569] line-clamp-2 leading-relaxed min-h-[32px]">
                        {product.shortDescription ||
                          "Crafted with durable shuttle-loom stitching and vintage archival finish."}
                      </p>

                      {/* Rating Row */}
                      <div className="flex items-center space-x-1.5 text-xs font-mono-meta text-[#7c7569] pt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-[#141312]">
                          {product.rating ? product.rating.toFixed(1) : "4.8"}
                        </span>
                        <span className="text-[#8c8577]">
                          ({product.reviewCount || 120})
                        </span>
                      </div>
                    </div>

                    {/* Price & Action Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#f0eadc] gap-2 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline space-x-1.5 font-mono-meta">
                          <span className="text-sm sm:text-base md:text-lg font-bold text-[#141312]">
                            ৳{product.priceCents.toLocaleString()}
                          </span>
                          {product.compareAtPriceCents &&
                            product.compareAtPriceCents > product.priceCents && (
                              <span className="text-[11px] sm:text-xs text-[#8c8577] line-through">
                                ৳{product.compareAtPriceCents.toLocaleString()}
                              </span>
                            )}
                        </div>
                        {!product.inStock && (
                          <span className="text-[10px] font-mono-meta uppercase tracking-wider text-rose-600 font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      {product.inStock ? (
                        isActive ? (
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="bg-[#9e472a] hover:bg-[#873c22] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-mono-meta font-semibold uppercase tracking-wider flex items-center space-x-1 sm:space-x-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f4eee3] hover:bg-[#9e472a] text-[#5c574e] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            aria-label={`Add ${product.title} to cart`}
                          >
                            {isAdded ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-[#ded7c8] text-[#8c8577] text-xs font-mono-meta font-medium cursor-not-allowed shrink-0"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Pagination Dots */}
        {totalProducts > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-2">
            {products.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeIndex
                    ? "w-7 h-2 bg-[#9e472a]"
                    : "w-2 h-2 bg-[#ded7c8] hover:bg-[#b8b09f]"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141312] text-white px-4 py-2.5 rounded-xl text-xs font-mono-meta tracking-wider shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9e472a]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
