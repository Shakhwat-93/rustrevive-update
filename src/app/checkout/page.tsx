"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  Banknote,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Package,
  Tag,
  X,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/context/cart-context";

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
}

interface PricingSummary {
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart();

  // Stable idempotency key for this checkout attempt
  const [idempotencyKey] = useState(() => `rr_checkout_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coupon Form State
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    customerNotes: "",
  });

  // Fetch Shipping Methods & Validate Pricing
  useEffect(() => {
    async function loadCheckoutData() {
      if (items.length === 0) {
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        setErrorMsg(null);

        // 1. Fetch Shipping Methods
        const shipRes = await fetch("/api/checkout/summary");
        const shipData = await shipRes.json();
        if (shipData?.data && Array.isArray(shipData.data)) {
          setShippingMethods(shipData.data);
          if (shipData.data[0] && !selectedShippingId) {
            setSelectedShippingId(shipData.data[0].id);
          }
        }

        // 2. Fetch Live Server Pricing
        const sumRes = await fetch("/api/checkout/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            shippingMethodId: selectedShippingId || undefined,
            couponCode: appliedCoupon?.code || undefined,
            customerEmail: form.email || undefined,
          }),
        });

        const sumData = await sumRes.json();
        if (sumRes.ok && sumData?.data) {
          setPricing(sumData.data);
        } else {
          setErrorMsg(sumData?.error?.message || "Some items in your cart are no longer available.");
        }
      } catch {
        setErrorMsg("Failed to connect to checkout services. Please check your internet connection.");
      } finally {
        setIsValidating(false);
      }
    }

    loadCheckoutData();
  }, [items, selectedShippingId, appliedCoupon, form.email]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponFeedback(null);
    const res = await applyCoupon(couponInput.trim());
    setCouponLoading(false);

    if (res.success) {
      setCouponFeedback({ type: "success", message: res.message });
      setCouponInput("");
    } else {
      setCouponFeedback({ type: "error", message: res.message });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.addressLine1.trim()) {
      setErrorMsg("Please fill in your name, phone number, and delivery address.");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
        },
        shippingAddress: {
          fullName: form.name.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          city: "Bangladesh",
          country: "Bangladesh",
        },
        shippingMethodId: selectedShippingId || undefined,
        couponCode: appliedCoupon?.code || undefined,
        customerNotes: form.customerNotes.trim() || undefined,
        paymentMethod: "CASH_ON_DELIVERY",
        idempotencyKey,
      };

      const res = await fetch("/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to place order. Please try again.");
      }

      const orderNumber = data.data.order_number;
      clearCart();
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An unexpected error occurred while placing your order.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center">
        <Package className="w-12 h-12 text-[#9e472a] mb-4 stroke-[1.2]" />
        <h1 className="text-2xl font-serif uppercase tracking-wider text-[#141312]">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-xs font-mono text-[#6E6B63] mt-2 max-w-sm">
          Please discover and select your preferred handcrafted pieces from our collections before checking out.
        </p>
        <Link
          href="/"
          className="mt-6 px-8 py-3 bg-[#141312] text-[#fbf9f5] font-mono text-xs uppercase tracking-widest font-medium hover:bg-[#9e472a] transition-colors"
        >
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#141312] pt-24 pb-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-mono uppercase tracking-widest text-[#6E6B63] hover:text-[#9e472a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Return to Store
          </Link>
        </div>

        {/* Page Title */}
        <div className="border-b border-[#ded7c8] pb-4 mb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
            Secure Checkout
          </span>
          <h1 className="text-3xl font-serif uppercase tracking-wide text-[#141312] mt-1">
            Complete Your Order
          </h1>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Checkout Notification</p>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: Checkout Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Customer Contact */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4 flex items-center justify-between">
                <span>1. Contact Details</span>
                <span className="text-[10px] text-[#8E8B82] font-normal">Guest Checkout</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Phone Number (Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4">
                2. Delivery Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Full Delivery Address (House / Road / Area / City) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    placeholder="e.g. House 14, Road 7, Sector 3, Uttara, Dhaka / Village, Thana, District..."
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Special Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.customerNotes}
                    onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                    placeholder="e.g. Please call before delivery or deliver after 3 PM..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Shipping Method Selection */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4 flex items-center justify-between">
                <span>3. Shipping Method</span>
                <Truck className="w-4 h-4 text-[#9e472a]" />
              </h2>

              <div className="rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden bg-white">
                {shippingMethods.map((method) => {
                  const isSelected = selectedShippingId === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedShippingId(method.id)}
                      className={`p-4 flex items-start justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/40 border-2 -m-[1px] border-blue-600 rounded-lg relative z-10"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        {/* Custom Blue Radio Dot */}
                        <div className="pt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-blue-600 bg-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">
                            {method.name}
                          </p>
                          {method.description && (
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {method.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 ml-4 shrink-0">
                        ৳{method.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Payment Method */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4 flex items-center justify-between">
                <span>4. Payment Option</span>
                <Banknote className="w-4 h-4 text-[#9e472a]" />
              </h2>

              <div className="p-4 border border-[#9e472a] bg-[#faf6f0] flex items-start space-x-3">
                <input
                  type="radio"
                  name="payment_option"
                  checked={true}
                  readOnly
                  className="mt-1 accent-[#9e472a]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono font-semibold text-[#141312]">
                      Cash on Delivery (COD)
                    </p>
                    <span className="text-[10px] font-mono bg-[#9e472a]/10 text-[#9e472a] px-2 py-0.5 font-medium">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6B63] font-sans mt-1">
                    Pay securely in cash directly to our logistics partner upon unboxing and receiving your order.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary & Placement (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm sticky top-28 space-y-6">
              <div className="flex items-center justify-between border-b border-[#f0ebe1] pb-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312]">
                  Order Summary ({items.reduce((acc, i) => acc + i.quantity, 0)})
                </h3>
                <span className="text-[11px] font-mono text-[#8E8B82]">BDT (৳)</span>
              </div>

              {/* Items Preview */}
              <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1 divide-y divide-[#f0ebe1]">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || "default"}`}
                    className="pt-3 first:pt-0 flex space-x-3"
                  >
                    <div className="w-14 h-16 bg-[#f7f5f0] border border-[#e8e2d5] relative overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="60px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E8B82] text-[9px] font-mono">
                          R&R
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-xs font-serif uppercase tracking-wider text-[#141312] line-clamp-1">
                          {item.title}
                        </h4>
                        {item.variantTitle && (
                          <p className="text-[10px] font-mono text-[#8E8B82]">
                            {item.variantTitle}
                          </p>
                        )}
                        <p className="text-[11px] font-mono text-[#6E6B63] mt-0.5">
                          Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs font-mono font-semibold text-[#141312] self-end">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon / Promo Code Input */}
              <div className="border-t border-[#f0ebe1] pt-4 space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#141312] font-semibold flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#9e472a]" />
                    <span>Promo / Discount Code</span>
                  </span>
                </label>

                {appliedCoupon ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-mono font-bold text-emerald-800 tracking-wider">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            APPLIED
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-0.5 line-clamp-1">
                          {appliedCoupon.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoupon()}
                      className="text-emerald-700 hover:text-red-600 p-1 text-xs transition-colors"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="e.g. REVIVE10"
                        className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-[#ded7c8] bg-white outline-none focus:border-[#141312]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 bg-[#141312] text-[#fbf9f5] font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>

                    {couponFeedback && (
                      <p
                        className={`text-[11px] font-mono ${
                          couponFeedback.type === "success" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {couponFeedback.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Server Price Calculation Breakdown */}
              <div className="border-t border-[#f0ebe1] pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#6E6B63]">
                  <span>Subtotal</span>
                  <span className="text-[#141312]">
                    ৳{pricing ? pricing.subtotal.toLocaleString() : "..."}
                  </span>
                </div>

                {pricing && pricing.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>Discount ({appliedCoupon?.code || "PROMO"})</span>
                    </span>
                    <span>-৳{pricing.discountTotal.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6E6B63]">
                  <span>Shipping</span>
                  <span className="text-[#141312]">
                    {pricing?.shippingTotal === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        FREE SHIPPING
                      </span>
                    ) : (
                      `৳${pricing ? pricing.shippingTotal.toLocaleString() : "120"}`
                    )}
                  </span>
                </div>

                <div className="border-t border-[#141312] pt-3 flex justify-between text-base font-semibold text-[#141312]">
                  <span>Grand Total</span>
                  <span className="text-[#9e472a]">
                    ৳{pricing ? pricing.grandTotal.toLocaleString() : "..."}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || isValidating}
                className="w-full py-4 bg-[#141312] text-[#fbf9f5] font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#9e472a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#9e472a]" />
                    <span>Confirm & Place Order (COD)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
