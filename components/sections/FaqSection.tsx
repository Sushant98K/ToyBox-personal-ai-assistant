"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems } from "@/config";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 px-4 sm:px-6 bg-white border-t border-[#f0f0f0]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f3f3] text-xs font-[600] text-[#141414] mb-4">
            Answers & Clarity
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[#141414] leading-[1.13] tracking-tight">
            Frequently asked questions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#707070] font-[300] leading-[1.38]">
            Everything you need to know about security, integrations, and automated workflows.
          </p>
        </div>

        {/* FAQ Accordion Rows */}
        <div className="space-y-3">
          {faqItems.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#f3f3f3] rounded-[16px] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors hover:text-[#141414]"
                  aria-expanded={isOpen}
                >
                  <span className="font-[600] text-[15px] sm:text-[16px] text-[#141414] leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 text-[#141414]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-[15px] text-[#707070] font-[450] leading-relaxed border-t border-[#e0e0e0]/40 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
