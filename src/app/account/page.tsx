import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Package, MapPin, Heart, ArrowRight } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "Account Overview | Rust & Revive",
  description: "Manage your past orders, delivery addresses, and saved garments.",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Patron Profile
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Customer Account
            </h1>
            <p className="text-xs font-mono-meta text-[#5c574e]">
              Manage consignments, delivery destinations, and saved favorites.
            </p>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/account/orders"
              className="bg-white border border-[#ded7c8] p-6 space-y-3 hover:border-[#141312] transition-colors group shadow-xs"
            >
              <Package className="w-6 h-6 text-[#9e472a]" />
              <h3 className="font-serif text-base uppercase tracking-wider text-[#141312] group-hover:text-[#9e472a] transition-colors">
                Order History
              </h3>
              <p className="text-xs font-sans-ui text-[#5c574e]">
                View past shipments and live parcel tracking numbers.
              </p>
            </Link>

            <Link
              href="/account/addresses"
              className="bg-white border border-[#ded7c8] p-6 space-y-3 hover:border-[#141312] transition-colors group shadow-xs"
            >
              <MapPin className="w-6 h-6 text-[#9e472a]" />
              <h3 className="font-serif text-base uppercase tracking-wider text-[#141312] group-hover:text-[#9e472a] transition-colors">
                Saved Addresses
              </h3>
              <p className="text-xs font-sans-ui text-[#5c574e]">
                Manage primary shipping locations in Dhaka and nationwide.
              </p>
            </Link>

            <Link
              href="/wishlist"
              className="bg-white border border-[#ded7c8] p-6 space-y-3 hover:border-[#141312] transition-colors group shadow-xs"
            >
              <Heart className="w-6 h-6 text-[#9e472a]" />
              <h3 className="font-serif text-base uppercase tracking-wider text-[#141312] group-hover:text-[#9e472a] transition-colors">
                Saved Wishlist
              </h3>
              <p className="text-xs font-sans-ui text-[#5c574e]">
                View curated essentials saved for future acquisition.
              </p>
            </Link>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-[#ded7c8] pb-3">
              <h3 className="font-serif text-base uppercase tracking-wider text-[#141312]">
                Recent Orders
              </h3>
              <Link
                href="/account/orders"
                className="text-xs font-mono-meta uppercase tracking-wider text-[#9e472a] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="py-8 text-center space-y-3">
              <p className="font-serif text-sm uppercase tracking-wide text-[#141312]">
                No recent orders found
              </p>
              <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
                Once you acquire a piece, your order status and courier tracking history will appear here.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
