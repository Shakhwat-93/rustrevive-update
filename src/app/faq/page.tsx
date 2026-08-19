"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "How does Cash on Delivery (COD) work?",
    a: "We provide nationwide Cash on Delivery across all 64 districts in Bangladesh. You inspect the parcel upon courier arrival and pay the exact invoice amount in cash to the delivery rider.",
  },
  {
    q: "What is your delivery timeframe and shipping charge?",
    a: "Inside Dhaka City, deliveries typically take 24–48 hours at a flat rate of ৳70. Outside Dhaka / Nationwide, deliveries take 48–72 hours via premium courier at ৳120.",
  },
  {
    q: "How do I choose the correct size for raw denim pants?",
    a: "Our raw denim pieces are cut in structured vintage archival fits. Because unwashed denim conforms to your waist and thigh measurements with wear, we recommend selecting your exact true waist size.",
  },
  {
    q: "What is your Return and Exchange policy?",
    a: "We offer a 7-day exchange window from the delivery date for unwashed, unworn garments with original tags intact. Simply reach out to customer care or submit a return inquiry.",
  },
  {
    q: "How should I wash and care for heavyweight cotton and raw denim?",
    a: "Wash inside out in cold water with mild detergent. Never tumble dry or bleach. Hang dry naturally in shade to preserve raw dye vibrancy and fabric integrity.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Frequently Asked
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Customer Guidance
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e]">
              Essential details regarding ordering, parcel delivery, garment care, and exchanges.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] divide-y divide-[#ded7c8] shadow-xs">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="p-4 sm:p-5">
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex justify-between items-center text-left text-xs sm:text-sm font-serif uppercase tracking-wide text-[#141312] font-semibold cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#9e472a] shrink-0 ml-3 transition-transform duration-200 ${
                      openIndex === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openIndex === idx && (
                  <p className="pt-3 text-xs font-sans-ui text-[#5c574e] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
