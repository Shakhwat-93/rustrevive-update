import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center space-y-6">
          <span className="text-xs font-mono-meta uppercase tracking-[0.3em] text-[#9e472a] font-semibold">
            404 &mdash; Archival Record Not Found
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif uppercase tracking-wider text-[#141312]">
            Piece Unavailable
          </h1>
          <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e] max-w-sm mx-auto leading-relaxed">
            The page or garment you are looking for has been archived, relocated, or does not exist in our catalog.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold transition-colors shadow-xs"
            >
              <span>Return to Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
