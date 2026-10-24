"use client";

import React, { useState } from "react";
import {
  Mail,
  Sparkles,
  Clock,
  AlertCircle,
  Play,
  Pause,
  CheckCircle2,
  ArrowUpRight,
  Bot,
  Calendar,
  MessageSquare,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { DashboardTab } from "../../types";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/icons/AppIcons";

interface DashboardOverviewViewProps {
  onNavigateTab: (tab: DashboardTab) => void;
  currentUser?: {
    name?: string;
    email?: string;
  } | null;
}

export function DashboardOverviewView({
  onNavigateTab,
  currentUser,
}: DashboardOverviewViewProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [approvedActionIds, setApprovedActionIds] = useState<number[]>([]);

  const toggleApprove = (id: number) => {
    setApprovedActionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const executiveName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "Executive";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── Hero Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-xs font-[600] text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All 5 Communication Channels Synthesized</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">
              Good evening, {executiveName}.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl font-[300]">
              ToyBox.ai processed 348 incoming messages across Gmail, Slack, WhatsApp, and Outlook. 
              2 high-priority items require your approval, and 36 background tasks were handled autonomously.
            </p>
          </div>

          {/* Audio Executive Briefing Quick-Pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-all font-[600] text-xs sm:text-sm shadow-xs focus:outline-none"
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isPlayingAudio ? "Pause Audio Brief" : "Listen to Brief (3m)"}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("briefing")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--field)] transition-all font-[600] text-xs sm:text-sm focus:outline-none"
            >
              <span>Read Full Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Metric KPI Cards with Minimal Theme Squircles ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Communications */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between hover:border-[var(--ink-soft)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            {/* Minimal Squircle Icon */}
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <Mail className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-[600] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +14% vs yday
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">348</div>
            <div className="text-xs font-[600] text-[var(--ink-soft)] mt-0.5">
              Messages Distilled
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Gmail, Slack, WhatsApp & Outlook
            </div>
          </div>
        </div>

        {/* KPI 2: Autonomous Actions */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between hover:border-[var(--ink-soft)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            {/* Minimal Squircle Icon */}
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <Sparkles className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-[600] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Autopilot
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">36</div>
            <div className="text-xs font-[600] text-[var(--ink-soft)] mt-0.5">
              Autonomous Actions
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Auto-replies, calendar holds & notes
            </div>
          </div>
        </div>

        {/* KPI 3: Time Saved */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between hover:border-[var(--ink-soft)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            {/* Minimal Squircle Icon */}
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <Clock className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-[600] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              This Week
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">16.4 hrs</div>
            <div className="text-xs font-[600] text-[var(--ink-soft)] mt-0.5">
              Executive Time Saved
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              ~2.3 hrs freed up daily for deep work
            </div>
          </div>
        </div>

        {/* KPI 4: Urgent Signals */}
        <div className="rounded-[20px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 flex flex-col justify-between hover:border-[var(--ink-soft)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            {/* Minimal Squircle Icon */}
            <div
              className="w-9 h-9 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-rose-500 shadow-2xs"
              style={{ borderRadius: "30%" }}
            >
              <AlertCircle className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-[600] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              Action Req
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-[652] text-[var(--ink)] tracking-tight">2</div>
            <div className="text-xs font-[600] text-[var(--ink-soft)] mt-0.5">
              Urgent Decisions
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Board rescheduling & NDA sign-off
            </div>
          </div>
        </div>
      </div>

      {/* ─── Two-Column Interactive Sections ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Action Queue & Today's Executive Brief */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Decision Center */}
          <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-rose-500 shadow-2xs"
                  style={{ borderRadius: "30%" }}
                >
                  <AlertCircle className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)]">
                    Pending Executive Decisions
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    ToyBox prepared 1-click execution drafts for your review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("alerts")}
                className="text-xs font-[600] text-[#0066FF] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Decision Item 1 */}
            <div className="p-4 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500">
                      High Priority
                    </span>
                    <span className="text-[11px] font-[500] text-[var(--text-muted)]">
                      Slack #board-directors • 14m ago
                    </span>
                  </div>
                  <h4 className="text-sm font-[600] text-[var(--ink)]">
                    Approve Q4 Strategy Session Rescheduling to 4:30 PM EST
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                    Lead Investor requested a 30-min shift due to flight delay. ToyBox already verified your calendar and found no hard conflicts.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--hairline-soft)]">
                <span className="text-[11px] text-[var(--text-faint)]">
                  Action: Send Slack confirmation & update Google Meet
                </span>
                <button
                  type="button"
                  onClick={() => toggleApprove(1)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 self-start sm:self-auto",
                    approvedActionIds.includes(1)
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{approvedActionIds.includes(1) ? "Executed" : "Approve & Send"}</span>
                </button>
              </div>
            </div>

            {/* Decision Item 2 */}
            <div className="p-4 rounded-[18px] bg-[var(--canvas)] border border-[var(--hairline)] space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Financial Review
                    </span>
                    <span className="text-[11px] font-[500] text-[var(--text-muted)]">
                      WhatsApp VIP Channel • 42m ago
                    </span>
                  </div>
                  <h4 className="text-sm font-[600] text-[var(--ink)]">
                    Sign-off on Revised Enterprise SLA Clause for Datadog integration
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[300]">
                    VP of Procurement sent amended terms. ToyBox legal assistant compared diffs and flagged 99.95% uptime clause as acceptable.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--hairline-soft)]">
                <span className="text-[11px] text-[var(--text-faint)]">
                  Action: Sign PDF & notify account manager via WhatsApp
                </span>
                <button
                  type="button"
                  onClick={() => toggleApprove(2)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-[600] transition-all flex items-center gap-1.5 self-start sm:self-auto",
                    approvedActionIds.includes(2)
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{approvedActionIds.includes(2) ? "Signed & Sent" : "Execute Sign-Off"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Today's Key Highlights Preview */}
          <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs"
                  style={{ borderRadius: "30%" }}
                >
                  <Newspaper className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-[652] text-sm sm:text-base text-[var(--ink)]">
                    Daily Executive Synthesis Highlights
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Compiled automatically from all synced channels
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("briefing")}
                className="text-xs font-[600] text-[#0066FF] hover:underline"
              >
                Read full brief ↗
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-[600] text-[var(--ink)]">
                    Stripe Monthly Run-Rate Reached $142,000 (+18%)
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    New enterprise tier activations accounted for 64% of expansion revenue. No churn events recorded today.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-[600] text-[var(--ink)]">
                    Candidate Offer Accepted: Principal AI Engineer
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Signed offer letter received via Outlook. Onboarding workflow initiated in Notion and Slack #team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)]">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-[600] text-[var(--ink)]">
                    Calendar Gatekeeper Blocked 3 Unsolicited Meeting Invites
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    ToyBox intercepted cold pitch invitations and routed them to standard async review forms, saving 90 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Autonomous Agent Fleet Live Status */}
        <div className="space-y-6">
          <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 flex items-center justify-center bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] shadow-2xs"
                  style={{ borderRadius: "30%" }}
                >
                  <Bot className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-[652] text-sm text-[var(--ink)]">
                    Agent Fleet
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    4 Micro-agents
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("ai-agent")}
                className="text-xs font-[600] text-[#0066FF] hover:underline"
              >
                Manage
              </button>
            </div>

            {/* Agent 1 */}
            <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1"
                  style={{ borderRadius: "30%" }}
                >
                  <SocialIcon name="gmail" size={14} className="w-3.5 h-3.5 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-[600] text-[var(--ink)]">Inbox Triager</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Gmail & Outlook</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Agent 2 */}
            <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1"
                  style={{ borderRadius: "30%" }}
                >
                  <SocialIcon name="whatsapp" size={14} className="w-3.5 h-3.5 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-[600] text-[var(--ink)]">Chat Gatekeeper</p>
                  <p className="text-[10px] text-[var(--text-muted)]">WhatsApp & Telegram</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Agent 3 */}
            <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1"
                  style={{ borderRadius: "30%" }}
                >
                  <SocialIcon name="gcal" size={14} className="w-3.5 h-3.5 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-[600] text-[var(--ink)]">Calendar Assistant</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Google Meet & Cal</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Agent 4 */}
            <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 bg-[var(--canvas)] border border-[var(--hairline)] flex items-center justify-center shrink-0 p-1"
                  style={{ borderRadius: "30%" }}
                >
                  <SocialIcon name="notion" size={14} className="w-3.5 h-3.5 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-[600] text-[var(--ink)]">Briefing Analyst</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Daily Synthesis</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Standby
              </span>
            </div>
          </div>

          {/* Connected Integrations Quick Strip */}
          <div className="rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-[652] text-sm text-[var(--ink)]">
                Live Feeds
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("integrations")}
                className="text-xs font-[600] text-[#0066FF] hover:underline"
              >
                Configure
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center gap-2.5">
                <SocialIcon name="gmail" size={16} className="w-4 h-4 object-contain" />
                <span className="font-[600] text-[var(--ink)] text-xs">Gmail</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center gap-2.5">
                <SocialIcon name="slack" size={16} className="w-4 h-4 object-contain" />
                <span className="font-[600] text-[var(--ink)] text-xs">Slack</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center gap-2.5">
                <SocialIcon name="whatsapp" size={16} className="w-4 h-4 object-contain" />
                <span className="font-[600] text-[var(--ink)] text-xs">WhatsApp</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline-soft)] flex items-center gap-2.5">
                <SocialIcon name="outlook" size={16} className="w-4 h-4 object-contain" />
                <span className="font-[600] text-[var(--ink)] text-xs">Outlook</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
