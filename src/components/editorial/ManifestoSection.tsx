import React from "react";
import { MANIFESTO_DATA } from "@/data/homepage.data";

export function ManifestoSection() {
  return (
    <section className="w-full py-24 md:py-36 px-4 sm:px-6 lg:px-12 bg-[#f4eee3] text-[#141312]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif-editorial uppercase tracking-tight leading-[0.92] text-[#141312] max-w-5xl">
          <span className="block">{MANIFESTO_DATA.quoteLine1}</span>
          <span className="block italic font-light text-[#9e472a]">
            {MANIFESTO_DATA.quoteLine2}
          </span>
          <span className="block text-[#141312]">{MANIFESTO_DATA.quoteLine3}</span>
        </h2>
      </div>
    </section>
  );
}
