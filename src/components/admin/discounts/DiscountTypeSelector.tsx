"use client";

import React from "react";
import { Tag, ShoppingBag, Percent, Truck, ArrowRight } from "lucide-react";
import type { PromotionType } from "@/lib/services/discount.service";

interface DiscountTypeSelectorProps {
  onSelect: (type: PromotionType) => void;
}

const DISCOUNT_TYPES: {
  type: PromotionType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  example: string;
  badge?: string;
}[] = [
  {
    type: "AMOUNT_OFF_PRODUCTS",
    title: "Amount off products",
    subtitle: "Discount specific products, categories, or collections (Percentage or Flat ৳)",
    icon: Tag,
    example: "e.g. 20% OFF all Heavyweight Tees or ৳300 OFF Denim",
  },
  {
    type: "BUY_X_GET_Y",
    title: "Buy X Get Y",
    subtitle: "Discount specific products based on what the customer buys (Free, % off, or ৳ off)",
    icon: ShoppingBag,
    example: "e.g. Buy 2 Shirts → Get 1 Cap Free or 50% OFF",
    badge: "POPULAR",
  },
  {
    type: "AMOUNT_OFF_ORDER",
    title: "Amount off order",
    subtitle: "Discount the customer's total order amount with optional minimum subtotal",
    icon: Percent,
    example: "e.g. ৳500 OFF orders above ৳3,000 or 15% OFF entire cart",
  },
  {
    type: "FREE_SHIPPING",
    title: "Free shipping",
    subtitle: "Offer free nationwide standard delivery with optional minimum order threshold",
    icon: Truck,
    example: "e.g. Free shipping on all orders above ৳2,000",
  },
];

export function DiscountTypeSelector({ onSelect }: DiscountTypeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Select discount type</h2>
        <p className="text-xs text-slate-500">
          Choose a promotional model to configure custom pricing, customer rewards, or free shipping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DISCOUNT_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              className="p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-[#9e472a] hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#9e472a]/10 text-slate-700 group-hover:text-[#9e472a] flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-[#9e472a]/10 text-[#9e472a] text-[10px] font-bold tracking-wider uppercase rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#9e472a] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{item.example}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#9e472a] group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
