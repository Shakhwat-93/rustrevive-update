import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Order History | Rust & Revive Account",
  description: "View past orders and tracking references.",
};

export default function AccountOrdersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Consignment Ledger
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Order History
            </h1>
          </div>

          <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <Package className="w-8 h-8 text-[#9e472a] mx-auto" />
            <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
              No past orders recorded
            </h3>
            <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
              If you placed an order as a guest, you can look up its live delivery status on our tracking portal.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/track-order"
                className="px-6 py-2.5 bg-white border border-[#141312] text-xs font-mono-meta uppercase tracking-wider text-[#141312] hover:bg-[#141312] hover:text-[#fbf9f5] transition-colors"
              >
                Track Guest Order
              </Link>
              <Link
                href="/shop"
                className="px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
