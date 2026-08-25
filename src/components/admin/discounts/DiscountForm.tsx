"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  Users,
  Loader2,
} from "lucide-react";
import type {
  PromotionType,
  PromotionMethod,
  ValueType,
  PromotionRuleConfig,
} from "@/lib/services/discount.service";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductOption {
  id: string;
  title: string;
  sku: string;
  base_price: number;
}

interface DiscountFormProps {
  mode: "create" | "edit";
  initialType?: PromotionType;
  initialData?: {
    id?: string;
    code: string;
    name: string;
    rules: PromotionRuleConfig;
    is_active?: boolean;
  };
}

export function DiscountForm({ mode, initialType = "AMOUNT_OFF_ORDER", initialData }: DiscountFormProps) {
  const router = useRouter();

  // Primary Metadata
  const promoType = initialData?.rules?.promotionType || initialType;
  const [method, setMethod] = useState<PromotionMethod>(
    initialData?.rules?.method || "CODE"
  );
  const [code, setCode] = useState(initialData?.code || "");
  const [title, setTitle] = useState(initialData?.name || "");

  // Value Settings
  const [valueType, setValueType] = useState<ValueType>(
    initialData?.rules?.valueType || (promoType === "FREE_SHIPPING" ? "FREE" : "PERCENTAGE")
  );
  const [value, setValue] = useState<number | "">(
    initialData?.rules?.value ?? (promoType === "FREE_SHIPPING" ? 120 : 10)
  );
  const [maxDiscount, setMaxDiscount] = useState<number | "">(
    initialData?.rules?.maximumDiscountAmount ?? ""
  );

  // Applies To / Targeting
  const [appliesTo, setAppliesTo] = useState<
    "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES" | "SPECIFIC_COLLECTIONS"
  >(
    (initialData?.rules?.appliesTo as any) || "ALL_PRODUCTS"
  );
  const [targetIds, setTargetIds] = useState<string[]>(
    initialData?.rules?.targetIds || []
  );

  // Buy X Get Y Settings
  const [bxyBuyValue, setBxyBuyValue] = useState<number | "">(
    initialData?.rules?.buyXGetY?.customerBuys?.value ?? 2
  );
  const [bxyBuyAppliesTo, setBxyBuyAppliesTo] = useState<
    "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES"
  >(
    (initialData?.rules?.buyXGetY?.customerBuys?.appliesTo as any) || "ALL_PRODUCTS"
  );
  const [bxyBuyTargetIds, setBxyBuyTargetIds] = useState<string[]>(
    initialData?.rules?.buyXGetY?.customerBuys?.targetIds || []
  );

  const [bxyGetQuantity, setBxyGetQuantity] = useState<number | "">(
    initialData?.rules?.buyXGetY?.customerGets?.quantity ?? 1
  );
  const [bxyGetRewardType, setBxyGetRewardType] = useState<"FREE" | "PERCENTAGE" | "FIXED_AMOUNT">(
    initialData?.rules?.buyXGetY?.customerGets?.rewardType || "FREE"
  );
  const [bxyGetDiscountValue, setBxyGetDiscountValue] = useState<number | "">(
    initialData?.rules?.buyXGetY?.customerGets?.discountValue ?? 100
  );

  // Minimum Requirements
  const [minReqType, setMinReqType] = useState<"NONE" | "MINIMUM_PURCHASE_AMOUNT" | "MINIMUM_QUANTITY">(
    initialData?.rules?.minimumRequirementType || "NONE"
  );
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number | "">(
    initialData?.rules?.minimumPurchaseAmount ?? 1000
  );
  const [minQuantity, setMinQuantity] = useState<number | "">(
    initialData?.rules?.minimumQuantity ?? 2
  );

  // Customer Eligibility
  const [customerEligibility, setCustomerEligibility] = useState<
    "ALL_CUSTOMERS" | "REGISTERED_CUSTOMERS" | "GUEST_CUSTOMERS"
  >(
    (initialData?.rules?.customerEligibility as any) || "ALL_CUSTOMERS"
  );

  // Usage Limits
  const [hasUsageLimit, setHasUsageLimit] = useState(
    Boolean(initialData?.rules?.usageLimit)
  );
  const [usageLimit, setUsageLimit] = useState<number | "">(
    initialData?.rules?.usageLimit ?? 100
  );
  const [hasPerCustomerLimit, setHasPerCustomerLimit] = useState(
    (initialData?.rules?.perCustomerLimit ?? 1) > 0
  );

  // Active Dates
  const [startDate, setStartDate] = useState(
    initialData?.rules?.startsAt
      ? initialData.rules.startsAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [hasEndDate, setHasEndDate] = useState(
    Boolean(initialData?.rules?.endsAt)
  );
  const [endDate, setEndDate] = useState(
    initialData?.rules?.endsAt ? initialData.rules.endsAt.slice(0, 16) : ""
  );

  // Combinations
  const [combineProduct, setCombineProduct] = useState(
    initialData?.rules?.combinations?.canCombineWithProductDiscounts ?? false
  );
  const [combineOrder, setCombineOrder] = useState(
    initialData?.rules?.combinations?.canCombineWithOrderDiscounts ?? false
  );
  const [combineShipping, setCombineShipping] = useState(
    initialData?.rules?.combinations?.canCombineWithShippingDiscounts ?? false
  );

  // Data Options (Categories & Products for selectors)
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, setIsDirty] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/products?limit=100"),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        if (catData?.data) setCategories(catData.data);
        if (prodData?.data) setProducts(prodData.data);
      } catch (err) {
        console.error("Failed to load catalog resources:", err);
      }
    }
    loadResources();
  }, []);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `RR-${rand.slice(0, 4)}-${rand.slice(4)}`;
    setCode(generated);
    if (!title) {
      setTitle(`Discount Code ${generated}`);
    }
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() && method === "CODE") {
      setErrorMsg("Please provide or generate a discount code.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Please provide a promotion title.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const rules: PromotionRuleConfig = {
        promotionType: promoType,
        method,
        valueType: promoType === "FREE_SHIPPING" ? "FREE" : valueType,
        value: promoType === "FREE_SHIPPING" ? 120 : Number(value) || 0,
        maximumDiscountAmount: maxDiscount !== "" ? Number(maxDiscount) : null,
        appliesTo,
        targetIds: appliesTo !== "ALL_PRODUCTS" ? targetIds : undefined,
        minimumRequirementType: minReqType,
        minimumPurchaseAmount: minReqType === "MINIMUM_PURCHASE_AMOUNT" ? Number(minPurchaseAmount) || 0 : undefined,
        minimumQuantity: minReqType === "MINIMUM_QUANTITY" ? Number(minQuantity) || 1 : undefined,
        customerEligibility,
        usageLimit: hasUsageLimit ? Number(usageLimit) || null : null,
        perCustomerLimit: hasPerCustomerLimit ? 1 : undefined,
        startsAt: startDate ? new Date(startDate).toISOString() : null,
        endsAt: hasEndDate && endDate ? new Date(endDate).toISOString() : null,
        combinations: {
          canCombineWithProductDiscounts: combineProduct,
          canCombineWithOrderDiscounts: combineOrder,
          canCombineWithShippingDiscounts: combineShipping,
        },
        buyXGetY:
          promoType === "BUY_X_GET_Y"
            ? {
                customerBuys: {
                  type: "QUANTITY",
                  value: Number(bxyBuyValue) || 1,
                  appliesTo: bxyBuyAppliesTo,
                  targetIds: bxyBuyAppliesTo !== "ALL_PRODUCTS" ? bxyBuyTargetIds : undefined,
                },
                customerGets: {
                  quantity: Number(bxyGetQuantity) || 1,
                  appliesTo: "ALL_PRODUCTS",
                  rewardType: bxyGetRewardType,
                  discountValue: bxyGetRewardType === "FREE" ? 100 : Number(bxyGetDiscountValue) || 0,
                },
              }
            : undefined,
      };

      const finalCode = method === "CODE" ? code.trim().toUpperCase() : `AUTO-${Date.now().toString(36).toUpperCase()}`;

      const payload = {
        code: finalCode,
        name: title.trim(),
        rules,
      };

      const url = mode === "create" ? "/api/admin/discounts" : `/api/admin/discounts/${initialData?.id}`;
      const httpMethod = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save discount.");
      }

      router.push("/admin/discounts");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/discounts")}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Create Discount" : `Edit Discount: ${initialData?.code}`}
            </h1>
            <p className="text-xs text-slate-500">
              {promoType === "AMOUNT_OFF_PRODUCTS" && "Amount off specific products or categories"}
              {promoType === "BUY_X_GET_Y" && "Buy X products, get Y products free or discounted"}
              {promoType === "AMOUNT_OFF_ORDER" && "Amount off total order subtotal"}
              {promoType === "FREE_SHIPPING" && "Complimentary nationwide shipping"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/discounts")}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#9e472a] hover:bg-[#7d361f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Discount</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Grid: Form (Left 8 Cols) + Live Summary Panel (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Adaptive Configuration */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Method & Code */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Discount Method & Code
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMethod("CODE");
                  setIsDirty(true);
                }}
                className={`p-3.5 border rounded-xl text-left cursor-pointer transition-all ${
                  method === "CODE"
                    ? "border-[#9e472a] bg-[#9e472a]/5 text-slate-900 ring-1 ring-[#9e472a]"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <span className="block text-xs font-bold">Discount Code</span>
                <span className="text-[11px] text-slate-500">Customers enter code at checkout</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("AUTOMATIC");
                  setIsDirty(true);
                }}
                className={`p-3.5 border rounded-xl text-left cursor-pointer transition-all ${
                  method === "AUTOMATIC"
                    ? "border-[#9e472a] bg-[#9e472a]/5 text-slate-900 ring-1 ring-[#9e472a]"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <span className="block text-xs font-bold">Automatic Discount</span>
                <span className="text-[11px] text-slate-500">Applied automatically in cart</span>
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Promotion Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Launch Celebration 20% Off"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl outline-none focus:border-[#9e472a] focus:ring-1 focus:ring-[#9e472a]"
                  required
                />
              </div>

              {method === "CODE" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Discount Code *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-xs text-[#9e472a] hover:text-[#7d361f] font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate random code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setIsDirty(true);
                    }}
                    placeholder="e.g. REVIVE20"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl outline-none focus:border-[#9e472a] focus:ring-1 focus:ring-[#9e472a]"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Customers will enter this code at checkout to claim their promotion.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Value & Type Specific Configuration */}
          {promoType !== "BUY_X_GET_Y" && promoType !== "FREE_SHIPPING" && (
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Discount Value
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setValueType("PERCENTAGE");
                    setIsDirty(true);
                  }}
                  className={`p-3 border rounded-xl text-center text-xs font-semibold cursor-pointer transition-all ${
                    valueType === "PERCENTAGE"
                      ? "border-[#9e472a] bg-[#9e472a]/5 text-[#9e472a] font-bold"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValueType("FIXED_AMOUNT");
                    setIsDirty(true);
                  }}
                  className={`p-3 border rounded-xl text-center text-xs font-semibold cursor-pointer transition-all ${
                    valueType === "FIXED_AMOUNT"
                      ? "border-[#9e472a] bg-[#9e472a]/5 text-[#9e472a] font-bold"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  Fixed Amount (৳)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {valueType === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Amount (৳)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={valueType === "PERCENTAGE" ? 100 : undefined}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value ? Number(e.target.value) : "");
                      setIsDirty(true);
                    }}
                    placeholder={valueType === "PERCENTAGE" ? "20" : "500"}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl outline-none focus:border-[#9e472a]"
                    required
                  />
                </div>

                {valueType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Max Discount Cap (৳) (Optional)
                    </label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => {
                        setMaxDiscount(e.target.value ? Number(e.target.value) : "");
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 1000"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl outline-none focus:border-[#9e472a]"
                    />
                  </div>
                )}
              </div>

              {promoType === "AMOUNT_OFF_PRODUCTS" && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Applies To
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "ALL_PRODUCTS", label: "All products in store" },
                      { id: "SPECIFIC_CATEGORIES", label: "Specific product categories" },
                      { id: "SPECIFIC_PRODUCTS", label: "Specific products" },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="appliesTo"
                          checked={appliesTo === opt.id}
                          onChange={() => {
                            setAppliesTo(opt.id as any);
                            setTargetIds([]);
                            setIsDirty(true);
                          }}
                          className="text-[#9e472a] focus:ring-[#9e472a]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {appliesTo === "SPECIFIC_CATEGORIES" && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-mono text-slate-500 mb-1">
                        Select Categories:
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                        {categories.map((c) => {
                          const selected = targetIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setTargetIds((prev) =>
                                  selected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                );
                                setIsDirty(true);
                              }}
                              className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                                selected
                                  ? "bg-[#9e472a] text-white border-[#9e472a]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {appliesTo === "SPECIFIC_PRODUCTS" && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-mono text-slate-500 mb-1">
                        Select Products:
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                        {products.map((p) => {
                          const selected = targetIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setTargetIds((prev) =>
                                  selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                );
                                setIsDirty(true);
                              }}
                              className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                                selected
                                  ? "bg-[#9e472a] text-white border-[#9e472a]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{p.title}</span>
                              <span className="text-[10px] opacity-75 font-mono">
                                (৳{p.base_price})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Card 2B: Buy X Get Y Configuration */}
          {promoType === "BUY_X_GET_Y" && (
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Buy X Get Y Rules
              </h3>

              {/* Customer Buys */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Customer Buys
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bxyBuyValue}
                      onChange={(e) => {
                        setBxyBuyValue(e.target.value ? Number(e.target.value) : "");
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      From
                    </label>
                    <select
                      value={bxyBuyAppliesTo}
                      onChange={(e) => {
                        setBxyBuyAppliesTo(e.target.value as any);
                        setBxyBuyTargetIds([]);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="ALL_PRODUCTS">Any product in store</option>
                      <option value="SPECIFIC_CATEGORIES">Specific Categories</option>
                      <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                    </select>
                  </div>
                </div>

                {bxyBuyAppliesTo === "SPECIFIC_CATEGORIES" && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setBxyBuyTargetIds((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`px-2.5 py-1 text-[11px] rounded border ${
                          bxyBuyTargetIds.includes(c.id)
                            ? "bg-[#9e472a] text-white border-[#9e472a]"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Gets */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Customer Gets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Reward Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bxyGetQuantity}
                      onChange={(e) => {
                        setBxyGetQuantity(e.target.value ? Number(e.target.value) : "");
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Reward Type
                    </label>
                    <select
                      value={bxyGetRewardType}
                      onChange={(e) => {
                        setBxyGetRewardType(e.target.value as any);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="FREE">Free (100% Off)</option>
                      <option value="PERCENTAGE">Percentage Discount (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Discount (৳)</option>
                    </select>
                  </div>

                  {bxyGetRewardType !== "FREE" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        value={bxyGetDiscountValue}
                        onChange={(e) => {
                          setBxyGetDiscountValue(e.target.value ? Number(e.target.value) : "");
                          setIsDirty(true);
                        }}
                        placeholder="50"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Card 3: Minimum Requirements */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Minimum Requirements
            </h3>

            <div className="space-y-2">
              {[
                { id: "NONE", label: "No minimum requirements" },
                { id: "MINIMUM_PURCHASE_AMOUNT", label: "Minimum purchase amount (৳)" },
                { id: "MINIMUM_QUANTITY", label: "Minimum quantity of items" },
              ].map((opt) => (
                <label key={opt.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="minReq"
                    checked={minReqType === opt.id}
                    onChange={() => {
                      setMinReqType(opt.id as any);
                      setIsDirty(true);
                    }}
                    className="text-[#9e472a] focus:ring-[#9e472a]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {minReqType === "MINIMUM_PURCHASE_AMOUNT" && (
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Minimum Order Subtotal (৳)
                </label>
                <input
                  type="number"
                  value={minPurchaseAmount}
                  onChange={(e) => {
                    setMinPurchaseAmount(e.target.value ? Number(e.target.value) : "");
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 1500"
                  className="w-full sm:w-64 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#9e472a]"
                />
              </div>
            )}

            {minReqType === "MINIMUM_QUANTITY" && (
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Minimum Item Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={minQuantity}
                  onChange={(e) => {
                    setMinQuantity(e.target.value ? Number(e.target.value) : "");
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 3"
                  className="w-full sm:w-64 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#9e472a]"
                />
              </div>
            )}
          </section>

          {/* Card 4: Customer Eligibility & Usage Limits */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Customer Eligibility & Usage Limits
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Customer Eligibility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "ALL_CUSTOMERS", label: "All Customers" },
                  { id: "REGISTERED_CUSTOMERS", label: "Registered Only" },
                  { id: "GUEST_CUSTOMERS", label: "Guests Only" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCustomerEligibility(opt.id as any);
                      setIsDirty(true);
                    }}
                    className={`p-2.5 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      customerEligibility === opt.id
                        ? "border-[#9e472a] bg-[#9e472a]/5 text-[#9e472a] font-bold"
                        : "border-slate-200 text-slate-700 bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasUsageLimit}
                  onChange={(e) => {
                    setHasUsageLimit(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a]"
                />
                <span>Limit number of times this discount can be used in total</span>
              </label>

              {hasUsageLimit && (
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => {
                    setUsageLimit(e.target.value ? Number(e.target.value) : "");
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 100"
                  className="w-full sm:w-64 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                />
              )}

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={hasPerCustomerLimit}
                  onChange={(e) => {
                    setHasPerCustomerLimit(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a]"
                />
                <span>Limit to one use per customer</span>
              </label>
            </div>
          </section>

          {/* Card 5: Combinations & Schedule */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Active Dates & Combinations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Set End Date
                  </label>
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => {
                      setHasEndDate(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="rounded border-slate-300 text-[#9e472a]"
                  />
                </div>
                {hasEndDate && (
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                  />
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Combinations
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Control whether this promotion can be stacked with other promotions.
              </p>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineProduct}
                  onChange={(e) => setCombineProduct(e.target.checked)}
                  className="rounded border-slate-300 text-[#9e472a]"
                />
                <span>Can combine with Product discounts</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineOrder}
                  onChange={(e) => setCombineOrder(e.target.checked)}
                  className="rounded border-slate-300 text-[#9e472a]"
                />
                <span>Can combine with Order discounts</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineShipping}
                  onChange={(e) => setCombineShipping(e.target.checked)}
                  className="rounded border-slate-300 text-[#9e472a]"
                />
                <span>Can combine with Free Shipping promotions</span>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Live Desktop Summary Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9e472a] bg-[#9e472a]/10 px-2 py-0.5 rounded-full">
                Summary Preview
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                {title || (code ? code : "Untitled Promotion")}
              </h3>
              <p className="text-xs font-mono font-bold text-[#9e472a] mt-0.5">
                {method === "CODE" ? code || "NO CODE SET" : "AUTOMATIC PROMOTION"}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <Tag className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Type & Value:</span>
                  <span className="text-slate-600">
                    {promoType === "FREE_SHIPPING"
                      ? "Free nationwide shipping"
                      : promoType === "BUY_X_GET_Y"
                      ? `Buy ${bxyBuyValue} → Get ${bxyGetQuantity} (${bxyGetRewardType})`
                      : `${value || 0}${valueType === "PERCENTAGE" ? "% OFF" : " ৳ OFF"}`}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Targeting:</span>
                  <span className="text-slate-600">
                    {appliesTo === "ALL_PRODUCTS" && "Applies to all products"}
                    {appliesTo === "SPECIFIC_CATEGORIES" && `${targetIds.length} selected categories`}
                    {appliesTo === "SPECIFIC_PRODUCTS" && `${targetIds.length} selected products`}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Eligibility:</span>
                  <span className="text-slate-600">
                    {customerEligibility === "ALL_CUSTOMERS" && "All customers"}
                    {customerEligibility === "REGISTERED_CUSTOMERS" && "Registered accounts only"}
                    {customerEligibility === "GUEST_CUSTOMERS" && "Guest checkouts only"}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Active Period:</span>
                  <span className="text-slate-600">
                    {startDate ? new Date(startDate).toLocaleDateString() : "Immediate"}
                    {hasEndDate && endDate ? ` — ${new Date(endDate).toLocaleDateString()}` : " (No expiry)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#9e472a] hover:bg-[#7d361f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Discount</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
