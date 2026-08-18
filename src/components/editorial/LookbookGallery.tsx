"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LOOKBOOK_DATA } from "@/data/homepage.data";

export function LookbookGallery() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -420 : 420;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#fbf9f5]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Section Header with Minimal Chevrons */}
        <div className="flex items-end justify-between pb-4 border-b border-[#ded7c8]">
          <h2 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-[#141312]">
            LOOKBOOK
          </h2>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 border border-[#ded7c8] text-[#5c574e] hover:text-[#141312] hover:border-[#141312] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 border border-[#ded7c8] text-[#5c574e] hover:text-[#141312] hover:border-[#141312] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Visual Gallery */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x snap-mandatory"
        >
          {LOOKBOOK_DATA.map((item) => (
            <div
              key={item.id}
              className="flex-none w-[260px] sm:w-[340px] md:w-[400px] lg:w-[440px] snap-start"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 260px, (max-width: 1024px) 340px, 440px"
                  className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] opacity-95 hover:opacity-100"
                />
              </div>
              <h3 className="pt-2.5 font-serif-editorial text-sm md:text-base uppercase tracking-tight text-[#141312]">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
