"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ChevronLeft, Trash2 } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

interface WishlistItem {
  id: string;
  product_id?: string;
  created_at: string;
  products?: {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    compare_at_price?: number | null;
    product_media?: Array<{
      is_primary?: boolean;
      media?: {
        public_url?: string;
      };
    }>;
  };
}

export default function AccountWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/wishlist");
      const data = await res.json();
      if (data?.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: string, itemId: string) => {
    setRemovingId(itemId);
    try {
      await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-1 pt-4">
            <Link
              href="/account"
              className="inline-flex items-center space-x-1 text-xs font-mono text-[#8c8577] hover:text-[#141312] transition-colors mb-4"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Account</span>
            </Link>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold block">
              Saved Pieces
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">Wishlist</h1>
          </div>

          {loading ? (
            <div className="bg-white border border-[#e8e2d5] p-8 text-center text-xs font-mono text-[#8c8577]">
              Loading wishlist...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <Heart className="w-8 h-8 text-[#9e472a] mx-auto" />
              <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                No saved pieces yet
              </h3>
              <p className="text-xs font-sans text-[#5c574e] max-w-sm mx-auto">
                Tap the heart icon on any product to save it to your wishlist.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => {
                const product = item.products;
                const imgUrl = product?.product_media?.[0]?.media?.public_url;
                const pId = product?.id || item.product_id || "";

                return (
                  <div key={item.id} className="bg-white border border-[#e8e2d5] shadow-xs group relative">
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(pId, item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 border border-[#e8e2d5] text-rose-400 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Product Image */}
                    <Link href={`/shop/${product?.slug ?? ""}`}>
                      <div className="relative aspect-[3/4] bg-[#f0ebe1] overflow-hidden">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={product?.title || "Product"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Heart className="w-8 h-8 text-[#c8c0b3]" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-3 space-y-1">
                      <Link
                        href={`/shop/${product?.slug ?? ""}`}
                        className="block text-xs font-mono font-semibold text-[#141312] hover:text-[#9e472a] transition-colors line-clamp-2"
                      >
                        {product?.title || "Unknown Product"}
                      </Link>
                      {product?.base_price !== undefined && (
                        <p className="text-[11px] font-mono text-[#5c574e]">
                          ৳{product.base_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
