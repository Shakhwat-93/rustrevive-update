"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_SLIDES, type HeroSlide } from "@/data/homepage.data";

interface CampaignHeroProps {
  slides?: HeroSlide[];
}

export function CampaignHero({ slides }: CampaignHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlides = slides && slides.length > 0 ? slides : HERO_SLIDES;
  const totalSlides = activeSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextSlide();
    if (distance < -50) prevSlide();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const slide = activeSlides[currentSlide] || activeSlides[0]!;

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[80vh] sm:h-[84vh] md:h-[88vh] mt-[65px] md:mt-[75px] bg-[#0e0d0c] overflow-hidden select-none group"
      aria-label="Campaign Hero"
    >
      {/* Background Image Carousel with Film Grain Atmosphere */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={slide.desktopImage || slide.mobileImage || "/placeholder-garment.webp"}
            alt={slide.imageAlt || slide.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-[0.78] contrast-[1.08] saturate-[0.88]"
          />
          {/* Subtle 35mm Analog Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c]/90 via-[#0e0d0c]/30 to-transparent" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-[#0e0d0c]/60" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Hero Copy & Action Buttons */}
      <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto px-6 sm:px-10 md:px-14 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-3xl space-y-4 sm:space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-2 sm:space-y-3"
            >
              <div className="inline-block px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[#eceae5] text-[10px] sm:text-xs font-mono-meta uppercase tracking-[0.24em]">
                {slide.eyebrow || slide.subtitle || "Edition 2026"}
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-editorial font-normal tracking-tight text-[#ffffff] leading-[1.05]">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-[#d8d5cf] font-light max-w-xl line-clamp-2">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Primary Action Button */}
          <div className="flex items-center space-x-4 pt-1">
            <Button
              href={slide.primaryHref || "/shop"}
              variant="primary"
              size="lg"
              className="bg-[#ffffff] text-[#141312] hover:bg-[#eceae5] border-none font-medium px-8 py-3 text-xs tracking-[0.16em]"
            >
              {slide.primaryCTA || "EXPLORE"}
            </Button>
          </div>
        </div>

        {/* Carousel Pagination & Manual Arrow Controls */}
        <div className="flex items-center justify-between pt-8 sm:pt-10 border-t border-white/15 mt-8">
          <div className="flex items-center space-x-2">
            {activeSlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1 transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? "w-8 bg-[#ffffff]"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
