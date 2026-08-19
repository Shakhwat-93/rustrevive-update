import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | Rust & Revive",
  description: "7-day return and size exchange procedures for unworn garments.",
  alternates: { canonical: "/return-policy" },
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Quality Assurance
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Returns &amp; Exchanges
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e]">
              We stand behind every stitch. If your garment sizing requires alteration, we ensure a seamless exchange.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-6 shadow-xs text-xs font-sans-ui text-[#5c574e] leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                1. 7-Day Exchange Window
              </h3>
              <p>
                Garments may be exchanged for a different size or alternative piece within 7 calendar days of receipt. All items must be unwashed, unworn, and accompanied by their original hangtags and packaging.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                2. Exchange Procedure
              </h3>
              <p>
                To initiate an exchange, contact our concierge at <strong className="text-[#141312]">support@rustrevive.store</strong> or message our support hotline. Our team will arrange a reverse pickup with the courier.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                3. Damaged or Defective Items
              </h3>
              <p>
                In the rare event of a manufacturing defect, Rust &amp; Revive will issue an immediate replacement or full reimbursement including all courier shipping fees.
              </p>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
