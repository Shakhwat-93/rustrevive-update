"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/cart-context";

interface WishlistProduct {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  is_active: boolean;
  product_media?: { is_primary: boolean; media?: { public_url?: string } }[];
}

export default function WishlistPage() {
  const { addItem, openCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rustrevive_wishlist");
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemove = (productId: string) => {
    const updated = wishlistItems.filter((i) => i.id !== productId);
    setWishlistItems(updated);
    try {
      localStorage.setItem("rustrevive_wishlist", JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const handleMoveToBag = (product: WishlistProduct) => {
    const primaryImg = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
    addItem({
      productId: product.id,
      title: product.title,
      sku: product.id.slice(0, 8).toUpperCase(),
      price: product.base_price,
      imageUrl: primaryImg?.media?.public_url,
    });
    handleRemove(product.id);
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#141312] pt-24 pb-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
            Saved Essentials
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
            Your Wishlist
          </h1>
          <p className="text-xs font-mono text-[#6E6B63]">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved for future acquisition
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-[#6E6B63]">Loading your saved items...</div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white border border-[#ded7c8] p-12 text-center space-y-4 shadow-sm">
            <Heart className="w-8 h-8 text-[#9e472a] mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
              Your wishlist is currently empty
            </h3>
            <p className="text-xs font-mono text-[#6E6B63] max-w-sm mx-auto">
              Explore our curated collections of raw denim, tailored outerwear, and heritage essentials to save your favourites.
            </p>
            <div className="pt-2">
              <Link
                href="/collections/all"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#141312] text-[#fbf9f5] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((product) => {
              const primaryImg = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
              return (
                <div key={product.id} className="bg-white border border-[#ded7c8] p-4 flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="relative aspect-3/4 bg-[#f7f5f0] border border-[#e8e2d5] overflow-hidden">
                      {primaryImg?.media?.public_url ? (
                        <Image
                          src={primaryImg.media.public_url}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#8E8B82]">
                          RUST & REVIVE
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif text-sm uppercase tracking-wider text-[#141312] line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="font-mono text-xs font-semibold text-[#141312] mt-0.5">
                        ৳{product.base_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f0ebe1] flex items-center space-x-2">
                    <button
                      onClick={() => handleMoveToBag(product)}
                      className="flex-1 py-2 bg-[#141312] text-[#fbf9f5] text-[11px] font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="p-2 border border-[#ded7c8] text-[#6E6B63] hover:text-rose-700 hover:border-rose-300 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
