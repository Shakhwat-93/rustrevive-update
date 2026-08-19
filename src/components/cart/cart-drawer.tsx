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
        <div className="w-screen max-w-md bg-[#121212] border-l border-[#262626] text-[#E0DDD5] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#C98A4B]" />
              <h2 className="text-sm font-serif uppercase tracking-[0.2em] font-medium">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="text-[#8E8B82] hover:text-[#E0DDD5] transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 text-[#8E8B82]">
                <ShoppingBag className="w-10 h-10 stroke-[1] text-[#4A4843]" />
                <p className="text-xs uppercase tracking-widest font-mono">Your cart is empty</p>
                <button
                  onClick={closeCart}
                  className="px-6 py-2.5 bg-[#C98A4B] text-black text-xs font-mono uppercase tracking-widest font-semibold hover:bg-[#b57a3e] transition-colors"
                >
                  Discover Pieces
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || "default"}`}
                  className="flex space-x-4 border-b border-[#1E1E1E] pb-6"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-[#1A1A1A] border border-[#262626] relative overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#4A4843] text-[10px] font-mono">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-serif uppercase tracking-wider text-[#E0DDD5] line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-[#6E6B63] hover:text-rose-400 transition-colors ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantTitle && (
                        <p className="text-[11px] font-mono text-[#8E8B82] mt-0.5">
                          {item.variantTitle}
                        </p>
                      )}

                      <p className="text-xs font-mono text-[#C98A4B] mt-1 font-semibold">
                        ৳{item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center border border-[#333] bg-[#161616]">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-1.5 text-[#8E8B82] hover:text-[#E0DDD5] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-mono text-[#E0DDD5]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="p-1.5 text-[#8E8B82] hover:text-[#E0DDD5] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-[#8E8B82]">
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
            <div className="p-6 border-t border-[#262626] bg-[#161616] space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#8E8B82]">
                  <span>Subtotal</span>
                  <span className="text-[#E0DDD5]">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-[#8E8B82]">
                  <span>Shipping</span>
                  <span className="text-[#8E8B82]">Calculated at checkout</span>
                </div>
                <div className="border-t border-[#262626] pt-2 flex justify-between text-sm font-mono text-[#E0DDD5] font-semibold">
                  <span>Estimated Total</span>
                  <span className="text-[#C98A4B]">৳{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 bg-[#C98A4B] text-black font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#b57a3e] transition-all shadow-lg hover:shadow-[#C98A4B]/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
