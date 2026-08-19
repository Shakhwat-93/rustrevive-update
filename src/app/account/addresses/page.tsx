import React from "react";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Delivery Addresses | Rust & Revive Account",
  description: "Manage saved shipping addresses.",
};

export default function AccountAddressesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Delivery Destinations
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Saved Addresses
            </h1>
          </div>

          <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <MapPin className="w-8 h-8 text-[#9e472a] mx-auto" />
            <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
              No saved addresses found
            </h3>
            <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
              Your default delivery destination will be saved automatically during your next checkout.
            </p>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
