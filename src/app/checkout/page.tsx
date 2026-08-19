"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  Banknote,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Package,
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
  const { items, clearCart } = useCart();

  // Stable idempotency key for this checkout attempt
  const [idempotencyKey] = useState(() => `rr_checkout_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "Dhaka",
    area: "",
    postalCode: "",
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
  }, [items, selectedShippingId]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.addressLine1.trim() || !form.city.trim()) {
      setErrorMsg("Please fill in all required shipping and contact fields.");
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
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          area: form.area.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: "Bangladesh",
        },
        shippingMethodId: selectedShippingId || undefined,
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
                    placeholder="e.g. Shakib Al Hasan"
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
                    placeholder="017XXXXXXXX"
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
                    placeholder="shakib@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4">
                2. Shipping Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Street Address & House Details *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House #12, Road #4, Block #B, Banani"
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                      City / District *
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                      <option value="Other">Other Region</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                      Area / Thana
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gulshan"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      placeholder="1212"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1">
                    Special Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Leave package with reception or call before arriving"
                    value={form.customerNotes}
                    onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#fcfbf9] border border-[#d5cfc2] focus:border-[#9e472a] focus:bg-white outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Shipping Method Selection */}
            <div className="bg-white border border-[#e8e2d5] p-6 shadow-sm">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] border-b border-[#f0ebe1] pb-3 mb-4 flex items-center justify-between">
                <span>3. Delivery Method</span>
                <Truck className="w-4 h-4 text-[#9e472a]" />
              </h2>

              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const isSelected = selectedShippingId === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#9e472a] bg-[#faf6f0]"
                          : "border-[#e8e2d5] hover:border-[#b8b09f] bg-[#fcfbf9]"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          checked={isSelected}
                          onChange={() => setSelectedShippingId(method.id)}
                          className="mt-1 accent-[#9e472a]"
                        />
                        <div>
                          <p className="text-xs font-mono font-semibold text-[#141312]">
                            {method.name}
                          </p>
                          <p className="text-[11px] text-[#6E6B63] font-sans mt-0.5">
                            {method.description} ({method.estimated_days})
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#9e472a]">
                        ৳{method.price}
                      </span>
                    </label>
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

              {/* Server Price Calculation Breakdown */}
              <div className="border-t border-[#f0ebe1] pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#6E6B63]">
                  <span>Subtotal</span>
                  <span className="text-[#141312]">
                    ৳{pricing ? pricing.subtotal.toLocaleString() : "..."}
                  </span>
                </div>
                <div className="flex justify-between text-[#6E6B63]">
                  <span>Shipping</span>
                  <span className="text-[#141312]">
                    ৳{pricing ? pricing.shippingTotal.toLocaleString() : "120"}
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

              <div className="pt-2 text-center text-[10px] font-mono text-[#8E8B82] space-y-1">
                <p className="flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>Verified 256-Bit Encrypted Commerce Pipeline</span>
                </p>
                <p>Delivery inspection guaranteed across Bangladesh.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
