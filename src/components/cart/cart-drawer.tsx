"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function CartDrawer() {
  const { items, itemCount, subtotal, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#fbf9f5] border-l border-[#ded7c8] text-[#141312] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#fbf9f5]">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#9e472a]" />
              <h2 className="text-sm font-serif uppercase tracking-[0.2em] font-medium text-[#141312]">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="text-[#8c8577] hover:text-[#141312] transition-colors p-1 cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 text-[#5c574e]">
                <ShoppingBag className="w-12 h-12 stroke-[1] text-[#9e472a]" />
                <p className="text-xs uppercase tracking-widest font-mono-meta">Your cart is empty</p>
                <button
                  onClick={closeCart}
                  className="px-6 py-3 bg-[#9e472a] text-white text-xs font-mono-meta uppercase tracking-widest font-semibold hover:bg-[#873c22] transition-all shadow-xs cursor-pointer"
                >
                  Discover Pieces
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || "default"}`}
                  className="flex space-x-4 border-b border-[#ded7c8] pb-6"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-[#f4eee3] border border-[#ded7c8] relative overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8c8577] text-[10px] font-mono-meta">
                        R&amp;R
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-serif uppercase tracking-wider text-[#141312] line-clamp-1 font-semibold">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-[#8c8577] hover:text-rose-600 transition-colors ml-2 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantTitle && (
                        <p className="text-[11px] font-mono-meta text-[#8c8577] mt-0.5">
                          {item.variantTitle}
                        </p>
                      )}

                      <p className="text-xs font-mono-meta text-[#9e472a] mt-1 font-bold">
                        ৳{item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center border border-[#ded7c8] bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-1.5 text-[#5c574e] hover:text-[#141312] hover:bg-[#f4eee3] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-mono-meta text-[#141312] font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="p-1.5 text-[#5c574e] hover:text-[#141312] hover:bg-[#f4eee3] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] font-mono-meta text-[#5c574e]">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#ded7c8] bg-[#f8f3eb] space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono-meta text-[#5c574e]">
                  <span>Subtotal</span>
                  <span className="text-[#141312] font-bold">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-mono-meta text-[#5c574e]">
                  <span>Shipping</span>
                  <span className="text-[#8c8577]">Calculated at checkout</span>
                </div>
                <div className="border-t border-[#ded7c8] pt-2 flex justify-between text-sm font-mono-meta text-[#141312] font-bold">
                  <span>Estimated Total</span>
                  <span className="text-[#9e472a]">৳{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 bg-[#9e472a] text-white font-mono-meta text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#873c22] transition-all shadow-md cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full py-2.5 border border-[#ded7c8] bg-white text-[#141312] font-mono-meta text-xs uppercase tracking-wider font-medium flex items-center justify-center hover:bg-[#f4eee3] transition-colors cursor-pointer"
              >
                <span>View Full Bag</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
