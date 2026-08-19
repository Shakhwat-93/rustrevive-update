import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Terms & Conditions | Rust & Revive",
  description: "Terms governing commercial transactions, orders, and services by Rust & Revive.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Legal Framework
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e]">
              Last revised: August 2026
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-6 shadow-xs text-xs font-sans-ui text-[#5c574e] leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                1. Acceptance of Terms
              </h3>
              <p>
                By placing an order or acquiring garments through Rust &amp; Revive (`rustrevive.store`), you agree to comply with our commercial terms and delivery stipulations.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                2. Pricing &amp; Currency
              </h3>
              <p>
                All prices listed on the storefront are denominated in Bangladeshi Taka (BDT ৳) and inclusive of statutory VAT. Delivery fees are itemized during final checkout.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                3. Order Acceptance
              </h3>
              <p>
                Rust &amp; Revive reserves the right to decline or cancel an order in the event of inventory discrepancies, fraudulent indicators, or unserviceable delivery locations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
