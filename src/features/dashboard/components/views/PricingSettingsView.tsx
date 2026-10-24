"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingSettingsView() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200 max-w-5xl">
      {/* ─── Header & Current Plan Status ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
              {/* Electric blue commercial accent */}
              <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
              <span>Subscription & Billing Settings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
              Pro Executive Plan Active
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-[300]">
              Your account renews automatically on November 15, 2026. Managed securely via Stripe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--field)] transition-all font-[600] text-xs sm:text-sm focus:outline-none shadow-2xs"
            >
              Stripe Customer Portal ↗
            </button>
          </div>
        </div>

        {/* Usage Quota Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-[var(--hairline)]">
          <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-[500]">Autonomous Actions</span>
              <span className="font-[652] text-[var(--ink)]">1,420 / 5,000</span>
            </div>
            <div className="w-full h-1 bg-[var(--field)] rounded-full overflow-hidden">
              <div className="h-full bg-[#0066FF] rounded-full" style={{ width: "28%" }} />
            </div>
            <span className="text-[10px] text-[var(--text-faint)] block">28% of monthly quota</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-[500]">Connected Feeds</span>
              <span className="font-[652] text-[var(--ink)]">5 / Unlimited</span>
            </div>
            <div className="w-full h-1 bg-[var(--field)] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="text-[10px] text-[var(--text-faint)] block">All channels active</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-[500]">Synthesis Tokens</span>
              <span className="font-[652] text-[var(--ink)]">2.4M / 10M</span>
            </div>
            <div className="w-full h-1 bg-[var(--field)] rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: "24%" }} />
            </div>
            <span className="text-[10px] text-[var(--text-faint)] block">High-tier throughput</span>
          </div>
        </div>
      </div>

      {/* ─── Plan Comparison Cards (Mobbin Exact Specs) ─── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-[652] text-[var(--ink)] tracking-tight">
              Available Subscription Tiers
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Switch billing frequency or upgrade to custom Enterprise guardrails.
            </p>
          </div>

          {/* Mobbin Segmented Control Pill */}
          <div className="inline-flex items-center p-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-[600] transition-all focus:outline-none",
                billingCycle === "monthly"
                  ? "bg-[var(--canvas)] text-[var(--ink)] shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--ink)]"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 focus:outline-none",
                billingCycle === "yearly"
                  ? "bg-[var(--canvas)] text-[var(--ink)] shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--ink)]"
              )}
            >
              <span>Yearly</span>
              {/* Electric blue commercial savings badge */}
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#0066FF] text-white">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tier 1: Starter */}
          <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline-soft)] p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div>
                <h4 className="font-[652] text-base text-[var(--ink)]">Starter</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Basic inbox and Slack synthesis for solo founders.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-[652] text-[var(--ink)]">$0</span>
                <span className="text-xs text-[var(--text-muted)] font-[456]">/ month</span>
              </div>

              <ul className="space-y-2 text-xs text-[var(--ink-soft)] pt-2 border-t border-[var(--hairline-soft)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>1 Connected email account</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Daily morning text brief</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Manual approval required</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-2 rounded-full text-xs font-[600] bg-[var(--field)] text-[var(--text-muted)] cursor-not-allowed"
            >
              Downgrade to Starter
            </button>
          </div>

          {/* Tier 2: Pro (Featured - Mobbin specifications with #0066FF badge) */}
          <div className="rounded-[20px] bg-[var(--canvas-soft)] border-2 border-[var(--hairline)] p-5 flex flex-col justify-between space-y-5 relative shadow-xs">
            {/* Mobbin Popular Badge */}
            <div className="absolute -top-3 right-5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0066FF] text-white shadow-2xs tracking-tight">
                Current Plan
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <h4 className="font-[652] text-base text-[var(--ink)]">Pro Executive</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Full multi-platform autonomous executive assistant.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-[652] text-[var(--ink)]">
                  {billingCycle === "yearly" ? "$29" : "$36"}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-[456]">/ month</span>
              </div>

              <ul className="space-y-2 text-xs text-[var(--ink-soft)] pt-2 border-t border-[var(--hairline)]">
                <li className="flex items-center gap-2 font-[600] text-[var(--ink)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Unlimited connected channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Audio voice briefing synthesis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>WhatsApp & Telegram Concierge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Full Autopilot task execution</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-2 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity"
            >
              Manage Payment Details
            </button>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="rounded-[20px] bg-[var(--canvas)] border border-[var(--hairline-soft)] p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div>
                <h4 className="font-[652] text-base text-[var(--ink)]">Enterprise</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Dedicated tenant, SOC-2 compliance, custom SLA.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-[652] text-[var(--ink)]">Custom</span>
              </div>

              <ul className="space-y-2 text-xs text-[var(--ink-soft)] pt-2 border-t border-[var(--hairline-soft)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Dedicated VPC & on-prem models</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>SOC-2 Type II audit logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Dedicated account architect</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-2 rounded-full text-xs font-[600] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--field)] transition-colors"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>

      {/* ─── Recent Invoices Table ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[#0066FF] shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <FileText className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-[652] text-sm text-[var(--ink)]">
                Billing & Payment Receipts
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                Direct downloads for corporate expense filing
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--hairline-soft)] text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[var(--ink)] font-[600]">INV-2026-1015</span>
              <span className="text-[var(--text-muted)]">Oct 15, 2026</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Paid
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-[652] text-[var(--ink)]">$348.00 (Annual)</span>
              <button
                type="button"
                className="text-xs font-[600] text-[#0066FF] hover:underline"
              >
                PDF ↗
              </button>
            </div>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[var(--ink)] font-[600]">INV-2025-1015</span>
              <span className="text-[var(--text-muted)]">Oct 15, 2025</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Paid
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-[652] text-[var(--ink)]">$348.00 (Annual)</span>
              <button
                type="button"
                className="text-xs font-[600] text-[#0066FF] hover:underline"
              >
                PDF ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
