"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_SLIDES } from "@/data/homepage.data";

export function CampaignHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

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

  const slide = HERO_SLIDES[currentSlide]!;

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
      {/* Full-bleed Campaign Photography */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          {/* Desktop Image */}
          <div className="hidden sm:block absolute inset-0">
            <Image
              src={slide.desktopImage}
              alt={slide.imageAlt}
              fill
              priority={currentSlide === 0}
              sizes="100vw"
              className="object-cover object-[center_35%] opacity-70 contrast-105 saturate-95"
            />
          </div>

          {/* Mobile Image */}
          <div className="block sm:hidden absolute inset-0">
            <Image
              src={slide.mobileImage}
              alt={slide.imageAlt}
              fill
              priority={currentSlide === 0}
              sizes="100vw"
              className="object-cover object-[center_30%] opacity-70 contrast-105 saturate-95"
            />
          </div>

          {/* Minimal Dark Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c]/90 via-[#0e0d0c]/20 to-[#0e0d0c]/40" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content: Focused & Minimal */}
      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-4 pointer-events-auto"
          >
            {/* Clean Display Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif-editorial uppercase tracking-tight leading-[0.92] text-[#fbf9f5]">
              {slide.title}
            </h1>

            {/* Short Supporting Line */}
            <p className="text-xs sm:text-sm font-sans-ui text-[#ece5d8]/80 max-w-md">
              {slide.description}
            </p>

            {/* Single Primary Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                href={slide.primaryHref}
                showArrow
              >
                {slide.primaryCTA}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Minimal Numeric Slide Pagination */}
        <div className="absolute bottom-6 right-4 sm:right-6 lg:right-12 flex items-center space-x-3 text-xs font-mono-meta pointer-events-auto">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-colors cursor-pointer py-1 ${
                currentSlide === idx
                  ? "text-[#fbf9f5] font-semibold border-b border-[#9e472a]"
                  : "text-[#666258] hover:text-[#9c9689]"
              }`}
              aria-label={`Slide ${idx + 1}`}
            >
              {s.slideNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Edge Chevrons (Desktop Hover) */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 text-[#fbf9f5]/60 hover:text-[#fbf9f5] items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 text-[#fbf9f5]/60 hover:text-[#fbf9f5] items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}
