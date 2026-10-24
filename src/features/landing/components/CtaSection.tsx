"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";

export function CtaSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/sign-up?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <section id="signup" className="py-16 md:py-24 px-4 sm:px-6 bg-[var(--canvas)] transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] p-8 sm:p-14 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline-soft)] text-xs font-[600] text-[var(--ink)] mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Start your 14-day free trial</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-[650] text-[var(--ink)] leading-[1.08] tracking-tight max-w-2xl mx-auto">
          Reclaim your mental clarity today.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] font-[300] leading-[1.38] max-w-xl mx-auto">
          Join founders, PMs, and operators who have replaced hundreds of noisy notifications with three structured daily summaries.
        </p>

        {/* 5 Connected Inboxes Squircles */}
        <div className="flex items-center justify-center gap-3 my-8">
          {[GmailIcon, SlackIcon, WhatsAppIcon, TelegramIcon, OutlookIcon].map(
            (Icon, idx) => (
              <div
                key={idx}
                className="w-9 h-9 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center"
                style={{ borderRadius: "30%" }}
              >
                <Icon size={18} />
              </div>
            )
          )}
        </div>

        {/* Form with Mobbin text-input & button-primary tokens */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto"
        >
          {/* text-input: field fill, no border at rest, 2px ink ring on focus */}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your work email..."
            className="w-full sm:flex-1 bg-[var(--field)] text-[var(--ink)] placeholder-[var(--text-faint)] text-sm rounded-[16px] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all"
          />
          {/* button-primary: primary fill, on-primary text, rounded-full */}
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)] font-[600] text-sm px-6 py-3 rounded-full transition-all shrink-0 cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-[450]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ink)]" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--ink)]" /> Zero-data retention guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ink)]" /> 2-minute instant setup
          </span>
        </div>
      </div>
    </section>
  );
}
