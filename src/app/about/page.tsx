import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata: Metadata = {
  title: "About Our Craft | Rust & Revive",
  description: "Learn about the philosophy, raw materials, and archival craftsmanship behind Rust & Revive garments.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-3 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              The Philosophy
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif uppercase tracking-wider text-[#141312]">
              Archival Craftsmanship
            </h1>
            <p className="text-sm font-sans-ui text-[#5c574e] max-w-xl mx-auto leading-relaxed">
              We create durable garments that improve with age, rejecting fast fashion in favour of raw selvedge weaves and slow construction.
            </p>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-[#ded7c8]">
            <div className="space-y-2">
              <span className="font-mono-meta text-xs font-bold text-[#9e472a]">01 / MATERIALS</span>
              <h3 className="font-serif text-lg uppercase tracking-wide text-[#141312]">Raw Unwashed Weaves</h3>
              <p className="text-xs font-sans-ui text-[#5c574e] leading-relaxed">
                Woven on vintage shuttle looms, our 14.5oz Japanese denim and 280 GSM combed cotton develop a unique patina that reflects your personal journey.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-mono-meta text-xs font-bold text-[#9e472a]">02 / SUSTAINABILITY</span>
              <h3 className="font-serif text-lg uppercase tracking-wide text-[#141312]">Vegetable Tannage</h3>
              <p className="text-xs font-sans-ui text-[#5c574e] leading-relaxed">
                Our leather goods utilize natural bark extracts rather than harsh chromium chemicals, preserving natural grain and longevity.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-mono-meta text-xs font-bold text-[#9e472a]">03 / LONGEVITY</span>
              <h3 className="font-serif text-lg uppercase tracking-wide text-[#141312]">Reinforced Stitches</h3>
              <p className="text-xs font-sans-ui text-[#5c574e] leading-relaxed">
                Bar-tacked stress points, custom copper rivets, and heavy-duty poly-core threads ensure each piece endures decades of wear.
              </p>
            </div>
          </div>

          {/* Statement Quote */}
          <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <blockquote className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[#141312] max-w-2xl mx-auto leading-snug">
              &ldquo;We do not follow seasonal micro-trends. We engineer garments built to outlive the cycle.&rdquo;
            </blockquote>
            <p className="text-xs font-mono-meta uppercase tracking-widest text-[#8c8577]">
              &mdash; Rust &amp; Revive Design Studio, Dhaka
            </p>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
            >
              <span>Explore The Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
