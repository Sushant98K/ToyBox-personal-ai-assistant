"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { supportedIntegrations } from "@/config";
import { SocialIcon } from "@/components/icons";

export function IntegrationMarquee() {
  // 4x duplicate ensures seamless looping even on ultra-wide / 4K displays (>3840px)
  const marqueeItems = [
    ...supportedIntegrations,
    ...supportedIntegrations,
    ...supportedIntegrations,
    ...supportedIntegrations,
  ];

  return (
    <section id="integrations" className="py-16 md:py-24 border-y border-[var(--hairline-soft)] bg-[var(--canvas)] overflow-hidden transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[var(--ink)] leading-[1.13] tracking-tight">
          Connect every inbox and messenger in 60 seconds.
        </h2>
        <p className="mt-4 text-lg text-[var(--text-muted)] font-[300] leading-[1.38] max-w-2xl mx-auto">
          Toybox establishes read-and-synthesize connections through official APIs and certified OAuth 2.0. No credential sharing, zero unencrypted storage.
        </p>
      </div>

      {/* Marquee Track with soft edge fade masks */}
      <div className="relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_32px,_black_calc(100%-32px),transparent_100%)]">
        {/* Fallback edge gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[var(--canvas)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[var(--canvas)] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-4 py-2">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-4 bg-[var(--canvas-soft)] hover:bg-[var(--field)] border border-[var(--hairline)] rounded-[20px] px-5 py-3.5 shrink-0 min-w-[270px] transition-all select-none cursor-default"
            >
              {/* iOS-style 30% Squircle Icon */}
              <div
                className="w-12 h-12 flex items-center justify-center bg-[var(--canvas)] overflow-hidden shrink-0 border border-[var(--hairline-soft)]"
                style={{ borderRadius: "30%" }}
              >
                <SocialIcon
                  name={item.id}
                  size={26}
                  className="w-6.5 h-6.5 object-contain"
                />
              </div>

              {/* Text Info - Protected from awkward wrapping */}
              <div className="text-left whitespace-nowrap min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-[650] text-[15px] sm:text-[16px] text-[var(--ink)] tracking-tight whitespace-nowrap">
                    {item.name}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="text-xs text-[var(--text-muted)] font-[450] mt-0.5 whitespace-nowrap">
                  {item.role}
                </div>
                <div className="text-[10px] text-[var(--text-faint)] font-[450] whitespace-nowrap">
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Spec Metric Strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
          <div className="text-2xl sm:text-3xl font-[650] text-[var(--ink)]">
            5 Inboxes
          </div>
          <div className="text-xs text-[var(--text-muted)] font-[450] mt-1">
            Simultaneously unified
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
          <div className="text-2xl sm:text-3xl font-[650] text-[var(--ink)]">
            15 Sec
          </div>
          <div className="text-xs text-[var(--text-muted)] font-[450] mt-1">
            Real-time polling cadence
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
          <div className="text-2xl sm:text-3xl font-[650] text-[var(--ink)]">
            0 Bytes
          </div>
          <div className="text-xs text-[var(--text-muted)] font-[450] mt-1">
            Retained raw message data
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
          <div className="text-2xl sm:text-3xl font-[650] text-[var(--ink)]">
            SOC-2
          </div>
          <div className="text-xs text-[var(--text-muted)] font-[450] mt-1">
            Compliant enclave architecture
          </div>
        </div>
      </div>
    </section>
  );
}
