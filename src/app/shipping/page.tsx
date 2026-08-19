import React from "react";
import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Rust & Revive",
  description: "Nationwide courier delivery timelines, rates, and dispatch procedures across Bangladesh.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Logistics Standard
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Shipping &amp; Delivery
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e]">
              Carefully wrapped garments dispatched from our Dhaka fulfillment center.
            </p>
          </div>

          {/* Rates Table */}
          <div className="bg-white border border-[#ded7c8] p-6 space-y-6 shadow-xs">
            <h3 className="font-serif text-base uppercase tracking-wider text-[#141312]">
              Standard Delivery Rates &amp; Timelines
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-meta">
              <div className="p-4 border border-[#ded7c8] space-y-1.5 bg-[#fbf9f5]">
                <div className="flex items-center space-x-2 text-[#9e472a] font-bold">
                  <Truck className="w-4 h-4" />
                  <span>DHAKA CITY</span>
                </div>
                <p className="text-base font-bold text-[#141312]">৳70 Flat Rate</p>
                <p className="text-[#5c574e]">24 to 48 Hours transit time</p>
              </div>

              <div className="p-4 border border-[#ded7c8] space-y-1.5 bg-[#fbf9f5]">
                <div className="flex items-center space-x-2 text-[#9e472a] font-bold">
                  <Truck className="w-4 h-4" />
                  <span>ALL 64 DISTRICTS</span>
                </div>
                <p className="text-base font-bold text-[#141312]">৳120 Flat Rate</p>
                <p className="text-[#5c574e]">48 to 72 Hours nationwide delivery</p>
              </div>
            </div>
          </div>

          {/* Detailed Policy Text */}
          <div className="space-y-6 text-xs font-sans-ui text-[#5c574e] leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-serif text-sm uppercase tracking-wide text-[#141312] font-semibold">
                Order Processing Window
              </h4>
              <p>
                All orders placed before 3:00 PM (Saturday &ndash; Thursday) are packaged and handed over to our courier partner on the same business day. Orders placed on Fridays are dispatched on the following Saturday morning.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif text-sm uppercase tracking-wide text-[#141312] font-semibold">
                Live Parcel Tracking
              </h4>
              <p>
                As soon as your parcel is registered with Steadfast or Pathao logistics, you will receive an SMS containing your tracking reference ID. You can also track your live parcel status directly on our <a href="/track-order" className="text-[#9e472a] underline">Track Order Portal</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
