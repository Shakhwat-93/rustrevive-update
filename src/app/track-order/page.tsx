"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { DeliveryStatus, OrderStatus } from "@/types/database.types";

interface TrackingResult {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  fulfillmentStatus: string;
  paymentStatus: string;
  placedAt: string;
  shippingDestination: string;
  fulfillment?: {
    trackingNumber: string;
    status: DeliveryStatus;
    courierName: string;
    updatedAt: string;
  } | null;
  timeline: {
    id: string;
    event_type: string;
    message: string;
    created_at: string;
    created_by: string;
  }[];
}

const STEP_ORDER: { key: string; label: string }[] = [
  { key: "PLACED", label: "Order Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SHIPPED", label: "Dispatched" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg("Please enter both your Order Reference and Phone Number.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);

      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error?.message || "Order not found with provided credentials.");
      } else {
        setResult(json.data);
      }
    } catch {
      setErrorMsg("Failed to connect to tracking server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine active step index
  const getStepIndex = (res: TrackingResult): number => {
    if (res.status === "DELIVERED" || res.fulfillment?.status === "DELIVERED") return 5;
    if (res.fulfillment?.status === "OUT_FOR_DELIVERY") return 4;
    if (res.fulfillment?.status === "IN_TRANSIT" || res.fulfillment?.status === "PICKED_UP") return 3;
    if (res.fulfillmentStatus === "FULFILLED" || res.status === "SHIPPED" || res.fulfillment?.status === "CREATED") return 2;
    if (res.status === "CONFIRMED" || res.status === "PROCESSING") return 1;
    return 0;
  };

  const currentStep = result ? getStepIndex(result) : 0;

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#141312] pt-24 pb-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Page Hero */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
            Post-Purchase Logistics
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
            Track Your Consignment
          </h1>
          <p className="text-xs font-mono text-[#6E6B63] max-w-md mx-auto">
            Enter your order reference and the phone number used during checkout to inspect live parcel movements.
          </p>
        </div>

        {/* 2-Factor Lookup Form */}
        <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1.5 font-semibold">
                  Order Reference *
                </label>
                <input
                  type="text"
                  placeholder="e.g. RR-100001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#ded7c8] bg-[#faf6f0] focus:border-[#141312] focus:bg-white outline-none uppercase transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6B63] mb-1.5 font-semibold">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#ded7c8] bg-[#faf6f0] focus:border-[#141312] focus:bg-white outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#141312] text-[#fbf9f5] font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#9e472a] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating Parcel...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Consignment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Tracking Result */}
        {result && (
          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-8 shadow-sm">
            {/* Header Status Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f0ebe1] pb-6 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono font-bold text-[#9e472a]">
                    {result.orderNumber}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#faf6f0] border border-[#e8e2d5] text-[#141312]">
                    {result.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#6E6B63] mt-1">
                  Recipient: {result.customerName} • Destination: {result.shippingDestination}
                </p>
              </div>

              {result.fulfillment && (
                <div className="sm:text-right text-xs font-mono space-y-0.5">
                  <p className="text-[#6E6B63]">Courier Partner:</p>
                  <p className="font-semibold text-[#141312]">{result.fulfillment.courierName}</p>
                  <p className="text-[11px] text-[#9e472a] font-bold">
                    ID: {result.fulfillment.trackingNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Visual Stepper */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] mb-6">
                Delivery Progress
              </h3>

              <div className="relative">
                {/* Connecting Line */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#e8e2d5] -translate-y-1/2 z-0" />

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                  {STEP_ORDER.map((step, idx) => {
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.key} className="flex flex-col sm:items-center text-left sm:text-center space-y-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-colors ${
                            isCurrent
                              ? "bg-[#9e472a] text-white ring-4 ring-[#9e472a]/20"
                              : isPassed
                              ? "bg-[#141312] text-white"
                              : "bg-[#faf6f0] border border-[#ded7c8] text-[#8E8B82]"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider ${
                            isPassed ? "font-semibold text-[#141312]" : "text-[#8E8B82]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="border-t border-[#f0ebe1] pt-6 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312]">
                Detailed Dispatch Ledger
              </h3>

              <div className="space-y-3">
                {result.timeline?.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 text-xs font-mono">
                    <div className="w-2 h-2 rounded-full bg-[#9e472a] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 border-b border-[#f0ebe1] pb-2 last:border-0">
                      <p className="font-semibold text-[#141312]">{event.message}</p>
                      <span className="text-[10px] text-[#8E8B82]">
                        {new Date(event.created_at).toLocaleString()} • Logged by {event.created_by}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee Footer */}
            <div className="border-t border-[#f0ebe1] pt-4 flex items-center space-x-2 text-[11px] font-mono text-[#8E8B82]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Rust & Revive White-Glove Guarantee. All consignments are tamper-sealed and verified.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
