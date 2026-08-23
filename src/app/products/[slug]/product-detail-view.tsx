"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getMediaUrl } from "@/lib/media/media-url";

interface ProductDetailViewProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    product_type: string;
    brand: string;
    base_price: number;
    compare_at_price: number | null;
    sku: string;
    product_variants?: {
      id: string;
      title: string;
      sku: string;
      price: number;
      compare_at_price: number | null;
      option_1_name: string | null;
      option_1_value: string | null;
      option_2_name: string | null;
      option_2_value: string | null;
      is_active: boolean;
      inventory?: {
        quantity: number;
        reserved_quantity: number;
      }[];
    }[];
    product_media?: {
      id: string;
      is_primary: boolean;
      sort_order: number;
      media?: {
        public_url?: string;
        alt_text?: string | null;
      } | null;
    }[];
    inventory?: {
      quantity: number;
      reserved_quantity: number;
    }[];
  };
  reviews: {
    id: string;
    customer_name: string;
    rating: number;
    title: string | null;
    content: string;
    is_verified_purchase: boolean;
    created_at: string;
  }[];
  avgRating: number;
  totalReviews: number;
  relatedProducts: {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    compare_at_price: number | null;
    sku: string;
    product_media?: {
      is_primary: boolean;
      media?: { public_url?: string; alt_text?: string | null } | null;
    }[];
  }[];
}

export function ProductDetailView({
  product,
  reviews,
  avgRating,
  totalReviews,
  relatedProducts,
}: ProductDetailViewProps) {
  const { addItem, openCart } = useCart();

  // Media List
  const mediaList = product.product_media || [];
  const primaryMedia = mediaList.find((m) => m.is_primary) || mediaList[0];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant States
  const variants = product.product_variants || [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? (variants[0]?.id || null) : null
  );

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || null;
  const currentPrice = activeVariant ? activeVariant.price : product.base_price;
  const currentComparePrice = activeVariant ? activeVariant.compare_at_price : product.compare_at_price;
  const currentSku = activeVariant ? activeVariant.sku : product.sku;

  // Real-Time Stock Calculation
  const variantInv = activeVariant?.inventory?.[0];
  const productInv = product.inventory?.[0];
  const currentInv = activeVariant ? variantInv : productInv;
  const availableStock = currentInv
    ? Math.max(0, currentInv.quantity - (currentInv.reserved_quantity || 0))
    : 10;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  // Quantity & Wishlist
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Collapsible Accordions
  const [openSection, setOpenSection] = useState<string | null>("details");

  // Review Form
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const images = (
    mediaList.map((m) => getMediaUrl(m.media?.public_url)).filter(Boolean) as string[]
  ).length > 0
    ? (mediaList.map((m) => getMediaUrl(m.media?.public_url)).filter(Boolean) as string[])
    : ["/placeholder-garment.webp"];

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        variantId: activeVariant?.id,
        title: product.title,
        variantTitle: activeVariant?.title,
        sku: currentSku,
        price: currentPrice,
        imageUrl: images[selectedImageIndex] || getMediaUrl(primaryMedia?.media?.public_url),
      },
      quantity
    );
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
    openCart();
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    try {
      const stored = localStorage.getItem("rustrevive_wishlist");
      let list = stored ? JSON.parse(stored) : [];
      if (isWishlisted) {
        list = list.filter((i: { id: string }) => i.id !== product.id);
      } else {
        list.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          base_price: product.base_price,
          compare_at_price: product.compare_at_price,
          product_media: product.product_media,
        });
      }
      localStorage.setItem("rustrevive_wishlist", JSON.stringify(list));
    } catch {
      // Ignored
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: activeVariant?.id,
          customerName: reviewName,
          rating: reviewRating,
          content: reviewContent,
        }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess(false);
        }, 1500);
      }
    } catch {
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* 1. Main PDP Two-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (6 Cols with constrained height) */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3.5 sm:gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-16 lg:w-20 shrink-0 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[3/4] w-14 sm:w-16 lg:w-20 overflow-hidden bg-[#f4eee3] border transition-all cursor-pointer ${
                    selectedImageIndex === idx ? "border-[#141312] ring-1 ring-[#141312]" : "border-[#ded7c8] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`${product.title} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Primary Main Image Frame - Constrained to 580px-620px max height */}
          <div className="relative w-full aspect-[4/5] max-h-[520px] sm:max-h-[580px] lg:max-h-[620px] bg-[#f4eee3] border border-[#ded7c8] overflow-hidden flex items-center justify-center">
            {images[selectedImageIndex] ? (
              <Image
                src={images[selectedImageIndex]}
                alt={product.title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono-meta text-xs text-[#8c8577]">
                RUST &amp; REVIVE
              </div>
            )}

            {currentComparePrice && currentComparePrice > currentPrice && (
              <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9e472a] text-[#ffffff] text-[10px] font-mono-meta uppercase tracking-widest font-semibold">
                SALE
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Garment Information & Sticky Purchase Controls (6 Cols) */}
        <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-28">
          {/* Title & SKU */}
          <div className="space-y-1.5 border-b border-[#ded7c8] pb-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#9e472a] font-semibold">
              {product.brand || "Rust & Revive"} &bull; {currentSku}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-wider text-[#141312]">
              {product.title}
            </h1>

            {/* Price & Rating Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-baseline space-x-3 font-mono-meta">
                <span className="text-xl sm:text-2xl font-bold text-[#141312]">
                  ৳{currentPrice.toLocaleString()}
                </span>
                {currentComparePrice && currentComparePrice > currentPrice && (
                  <span className="text-sm text-[#8c8577] line-through">
                    ৳{currentComparePrice.toLocaleString()}
                  </span>
                )}
              </div>

              {totalReviews > 0 && (
                <div className="flex items-center space-x-1.5 text-xs font-mono-meta text-[#141312]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-[#8c8577]">({totalReviews})</span>
                </div>
              )}
            </div>
          </div>

          {/* Short Editorial Description */}
          {product.short_description && (
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e] leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Real-Time Stock Availability Indicator */}
          <div className="flex items-center space-x-2 pt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isOutOfStock
                  ? "bg-rose-500"
                  : isLowStock
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <span
              className={`text-xs font-mono-meta uppercase tracking-wider font-semibold ${
                isOutOfStock
                  ? "text-rose-600"
                  : isLowStock
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : isLowStock
                ? `Low Stock — Only ${availableStock} Remaining`
                : `In Stock — Ready for Dispatch (${availableStock} available)`}
            </span>
          </div>

          {/* Variant Selector (If Any) */}
          {variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold block">
                Select Size / Specification:
              </span>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const vStock = v.inventory?.[0]
                    ? Math.max(0, v.inventory[0].quantity - (v.inventory[0].reserved_quantity || 0))
                    : 10;
                  const vOutOfStock = vStock <= 0;

                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`px-4 py-2 text-xs font-mono-meta uppercase tracking-wider border transition-all cursor-pointer flex items-center space-x-1.5 ${
                        selectedVariantId === v.id
                          ? "border-[#141312] bg-[#141312] text-[#fbf9f5] font-bold"
                          : vOutOfStock
                          ? "border-[#e5dfd5] bg-[#f8f6f2] text-[#a8a29e] line-through opacity-60"
                          : "border-[#ded7c8] bg-white text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
                      }`}
                    >
                      <span>{v.title}</span>
                      {vOutOfStock && <span className="text-[10px] no-underline">(Sold Out)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTAs */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-3">
              {/* Stepper */}
              <div className="flex items-center border border-[#ded7c8] bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                  className="p-2.5 text-[#5c574e] hover:text-[#141312] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-mono-meta font-bold text-[#141312]">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={isOutOfStock || quantity >= availableStock}
                  className="p-2.5 text-[#5c574e] hover:text-[#141312] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Bag CTA */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3 text-xs font-mono-meta uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-2 shadow-xs ${
                  isOutOfStock
                    ? "bg-[#ded7c8] text-[#8c8577] cursor-not-allowed"
                    : "bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] cursor-pointer"
                }`}
              >
                {isOutOfStock ? (
                  <span>Sold Out / Out of Stock</span>
                ) : addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Acquire Garment &mdash; ৳{(currentPrice * quantity).toLocaleString()}</span>
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className={`p-3 border transition-colors cursor-pointer ${
                  isWishlisted
                    ? "border-[#9e472a] bg-[#9e472a] text-white"
                    : "border-[#ded7c8] bg-white text-[#5c574e] hover:text-[#9e472a] hover:border-[#9e472a]"
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
              </button>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#ded7c8] text-xs font-mono-meta text-[#5c574e]">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#9e472a] shrink-0" />
              <span>Nationwide 48h Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-[#9e472a] shrink-0" />
              <span>7-Day Return / Exchange</span>
            </div>
          </div>

          {/* Collapsible Editorial Accordions */}
          <div className="divide-y divide-[#ded7c8] border-y border-[#ded7c8] pt-2">
            {/* 1. Craftsmanship & Details */}
            <div>
              <button
                onClick={() => setOpenSection(openSection === "details" ? null : "details")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>Craftsmanship &amp; Fabric Notes</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "details" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "details" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>{product.description || "Crafted using vintage shuttle looms and durable stitching."}</p>
                </div>
              )}
            </div>

            {/* 2. Sizing & Fit */}
            <div>
              <button
                onClick={() => setOpenSection(openSection === "sizing" ? null : "sizing")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>Fit &amp; Sizing Standard</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "sizing" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "sizing" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>True to size archival cut. Designed for structured drape and natural movement.</p>
                </div>
              )}
            </div>

            {/* 3. Care */}
            <div>
              <button
                onClick={() => setOpenSection(openSection === "care" ? null : "care")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>Care &amp; Longevity</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "care" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "care" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>Cold wash inside out. Hang dry only. Raw denim will develop personal indigo patina over time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer Reviews & Ratings Section */}
      <div className="pt-12 border-t border-[#ded7c8] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Verified Feedback
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Customer Reviews ({totalReviews})
            </h2>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="px-5 py-2.5 bg-white border border-[#141312] text-xs font-mono-meta uppercase tracking-wider text-[#141312] hover:bg-[#141312] hover:text-[#fbf9f5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            Write a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white border border-[#ded7c8] p-8 text-center space-y-2 shadow-xs">
            <p className="font-serif text-base uppercase tracking-wider text-[#141312]">
              No reviews submitted yet
            </p>
            <p className="text-xs font-sans-ui text-[#5c574e]">
              Be the first to share your experience with this archival piece.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-[#ded7c8] p-5 space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {r.is_verified_purchase && (
                    <span className="inline-flex items-center text-[10px] font-mono-meta text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {r.title && (
                  <h4 className="font-serif text-sm font-bold uppercase tracking-wide text-[#141312]">
                    {r.title}
                  </h4>
                )}

                <p className="text-xs font-sans-ui text-[#5c574e] leading-relaxed">
                  {r.content}
                </p>

                <div className="pt-2 text-[11px] font-mono-meta text-[#8c8577]">
                  <span>{r.customer_name}</span> &bull; <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-[#ded7c8] space-y-6">
          <div>
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Curated Complements
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Wear It With
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rp) => {
              const primaryImg = rp.product_media?.find((m) => m.is_primary) || rp.product_media?.[0];
              return (
                <Link
                  key={rp.id}
                  href={`/products/${rp.slug}`}
                  className="group flex flex-col w-full"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8]">
                    <Image
                      src={getMediaUrl(primaryImg?.media?.public_url)}
                      alt={rp.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="pt-2.5 space-y-1">
                    <h3 className="font-serif text-sm uppercase tracking-tight text-[#141312] group-hover:text-[#9e472a] transition-colors line-clamp-1">
                      {rp.title}
                    </h3>
                    <p className="font-mono-meta text-xs font-semibold text-[#141312]">
                      ৳{rp.base_price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-[#0e0d0c]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#fbf9f5] border border-[#ded7c8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#ded7c8] pb-3">
              <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                Submit Verified Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-xs font-mono-meta uppercase tracking-wider text-[#5c574e]"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-700 font-mono-meta text-xs">
                <Check className="w-6 h-6 mx-auto text-emerald-600" />
                <p>Thank you. Your review was submitted successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs font-mono-meta">
                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Asif Mahmud"
                    className="w-full p-2 bg-white border border-[#ded7c8] outline-none text-[#141312]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Rating *</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-[#ded7c8]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Review Feedback *</label>
                  <textarea
                    rows={4}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Describe the fabric quality, weave, and fit..."
                    className="w-full p-2 bg-white border border-[#ded7c8] outline-none text-[#141312]"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-[#ded7c8] text-[#5c574e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-[#141312] text-[#fbf9f5] hover:bg-[#9e472a] transition-colors"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
