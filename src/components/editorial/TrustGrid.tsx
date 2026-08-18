import React from "react";

const TRUST_ITEMS = [
  { title: "CASH ON DELIVERY", description: "Available across Bangladesh" },
  { title: "NATIONWIDE DELIVERY", description: "48–72h doorstep delivery" },
  { title: "EASY EXCHANGE", description: "7-day fit guarantee" },
  { title: "SECURE CHECKOUT", description: "256-bit encrypted transactions" },
];

export function TrustGrid() {
  return (
    <section className="w-full py-12 md:py-16 px-4 sm:px-6 lg:px-12 bg-[#141312] border-t border-b border-[#262421]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="space-y-1">
              <h3 className="font-serif-editorial text-sm sm:text-base md:text-lg uppercase tracking-tight text-[#fbf9f5]">
                {item.title}
              </h3>
              <p className="text-[11px] font-sans-ui text-[#9c9689]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
