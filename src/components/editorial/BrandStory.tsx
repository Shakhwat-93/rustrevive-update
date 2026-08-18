import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BRAND_STORY_DATA } from "@/data/homepage.data";

export function BrandStory() {
  return (
    <section className="w-full py-16 md:py-28 px-4 sm:px-6 lg:px-12 bg-[#141312]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Large Image */}
          <div className="lg:col-span-7 relative h-[380px] sm:h-[480px] md:h-[560px] w-full overflow-hidden bg-[#1c1a18]">
            <Image
              src={BRAND_STORY_DATA.imageUrl}
              alt={BRAND_STORY_DATA.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center contrast-105 saturate-95"
            />
          </div>

          {/* Simple Clean Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-editorial uppercase tracking-tight leading-[1] text-[#fbf9f5]">
              {BRAND_STORY_DATA.headlineLine2}
            </h2>

            <p className="text-sm sm:text-base font-sans-ui text-[#9c9689] leading-relaxed max-w-md">
              {BRAND_STORY_DATA.paragraph1}
            </p>

            <div className="pt-2">
              <Button
                variant="editorial"
                size="md"
                href={BRAND_STORY_DATA.ctaHref}
                showArrow
              >
                OUR STORY
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
