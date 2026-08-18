import React from "react";
import { STATEMENT_DATA } from "@/data/homepage.data";

export function StatementSection() {
  return (
    <section className="w-full py-20 md:py-32 px-4 sm:px-6 lg:px-12 bg-[#141312]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Large Editorial Headline */}
        <div className="max-w-4xl space-y-1">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif-editorial uppercase tracking-tight leading-[0.95] text-[#fbf9f5]">
            <span className="block">{STATEMENT_DATA.headlineLine1}</span>
            <span className="block text-[#9e472a] italic font-light">
              {STATEMENT_DATA.headlineLine2}
            </span>
            <span className="block text-[#ece5d8]">{STATEMENT_DATA.headlineLine3}</span>
          </h2>
        </div>

        {/* Single Short Phrase */}
        <p className="text-sm sm:text-base font-sans-ui text-[#9c9689] max-w-xl leading-relaxed">
          {STATEMENT_DATA.subtext}
        </p>
      </div>
    </section>
  );
}
