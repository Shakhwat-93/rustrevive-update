"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { CATEGORY_EXPLORER_DATA } from "@/data/homepage.data";

export function CategoryExplorer() {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_EXPLORER_DATA[0]!);

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#f4eee3] border-t border-b border-[#ded7c8]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <SectionHeader
          title="CATEGORY INDEX"
          theme="light"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Typography List */}
          <div className="lg:col-span-7 space-y-1">
            {CATEGORY_EXPLORER_DATA.map((cat) => {
              const isActive = activeCategory.slug === cat.slug;

              return (
                <Link
                  key={cat.slug}
                  href={`/collections/${cat.slug}`}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onFocus={() => setActiveCategory(cat)}
                  className={`group flex items-center justify-between py-3.5 sm:py-4.5 border-b border-[#ded7c8] transition-colors ${
                    isActive ? "text-[#141312]" : "text-[#8c8577] hover:text-[#141312]"
                  }`}
                >
                  <span className="font-serif-editorial text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-2">
                    {cat.title}
                  </span>

                  <ArrowRight className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#9e472a]" />
                </Link>
              );
            })}
          </div>

          {/* Clean Image Preview (Desktop Only) */}
          <div className="lg:col-span-5 relative aspect-[4/5] w-full overflow-hidden bg-[#ebe2d1] border border-[#ded7c8] hidden lg:block">
            <Image
              key={activeCategory.slug}
              src={activeCategory.imageUrl}
              alt={activeCategory.title}
              fill
              sizes="40vw"
              className="object-cover object-center animate-in fade-in duration-300 opacity-95"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
