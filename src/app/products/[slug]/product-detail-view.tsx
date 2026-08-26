"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  ChevronDown,
  Ruler,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  Share2,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getMediaUrl } from "@/lib/media/media-url";
import { SizeGuideModal } from "@/components/products/SizeGuideModal";
import type { SizeChartData } from "@/components/admin/products/SizeChartEditor";

interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  option_1_name: string | null;
  option_1_value: string | null;
  option_2_name: string | null;
  option_2_value: string | null;
  option_3_name?: string | null;
  option_3_value?: string | null;
  is_active: boolean;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  }[];
}

interface ProductMedia {
  id: string;
  is_primary: boolean;
  sort_order: number;
  media?: {
    public_url?: string;
    alt_text?: string | null;
  } | null;
}

interface ProductReview {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  created_at: string;
}

interface RelatedProduct {
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
}

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
    size_chart?: SizeChartData | null;
    product_variants?: ProductVariant[];
    product_media?: ProductMedia[];
    inventory?: {
      quantity: number;
      reserved_quantity: number;
    }[];
  };
  reviews: ProductReview[];
  avgRating: number;
  totalReviews: number;
  relatedProducts: RelatedProduct[];
}

export function ProductDetailView({
  product,
  reviews,
  avgRating,
  totalReviews,
  relatedProducts,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();

  // Media
  const mediaList = product.product_media || [];
  const primaryMedia = mediaList.find((m) => m.is_primary) || mediaList[0];
  const images = useMemo(() => {
    const urls = mediaList
      .map((m) => getMediaUrl(m.media?.public_url))
      .filter(Boolean) as string[];
    return urls.length > 0 ? urls : ["/placeholder-garment.webp"];
  }, [mediaList]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Variants parsing & selection
  const rawVariants = product.product_variants || [];
  const hasVariants = rawVariants.length > 0;

  // Extract separate options (Color, Size, etc.)
  const optionDimensions = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    let hasColorOpt = false;
    let hasSizeOpt = false;

    rawVariants.forEach((v) => {
      const opt1Name = (v.option_1_name || "").toLowerCase();
      const opt2Name = (v.option_2_name || "").toLowerCase();

      if (opt1Name.includes("color") && v.option_1_value) {
        colors.add(v.option_1_value);
        hasColorOpt = true;
      } else if (opt1Name.includes("size") && v.option_1_value) {
        sizes.add(v.option_1_value);
        hasSizeOpt = true;
      }

      if (opt2Name.includes("color") && v.option_2_value) {
        colors.add(v.option_2_value);
        hasColorOpt = true;
      } else if (opt2Name.includes("size") && v.option_2_value) {
        sizes.add(v.option_2_value);
        hasSizeOpt = true;
      }
    });

    return {
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      hasColorOpt,
      hasSizeOpt,
    };
  }, [rawVariants]);

  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    return optionDimensions.colors[0] || null;
  });

  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    return optionDimensions.sizes[0] || null;
  });

  const [singleVariantId, setSingleVariantId] = useState<string | null>(() => {
    if (!optionDimensions.hasColorOpt && !optionDimensions.hasSizeOpt && hasVariants) {
      return rawVariants[0]?.id || null;
    }
    return null;
  });

  // Resolve matching variant
  const activeVariant: ProductVariant | null = useMemo(() => {
    if (!hasVariants) return null;

    if (optionDimensions.hasColorOpt && optionDimensions.hasSizeOpt) {
      return (
        rawVariants.find(
          (v) =>
            ((v.option_1_value === selectedColor && v.option_2_value === selectedSize) ||
              (v.option_2_value === selectedColor && v.option_1_value === selectedSize)) &&
            v.is_active
        ) || null
      );
    }

    if (optionDimensions.hasColorOpt && !optionDimensions.hasSizeOpt) {
      return (
        rawVariants.find(
          (v) => (v.option_1_value === selectedColor || v.option_2_value === selectedColor) && v.is_active
        ) || null
      );
    }

    if (optionDimensions.hasSizeOpt && !optionDimensions.hasColorOpt) {
      return (
        rawVariants.find(
          (v) => (v.option_1_value === selectedSize || v.option_2_value === selectedSize) && v.is_active
        ) || null
      );
    }

    if (singleVariantId) {
      return rawVariants.find((v) => v.id === singleVariantId) || rawVariants[0] || null;
    }

    return rawVariants[0] || null;
  }, [hasVariants, optionDimensions, rawVariants, selectedColor, selectedSize, singleVariantId]);

  // Pricing & SKU
  const currentPrice = activeVariant ? activeVariant.price : product.base_price;
  const currentComparePrice = activeVariant ? activeVariant.compare_at_price : product.compare_at_price;
  const currentSku = activeVariant ? activeVariant.sku : product.sku;

  const discountPercentage = useMemo(() => {
    if (currentComparePrice && currentComparePrice > currentPrice) {
      return Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100);
    }
    return 0;
  }, [currentPrice, currentComparePrice]);

  const discountSavings = useMemo(() => {
    if (currentComparePrice && currentComparePrice > currentPrice) {
      return currentComparePrice - currentPrice;
    }
    return 0;
  }, [currentPrice, currentComparePrice]);

  // Real-Time Stock Calculation
  const variantInv = activeVariant?.inventory?.[0];
  const productInv = product.inventory?.[0];
  const currentInv = activeVariant ? variantInv : productInv;
  const availableStock = currentInv
    ? Math.max(0, currentInv.quantity - (currentInv.reserved_quantity || 0))
    : 15;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  // Quantity & Validation Error State
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Collapsible Accordions
  const [openSection, setOpenSection] = useState<string | null>("description");

  // Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // References for smooth scrolling
  const variantOptionsRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Intersection observer for sticky purchase bar on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (!ctaSectionRef.current) return;
      const rect = ctaSectionRef.current.getBoundingClientRect();
      // Show sticky bar once user scrolls past the main buy buttons
      setShowStickyBar(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMoveZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const validateSelection = (): boolean => {
    if (hasVariants) {
      if (optionDimensions.hasColorOpt && !selectedColor) {
        setValidationError("Please select a color before continuing.");
        variantOptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      if (optionDimensions.hasSizeOpt && !selectedSize) {
        setValidationError("Please select a size before continuing.");
        variantOptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      if (!activeVariant) {
        setValidationError("This combination is unavailable. Please choose another size or color.");
        variantOptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }

    if (isOutOfStock) {
      setValidationError("Selected garment is currently out of stock.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;

    addItem(
      {
        productId: product.id,
        variantId: activeVariant?.id,
        title: product.title,
        variantTitle: activeVariant?.title || (selectedSize && selectedColor ? `${selectedColor} / ${selectedSize}` : selectedSize || selectedColor || undefined),
        sku: currentSku,
        price: currentPrice,
        imageUrl: images[selectedImageIndex] || getMediaUrl(primaryMedia?.media?.public_url),
      },
      quantity
    );

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
    openCart();
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;

    setIsBuyingNow(true);
    addItem(
      {
        productId: product.id,
        variantId: activeVariant?.id,
        title: product.title,
        variantTitle: activeVariant?.title || (selectedSize && selectedColor ? `${selectedColor} / ${selectedSize}` : selectedSize || selectedColor || undefined),
        sku: currentSku,
        price: currentPrice,
        imageUrl: images[selectedImageIndex] || getMediaUrl(primaryMedia?.media?.public_url),
      },
      quantity
    );

    router.push("/checkout");
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

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-24">
      {/* 1. Main PDP Two-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start pt-2">
        {/* Left Column: Interactive Media Gallery (7 Cols Desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3.5 sm:gap-4 select-none">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0 scrollbar-none">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[3/4] w-16 sm:w-20 overflow-hidden bg-[#f4eee3] border transition-all cursor-pointer rounded-sm ${
                    selectedImageIndex === idx
                      ? "border-[#141312] ring-2 ring-[#141312]/20"
                      : "border-[#ded7c8] opacity-75 hover:opacity-100"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={imgUrl}
                    alt={`${product.title} view ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Primary Main Image Frame with Desktop Zoom */}
          <div
            className="relative w-full aspect-[3/4] max-h-[580px] sm:max-h-[640px] bg-[#f4eee3] border border-[#ded7c8] overflow-hidden flex items-center justify-center cursor-crosshair group rounded-sm"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMoveZoom}
          >
            {images[selectedImageIndex] ? (
              <Image
                src={images[selectedImageIndex]}
                alt={product.title}
                fill
                priority
                className={`object-cover object-center transition-transform duration-300 ${
                  isZoomed ? "scale-125" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono-meta text-xs text-[#8c8577]">
                RUST &amp; REVIVE
              </div>
            )}

            {/* Discount Badge on Image */}
            {discountPercentage > 0 && (
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <span className="px-2.5 py-1 bg-[#9e472a] text-white text-[11px] font-mono-meta uppercase tracking-widest font-bold shadow-sm rounded-xs">
                  SAVE {discountPercentage}%
                </span>
                {discountSavings > 0 && (
                  <span className="px-2 py-0.5 bg-[#141312]/80 backdrop-blur-xs text-white text-[9px] font-mono-meta uppercase tracking-wider">
                    ৳{discountSavings.toLocaleString()} OFF
                  </span>
                )}
              </div>
            )}

            {/* Top Right Action Icons */}
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 bg-white/90 backdrop-blur-xs border border-[#ded7c8] flex items-center justify-center text-[#5c574e] hover:text-[#141312] transition-colors rounded-full shadow-xs cursor-pointer"
                title="Share link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`w-9 h-9 border flex items-center justify-center transition-colors rounded-full shadow-xs cursor-pointer ${
                  isWishlisted
                    ? "bg-[#9e472a] border-[#9e472a] text-white"
                    : "bg-white/90 backdrop-blur-xs border-[#ded7c8] text-[#5c574e] hover:text-[#9e472a]"
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Garment Information & Purchase Controls (5 Cols Desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header: Title, SKU, Rating */}
          <div className="space-y-2 border-b border-[#ded7c8] pb-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#9e472a] font-bold">
                {product.brand || "Rust & Revive"} &bull; {currentSku}
              </span>
              {totalReviews > 0 && (
                <div className="flex items-center space-x-1.5 text-xs font-mono-meta text-[#141312]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-[#8c8577]">({totalReviews})</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-serif uppercase tracking-wider text-[#141312] leading-tight">
              {product.title}
            </h1>

            {/* Price Block */}
            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-2xl sm:text-3xl font-bold font-mono-meta text-[#141312]">
                ৳{currentPrice.toLocaleString()}
              </span>
              {currentComparePrice && currentComparePrice > currentPrice && (
                <span className="text-sm sm:text-base text-[#8c8577] line-through font-mono-meta">
                  ৳{currentComparePrice.toLocaleString()}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono-meta font-bold uppercase rounded-xs">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Active Promo Highlights */}
          <div className="p-3 bg-[#fbf9f5] border border-[#ded7c8] rounded-xs flex items-center space-x-2.5 text-xs font-mono-meta text-[#5c574e]">
            <Sparkles className="w-4 h-4 text-[#9e472a] shrink-0" />
            <span>Use promo code <strong>REVIVE10</strong> at checkout for 10% instant savings.</span>
          </div>

          {/* Real-Time Stock Indicator */}
          <div className="flex items-center space-x-2.5 py-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOutOfStock
                  ? "bg-rose-500"
                  : isLowStock
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <span
              className={`text-xs font-mono-meta uppercase tracking-wider font-bold ${
                isOutOfStock
                  ? "text-rose-600"
                  : isLowStock
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock — Unavailable"
                : isLowStock
                ? `Only ${availableStock} left in stock — Order soon`
                : `In Stock — Ready for Immediate Dispatch`}
            </span>
          </div>

          {/* Inline Validation Alert */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono-meta flex items-center space-x-2 rounded-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Variant Selection Matrix */}
          <div ref={variantOptionsRef} className="space-y-4 pt-1">
            {/* Color Selector (if multi-color) */}
            {optionDimensions.hasColorOpt && optionDimensions.colors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-bold">
                    Color: <span className="text-[#9e472a] font-normal">{selectedColor || "Select"}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {optionDimensions.colors.map((col) => {
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col);
                          setValidationError(null);
                        }}
                        className={`px-4 py-2 text-xs font-mono-meta uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#141312] bg-[#141312] text-[#fbf9f5] font-bold shadow-xs"
                            : "border-[#ded7c8] bg-white text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector (if multi-size) */}
            {optionDimensions.hasSizeOpt && optionDimensions.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-bold">
                    Size: <span className="text-[#9e472a] font-normal">{selectedSize || "Select"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center space-x-1.5 text-xs text-[#9e472a] hover:text-[#7d361f] font-mono-meta uppercase tracking-wider font-bold underline transition-colors cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {optionDimensions.sizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz);
                          setValidationError(null);
                        }}
                        className={`min-w-12 px-4 py-2.5 text-xs font-mono-meta uppercase tracking-wider border rounded-xs transition-all cursor-pointer text-center ${
                          isSelected
                            ? "border-[#141312] bg-[#141312] text-[#fbf9f5] font-bold shadow-xs"
                            : "border-[#ded7c8] bg-white text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single Option Fallback (if no color/size split) */}
            {!optionDimensions.hasColorOpt && !optionDimensions.hasSizeOpt && hasVariants && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-bold">
                    Select Option:
                  </span>
                  {product.size_chart && (
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="inline-flex items-center space-x-1.5 text-xs text-[#9e472a] hover:text-[#7d361f] font-mono-meta uppercase tracking-wider font-bold underline transition-colors cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size Guide</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {rawVariants.map((v) => {
                    const isSelected = singleVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSingleVariantId(v.id);
                          setValidationError(null);
                        }}
                        className={`px-4 py-2 text-xs font-mono-meta uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#141312] bg-[#141312] text-[#fbf9f5] font-bold shadow-xs"
                            : "border-[#ded7c8] bg-white text-[#5c574e] hover:border-[#141312] hover:text-[#141312]"
                        }`}
                      >
                        {v.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Sizing / Order Assistance */}
          <div className="pt-1">
            <a
              href={`https://wa.me/8801700000000?text=Hi%20Rust%20%26%20Revive%2C%20I%20need%20assistance%20with%20${encodeURIComponent(
                product.title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-[11px] font-mono-meta text-[#5c574e] hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Need sizing advice? Chat with an advisor on WhatsApp</span>
            </a>
          </div>

          {/* Purchase CTA Section */}
          <div ref={ctaSectionRef} className="space-y-3 pt-2">
            <div className="flex items-center space-x-3">
              {/* Stepper */}
              <div className="flex items-center border border-[#ded7c8] bg-white rounded-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                  className="p-3 text-[#5c574e] hover:text-[#141312] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3.5 text-xs font-mono-meta font-bold text-[#141312]">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={isOutOfStock || quantity >= availableStock}
                  className="p-3 text-[#5c574e] hover:text-[#141312] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Secondary CTA: Add to Bag */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 px-4 text-xs font-mono-meta uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-2 rounded-xs shadow-xs cursor-pointer ${
                  isOutOfStock
                    ? "bg-[#ded7c8] text-[#8c8577] cursor-not-allowed"
                    : "bg-[#f4eee3] hover:bg-[#ded7c8] text-[#141312] border border-[#ded7c8]"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Added to Cart ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            {/* Primary CTA: BUY NOW (Instant Checkout) */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBuyingNow}
              className={`w-full py-4 px-6 text-xs font-mono-meta uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center space-x-2 rounded-xs shadow-md cursor-pointer ${
                isOutOfStock
                  ? "bg-[#ded7c8] text-[#8c8577] cursor-not-allowed"
                  : "bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5]"
              }`}
            >
              <Zap className="w-4 h-4 text-[#ded7c8] fill-[#ded7c8]" />
              <span>
                {isOutOfStock
                  ? "Sold Out — Out of Stock"
                  : isBuyingNow
                  ? "Proceeding to Checkout..."
                  : `Buy Now — ৳${(currentPrice * quantity).toLocaleString()} (Cash on Delivery)`}
              </span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#ded7c8] text-xs font-mono-meta text-[#5c574e]">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#9e472a] shrink-0" />
              <span>Nationwide 2-4 Days Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-[#9e472a] shrink-0" />
              <span>7-Day Return / Exchange</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Authentic Quality</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#9e472a] shrink-0" />
              <span>Cash on Delivery Available</span>
            </div>
          </div>

          {/* Collapsible Accordions (Description, Sizing, Delivery, Returns) */}
          <div className="divide-y divide-[#ded7c8] border-y border-[#ded7c8] pt-2">
            {/* 1. Description */}
            <div>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "description" ? null : "description")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>Garment Description &amp; Details</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "description" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "description" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>{product.description || "Crafted using premium heritage fabrics and durable reinforced seams for enduring quality."}</p>
                </div>
              )}
            </div>

            {/* 2. Sizing & Fit */}
            <div>
              <button
                type="button"
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
                  <p>True to size relaxed cut. Designed for structured drape and comfortable movement.</p>
                  {product.size_chart && (
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="text-[#9e472a] font-mono-meta underline font-bold uppercase text-[11px] pt-1 block"
                    >
                      Open interactive size guide modal &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Delivery & Shipping */}
            <div>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "delivery" ? null : "delivery")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>Nationwide Shipping &amp; Payment</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "delivery" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "delivery" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>• <strong>Dhaka Metro</strong>: 24–48 hours standard delivery.</p>
                  <p>• <strong>Outside Dhaka</strong>: 2–4 business days via verified courier.</p>
                  <p>• <strong>Payment Option</strong>: Cash on Delivery (COD) with full package inspection guaranteed upon receipt.</p>
                </div>
              )}
            </div>

            {/* 4. Returns & Exchange */}
            <div>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "returns" ? null : "returns")}
                className="w-full py-3.5 flex justify-between items-center text-xs font-mono-meta uppercase tracking-wider text-[#141312] font-semibold text-left cursor-pointer"
              >
                <span>7-Day Hassle-Free Returns</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === "returns" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSection === "returns" && (
                <div className="pb-4 text-xs font-sans-ui text-[#5c574e] leading-relaxed space-y-2">
                  <p>We offer hassle-free size exchanges and returns within 7 calendar days of delivery. Items must be unworn and in original condition with tags attached.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer Reviews Section */}
      <section className="pt-10 border-t border-[#ded7c8] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif uppercase tracking-wider text-[#141312]">
              Customer Experiences &amp; Reviews
            </h3>
            <p className="text-xs font-mono-meta text-[#8c8577] mt-1">
              Verified patron feedback from across Bangladesh
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="px-5 py-2.5 border border-[#141312] text-xs font-mono-meta uppercase tracking-wider hover:bg-[#141312] hover:text-[#fbf9f5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            Submit Feedback
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 border border-dashed border-[#ded7c8] text-center space-y-2 bg-[#fcfbfa]">
            <p className="text-xs font-mono-meta uppercase text-[#8c8577]">
              No reviews published yet for this garment.
            </p>
            <p className="text-xs text-[#5c574e]">
              Be the first to share your experience with this archival piece.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 bg-white border border-[#ded7c8] space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.is_verified_purchase && (
                    <span className="text-[10px] font-mono-meta text-emerald-700 uppercase tracking-widest font-semibold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 inline" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                {rev.title && (
                  <h4 className="text-xs font-bold text-[#141312] font-mono-meta">
                    {rev.title}
                  </h4>
                )}

                <p className="text-xs text-[#5c574e] leading-relaxed line-clamp-4">
                  &ldquo;{rev.content}&rdquo;
                </p>

                <div className="pt-2 border-t border-[#f0ebe1] flex items-center justify-between text-[10px] font-mono-meta text-[#8c8577]">
                  <span className="font-semibold text-[#141312]">{rev.customer_name}</span>
                  <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Related Curated Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-[#ded7c8] space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#9e472a] font-semibold">
              Complete The Look
            </span>
            <h3 className="text-xl font-serif uppercase tracking-wider text-[#141312]">
              You May Also Like
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => {
              const relMedia = rel.product_media?.[0]?.media?.public_url;
              const relImg = getMediaUrl(relMedia) || "/placeholder-garment.webp";

              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="group block space-y-3 cursor-pointer"
                >
                  <div className="relative aspect-[3/4] bg-[#f4eee3] border border-[#ded7c8] overflow-hidden">
                    <Image
                      src={relImg}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {rel.compare_at_price && rel.compare_at_price > rel.base_price && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#9e472a] text-white text-[9px] font-mono-meta uppercase font-bold">
                        SALE
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-serif uppercase tracking-wider text-[#141312] group-hover:text-[#9e472a] transition-colors line-clamp-1">
                      {rel.title}
                    </h4>
                    <div className="flex items-baseline space-x-2 font-mono-meta text-xs">
                      <span className="font-bold text-[#141312]">
                        ৳{rel.base_price.toLocaleString()}
                      </span>
                      {rel.compare_at_price && rel.compare_at_price > rel.base_price && (
                        <span className="text-[10px] text-[#8c8577] line-through">
                          ৳{rel.compare_at_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Mobile Sticky Bottom Purchase Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ded7c8] p-3 shadow-lg lg:hidden transition-all animate-slide-up">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative w-11 h-11 bg-[#f4eee3] border border-[#ded7c8] shrink-0 overflow-hidden rounded-xs">
                <Image
                  src={images[selectedImageIndex] || "/placeholder-garment.webp"}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono-meta text-[#141312] font-bold truncate">
                  ৳{(currentPrice * quantity).toLocaleString()}
                </p>
                <p className="text-[10px] font-mono-meta text-[#8c8577] truncate">
                  {selectedSize ? `Size: ${selectedSize}` : "Select Option"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="px-3.5 py-2.5 text-[11px] font-mono-meta uppercase tracking-wider font-semibold border border-[#141312] bg-white text-[#141312] rounded-xs disabled:opacity-40"
              >
                Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || isBuyingNow}
                className="px-4 py-2.5 text-[11px] font-mono-meta uppercase tracking-wider font-bold bg-[#141312] text-[#fbf9f5] rounded-xs disabled:opacity-40 shadow-xs"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-[#141312]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#ded7c8] max-w-md w-full p-6 space-y-4 shadow-xl relative animate-fade-in rounded-xs">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-[#8c8577] hover:text-[#141312] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-serif uppercase tracking-wider text-[#141312]">
                Submit Garment Feedback
              </h3>
              <p className="text-xs font-mono-meta text-[#8c8577]">
                Share your impressions on fabric weight, fit, and craftsmanship.
              </p>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-mono-meta font-bold text-[#141312] uppercase">
                  Feedback Received
                </p>
                <p className="text-xs text-[#5c574e]">
                  Thank you. Your review will appear shortly after moderation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs font-mono-meta">
                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full p-2.5 bg-white border border-[#ded7c8] outline-none text-[#141312] rounded-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Rating *</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#141312] font-semibold mb-1">Review Details *</label>
                  <textarea
                    rows={4}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Describe the fabric weave, fit, and comfort..."
                    className="w-full p-2.5 bg-white border border-[#ded7c8] outline-none text-[#141312] rounded-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-[#ded7c8] text-[#5c574e] rounded-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-[#141312] text-[#fbf9f5] hover:bg-[#9e472a] transition-colors rounded-xs cursor-pointer font-bold"
                  >
                    {submittingReview ? "Submitting..." : "Publish Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        productTitle={product.title}
        sizeChart={product.size_chart}
        selectedSize={selectedSize || activeVariant?.title}
      />
    </div>
  );
}
