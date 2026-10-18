"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { pricingPlans } from "@/config";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  return (
    <section id="pricing" className="py-20 md:py-32 px-4 sm:px-6 bg-[var(--canvas)] transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas-soft)] text-xs font-[600] text-[var(--ink)] mb-4 border border-[var(--hairline)]">
            Membership Plans
          </span>
          <h2 className="text-3xl sm:text-5xl font-[650] text-[var(--ink)] leading-[1.1] tracking-tight">
            Fair pricing. Clear ROI.
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] font-[300] leading-[1.38]">
            Start with our 14-day risk-free trial. Upgrade or cancel anytime with a single click.
          </p>

          {/* Segmented Control - Billing Toggle with Mobbin spec */}
          <div className="mt-8 inline-flex items-center p-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-[600] transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[var(--raised)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-[600] transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-[var(--raised)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <span>Billed Annually</span>
              {/* Electric Blue Savings callout (permitted commercial signal) */}
              <span className="bg-[#0066ff] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2-Up Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => {
            const isFeatured = plan.isPopular;
            const price =
              billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-[24px] p-7 sm:p-9 transition-all flex flex-col justify-between ${
                  isFeatured
                    ? "bg-[var(--canvas-soft)] border border-[var(--hairline)] relative"
                    : "bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--ink)]/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-2xl font-[650] text-[var(--ink)]">
                        {plan.name}
                      </h3>
                      {plan.badge && (
                        <span className="bg-[#0066ff] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-[600] px-3 py-1 rounded-full ${
                        isFeatured
                          ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)]"
                          : "bg-[var(--canvas-soft)] text-[var(--text-muted)]"
                      }`}
                    >
                      {plan.audienceBadge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)] font-[450]">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-[650] text-[var(--ink)] tracking-tight">
                      ${price}
                    </span>
                    <span className="text-sm text-[var(--text-muted)] font-[450]">
                      / month billed {billingCycle === "annual" ? "annually" : "monthly"}
                    </span>
                  </div>

                  <div className="mt-8 space-y-3.5 border-t border-[var(--hairline)] pt-6">
                    <span className="text-xs font-[650] text-[var(--ink)] uppercase tracking-wider">
                      {isFeatured ? "Everything in Starter, plus:" : "What is included:"}
                    </span>
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-sm text-[var(--ink)]"
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isFeatured ? "bg-[var(--canvas)]" : "bg-[var(--canvas-soft)]"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 text-[var(--ink)]" />
                        </div>
                        <span
                          className={`font-[450] ${
                            isFeatured ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-9">
                  <a
                    href="#signup"
                    className={`w-full inline-flex items-center justify-center gap-2 font-[600] text-sm py-3.5 rounded-full transition-all ${
                      isFeatured
                        ? "bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)]"
                        : "bg-[var(--canvas)] hover:bg-[var(--canvas-soft)] text-[var(--ink)] border border-[var(--hairline)]"
                    }`}
                  >
                    <span>{plan.ctaLabel}</span>
                    <ArrowRight
                      className={`w-4 h-4 ${
                        isFeatured ? "text-[var(--on-primary)]" : "text-[var(--text-muted)]"
                      }`}
                    />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
