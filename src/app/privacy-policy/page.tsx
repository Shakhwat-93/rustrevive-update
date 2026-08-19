import React from "react";
import type { Metadata } from "next";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | Rust & Revive",
  description: "How Rust & Revive protects client confidentiality and order information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Data Stewardship
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e]">
              Last revised: August 2026
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-6 shadow-xs text-xs font-sans-ui text-[#5c574e] leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                1. Information Collection
              </h3>
              <p>
                We only gather personal details strictly necessary for fulfilling your orders &mdash; namely your recipient name, delivery address, contact phone number, and electronic mail.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                2. Payment Security
              </h3>
              <p>
                We never store, record, or retain sensitive payment card numbers, PINs, or financial credentials. All online transactions are processed through encrypted PCI-DSS certified banking gateways.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#ded7c8] pt-4">
              <h3 className="font-serif text-base uppercase tracking-wide text-[#141312] font-semibold">
                3. Zero Third-Party Data Sharing
              </h3>
              <p>
                Rust &amp; Revive does not sell, lease, or monetize customer data. Your contact details are shared solely with our integrated courier fleet (e.g. Steadfast / Pathao) for physical parcel dispatch.
              </p>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
