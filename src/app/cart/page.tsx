"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const estimatedShipping = subtotal > 0 ? (subtotal >= 4000 ? 0 : 70) : 0;
  const grandTotal = subtotal + estimatedShipping;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Acquisition Review
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Your Shopping Bag
            </h1>
            <p className="text-xs font-mono-meta text-[#5c574e]">
              {mounted ? items.length : 0} {items.length === 1 ? "garment piece" : "garment pieces"}
            </p>
          </div>

          {!mounted ? (
            <div className="py-20 text-center text-xs font-mono-meta text-[#5c574e]">
              Loading your shopping bag...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-[#ded7c8] p-12 text-center space-y-4 shadow-xs">
              <ShoppingBag className="w-8 h-8 text-[#9e472a] mx-auto" />
              <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                Your bag is currently empty
              </h3>
              <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
                Explore our curated collections of raw selvedge denim and heavyweight t-shirts.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Items List (8 Cols) */}
              <div className="lg:col-span-8 bg-white border border-[#ded7c8] divide-y divide-[#ded7c8] shadow-xs">
                {items.map((item, idx) => (
                  <div key={`${item.productId}-${item.variantId || idx}`} className="p-4 sm:p-6 flex items-start space-x-4">
                    {/* Item Image */}
                    <div className="relative aspect-[3/4] w-20 sm:w-24 bg-[#f4eee3] border border-[#ded7c8] shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono-meta text-[10px] text-[#8c8577]">
                          R&amp;R
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-serif text-sm sm:text-base uppercase tracking-tight text-[#141312] line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs font-mono-meta text-[#8c8577]">
                        SKU: {item.sku} {item.variantTitle && `| ${item.variantTitle}`}
                      </p>
                      <p className="text-xs font-mono-meta font-bold text-[#141312] pt-1">
                        ৳{item.price.toLocaleString()}
                      </p>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center space-x-4 pt-3">
                        <div className="flex items-center border border-[#ded7c8]">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="p-1.5 text-[#5c574e] hover:text-[#141312] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-mono-meta font-bold text-[#141312]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="p-1.5 text-[#5c574e] hover:text-[#141312] cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-xs font-mono-meta text-[#8c8577] hover:text-rose-700 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right font-mono-meta text-xs sm:text-sm font-bold text-[#141312]">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Box (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-[#ded7c8] p-6 space-y-4 shadow-xs font-mono-meta text-xs">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-[#141312] font-semibold border-b border-[#ded7c8] pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-[#5c574e]">
                    <div className="flex justify-between">
                      <span>Garment Subtotal</span>
                      <span className="text-[#141312] font-semibold">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Shipping</span>
                      <span className="text-[#141312] font-semibold">
                        {estimatedShipping === 0 ? "Complimentary" : `৳${estimatedShipping.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#ded7c8] pt-3 flex justify-between text-sm font-bold text-[#141312]">
                    <span>Total (BDT)</span>
                    <span>৳{grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/checkout"
                      className="w-full py-3.5 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 block text-center cursor-pointer"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <p className="text-[10px] text-[#8c8577] text-center pt-2">
                    Taxes calculated at checkout. Cash On Delivery available.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
