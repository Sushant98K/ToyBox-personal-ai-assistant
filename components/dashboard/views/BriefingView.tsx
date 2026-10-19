"use client";

import React, { useState } from "react";
import {
  Newspaper,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BriefingView() {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "urgent" | "meetings" | "operations"
  >("all");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Briefing Audio & Summary Hero ─── */}
      <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Evening Edition • 5:00 PM EST</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
              Executive Daily Intelligence Briefing
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl font-[300]">
              Synthesized from 348 signals across Gmail, Slack, WhatsApp, and Google Calendar.
              Listen to the 3-minute executive voice summary or scan the key action points below.
            </p>
          </div>

          {/* Audio Player Widget */}
          <div className="p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--hairline)] flex items-center gap-3.5 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all shrink-0 focus:outline-none"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-6 text-xs font-[600]">
                <span className="text-[var(--ink)] flex items-center gap-1.5 text-[11px]">
                  <Volume2 className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Voice Briefing (AI Host)</span>
                </span>
                <span className="text-[var(--text-muted)] font-mono text-[10px]">01:42 / 03:15</span>
              </div>
              <div className="w-44 h-1 bg-[var(--hairline)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                  style={{ width: isPlaying ? "65%" : "40%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters (Mobbin Segmented Control Language) */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--hairline)] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all focus:outline-none whitespace-nowrap",
              selectedCategory === "all"
                ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            All Items (8)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("urgent")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5",
              selectedCategory === "urgent"
                ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Urgent Decisions (2)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("meetings")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5",
              selectedCategory === "meetings"
                ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Meetings (3)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("operations")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5",
              selectedCategory === "operations"
                ? "bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline)] shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--ink)]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Operations & Revenue (3)</span>
          </button>
        </div>
      </div>

      {/* ─── Briefing Content Cards with Minimal Squircle Icons ─── */}
      <div className="space-y-4">
        {/* Item 1 */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 hover:border-[var(--ink-soft)]/30 transition-colors space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-rose-500 shrink-0 shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <AlertCircle className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500">
                  Critical Decision
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-[500]">
                  Slack #board-directors
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-[652] text-[var(--ink)]">
                Q4 Board Review Call Rescheduled to 4:30 PM EST
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                Lead partner at Benchmark requested a 30-minute delay due to a flight landing later than planned.
                ToyBox audited your schedule and validated that moving this leaves your 6:00 PM family dinner untouched.
              </p>
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity"
                >
                  Send Confirmation Reply
                </button>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-xs font-[600] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--field)] transition-colors"
                >
                  Inspect Calendar Slots
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Item 2 */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 hover:border-[var(--ink-soft)]/30 transition-colors space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-purple-500 shrink-0 shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <Calendar className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Meeting Briefing
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-[500]">
                  Tomorrow • 9:30 AM EST
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-[652] text-[var(--ink)]">
                Product Demo: ToyBox Integration with Enterprise Healthcare Network
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                Attendee: Dr. Marcus Vance (Chief Digital Officer, 12,000 physicians). Key objection predicted: HIPAA compliance
                and data residency. ToyBox prepared a 1-page BAA & SOC-2 cheat sheet attached to the calendar invite.
              </p>
            </div>
          </div>
        </div>

        {/* Item 3 */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 hover:border-[var(--ink-soft)]/30 transition-colors space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-emerald-500 shrink-0 shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Operations Summary
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-[500]">
                  Stripe & Linear Telemetry
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-[652] text-[var(--ink)]">
                Zero High-Severity Incidents • 99.98% System Uptime
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                Engineering deployed 4 automated patches without disruption. All 5 webhooks across Slack, WhatsApp, and Gmail
                responded with sub-180ms latency today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
