import React from "react";
import { customerTestimonials } from "@/config";

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 bg-[var(--canvas)] border-b border-[var(--hairline-soft)] transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas-soft)] text-xs font-[600] text-[var(--ink)] mb-4 border border-[var(--hairline)]">
            User Experience
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[var(--ink)] leading-[1.13] tracking-tight">
            Trusted by founders and operators.
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] font-[300] leading-[1.38]">
            Here is how executives reclaim hours every day across their unified communications.
          </p>
        </div>

        {/* Testimonials 2x2 Grid with exact Mobbin tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {customerTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-[var(--canvas)] rounded-[16px] p-6 sm:p-7 border border-[var(--hairline-soft)] hover:border-[var(--hairline)] transition-all flex flex-col justify-between"
            >
              <p className="text-[15px] sm:text-[16px] text-[var(--ink)] font-[450] leading-[1.45] mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3.5 pt-4 border-t border-[var(--hairline-soft)]">
                {/* Circular avatar with overlapping mini-badge */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full ${t.avatarBg} text-white flex items-center justify-center font-semibold text-xs tracking-wider`}
                  >
                    {t.initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--ink)] text-[var(--canvas)] text-[9px] font-bold flex items-center justify-center border-2 border-[var(--canvas)]">
                    {t.companyBadge}
                  </div>
                </div>

                <div>
                  <h4 className="font-[600] text-[15px] text-[var(--ink)] leading-snug">
                    {t.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-[450]">
                    {t.role} • {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
